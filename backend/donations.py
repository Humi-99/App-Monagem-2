import os
import logging
from typing import Optional, Dict, Any
from web3 import Web3
from eth_account import Account
from datetime import datetime
from models import Donation, DonationRequest, DonationResponse

logger = logging.getLogger(__name__)

class DonationService:
    def __init__(self):
        # Monad Testnet configuration
        self.rpc_url = "https://dev0x-rpc.monad.xyz"
        self.chain_id = 10143
        self.contract_address = "0xC443647582B1484f9Aba3A6C0B98df59918E17e2"
        
        # Initialize Web3
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        # Validate connection - use mock mode if connection fails (for testing)
        self.mock_mode = False
        try:
            if not self.w3.is_connected():
                logger.warning("Failed to connect to Monad Testnet - using mock mode for testing")
                self.mock_mode = True
            else:
                logger.info(f"Connected to Monad Testnet, chain ID: {self.w3.eth.chain_id}")
        except Exception as e:
            logger.warning(f"Web3 connection error: {e} - using mock mode for testing")
            self.mock_mode = True

    def validate_donation_request(self, request: DonationRequest) -> Dict[str, Any]:
        """Validate donation request parameters"""
        errors = []
        
        # Validate amount
        if request.amount <= 0:
            errors.append("Donation amount must be positive")
        
        if request.amount > 1000:  # Reasonable maximum
            errors.append("Donation amount too large (max 1000 MON)")
        
        # Validate address format
        if not Web3.is_address(request.donor_address):
            errors.append("Invalid Ethereum address format")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }

    async def estimate_gas_and_fees(self, donor_address: str, amount_wei: int) -> Dict[str, Any]:
        """Estimate gas and transaction fees"""
        try:
            # Get current gas price
            gas_price = self.w3.eth.gas_price
            
            # Estimate gas for simple transfer (MON tokens are native, so it's a simple transfer)
            gas_estimate = 21000  # Standard transfer gas limit
            
            # Calculate total fee
            total_fee_wei = gas_price * gas_estimate
            total_fee_mon = Web3.from_wei(total_fee_wei, 'ether')
            
            # Check if user has enough balance
            balance_wei = self.w3.eth.get_balance(donor_address)
            balance_mon = Web3.from_wei(balance_wei, 'ether')
            
            required_total = amount_wei + total_fee_wei
            
            return {
                "gas_price_gwei": Web3.from_wei(gas_price, 'gwei'),
                "gas_estimate": gas_estimate,
                "total_fee_mon": float(total_fee_mon),
                "user_balance_mon": float(balance_mon),
                "required_total_wei": required_total,
                "sufficient_balance": balance_wei >= required_total
            }
            
        except Exception as e:
            logger.error(f"Gas estimation failed: {e}")
            return {
                "error": str(e),
                "sufficient_balance": False
            }

    def build_donation_transaction(self, donor_address: str, amount: float) -> Dict[str, Any]:
        """Build the donation transaction"""
        try:
            # Convert amount to wei
            amount_wei = Web3.to_wei(amount, 'ether')
            
            # Get transaction count (nonce)
            nonce = self.w3.eth.get_transaction_count(donor_address)
            
            # Get gas price
            gas_price = self.w3.eth.gas_price
            
            # Build transaction
            transaction = {
                'to': Web3.to_checksum_address(self.contract_address),
                'value': amount_wei,
                'gas': 21000,  # Standard transfer
                'gasPrice': gas_price,
                'nonce': nonce,
                'chainId': self.chain_id
            }
            
            return {
                "transaction": transaction,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Transaction building failed: {e}")
            return {
                "error": str(e),
                "success": False
            }

    def get_transaction_status(self, tx_hash: str) -> Dict[str, Any]:
        """Get the status of a transaction"""
        try:
            # Try to get transaction receipt
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            
            if receipt:
                status = "confirmed" if receipt.status == 1 else "failed"
                return {
                    "status": status,
                    "block_number": receipt.blockNumber,
                    "gas_used": receipt.gasUsed,
                    "confirmations": self.w3.eth.block_number - receipt.blockNumber + 1
                }
            else:
                return {"status": "pending"}
                
        except Exception as e:
            # Transaction might be pending or not found
            try:
                # Check if transaction exists (pending)
                self.w3.eth.get_transaction(tx_hash)
                return {"status": "pending"}
            except Exception:
                return {"status": "not_found", "error": "Transaction not found"}

    async def process_donation(self, donation_request: DonationRequest, db) -> DonationResponse:
        """Process a donation request"""
        try:
            # Validate request
            validation = self.validate_donation_request(donation_request)
            if not validation["valid"]:
                return DonationResponse(
                    success=False,
                    message=f"Validation failed: {', '.join(validation['errors'])}",
                    amount=donation_request.amount
                )

            # Convert amount to wei for gas estimation
            amount_wei = Web3.to_wei(donation_request.amount, 'ether')
            
            # Estimate gas and check balance
            gas_info = await self.estimate_gas_and_fees(donation_request.donor_address, amount_wei)
            
            if "error" in gas_info:
                return DonationResponse(
                    success=False,
                    message=f"Gas estimation failed: {gas_info['error']}",
                    amount=donation_request.amount
                )
            
            if not gas_info.get("sufficient_balance", False):
                return DonationResponse(
                    success=False,
                    message=f"Insufficient balance. Required: {Web3.from_wei(gas_info['required_total_wei'], 'ether'):.4f} MON, Available: {gas_info['user_balance_mon']:.4f} MON",
                    amount=donation_request.amount
                )

            # Build transaction
            tx_info = self.build_donation_transaction(
                donation_request.donor_address, 
                donation_request.amount
            )
            
            if not tx_info["success"]:
                return DonationResponse(
                    success=False,
                    message=f"Transaction building failed: {tx_info['error']}",
                    amount=donation_request.amount
                )

            # Store donation record in database
            donation = Donation(
                donor_address=donation_request.donor_address,
                amount=donation_request.amount,
                message=donation_request.message,
                status="prepared"
            )
            
            await db.create_donation(donation)
            
            return DonationResponse(
                success=True,
                message="Donation prepared successfully. Please sign the transaction in your wallet.",
                amount=donation_request.amount,
                transaction_hash=None  # Will be set after user signs
            )
            
        except Exception as e:
            logger.error(f"Donation processing failed: {e}")
            return DonationResponse(
                success=False,
                message=f"Internal error: {str(e)}",
                amount=donation_request.amount
            )

    async def confirm_donation(self, tx_hash: str, db) -> Dict[str, Any]:
        """Confirm a donation after transaction is submitted"""
        try:
            # Update donation record with transaction hash
            await db.update_donation_tx_hash(tx_hash)
            
            # Get transaction status
            status_info = self.get_transaction_status(tx_hash)
            
            return {
                "success": True,
                "transaction_hash": tx_hash,
                "status": status_info.get("status", "pending"),
                "message": "Donation transaction submitted successfully"
            }
            
        except Exception as e:
            logger.error(f"Donation confirmation failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }