import React from 'react';
import { ExternalLink, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-[#200052] via-[#300070] to-[#200052] border-t border-[#836EF9]/30 mt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-6">
          {/* Company Info */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <div className="bg-gradient-to-r from-[#836EF9] to-[#A0055D] rounded-full p-3 mr-3">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">Humi</h3>
                <p className="text-[#FBFAF9] text-sm">Blockchain Gaming Developer</p>
              </div>
            </div>
            <p className="text-[#FBFAF9] text-sm max-w-md mx-auto md:mx-0">
              Creating innovative gaming experiences on the Monad blockchain with cutting-edge technology and engaging gameplay.
            </p>
          </div>

          {/* Social Links */}
          <div className="text-center">
            <h4 className="text-white font-semibold mb-4">Connect with Humi</h4>
            <div className="space-y-3">
              <a
                href="https://x.com/Humis110"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 text-[#FBFAF9] hover:text-[#836EF9] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>@Humis110</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              
              <a
                href="https://github.com/Humi-99"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 text-[#FBFAF9] hover:text-[#836EF9] transition-colors"
              >
                <Github className="w-5 h-5" />
                <span>Humi-99</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              
              <div className="flex items-center justify-center space-x-2 text-[#FBFAF9]">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span>humi_999</span>
              </div>
            </div>
          </div>

          {/* Monad Blockchain */}
          <div className="text-center md:text-right">
            <h4 className="text-white font-semibold mb-4">Built on Monad</h4>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-[#836EF9]/20 to-[#A0055D]/20 rounded-lg p-4 border border-[#836EF9]/30">
                <div className="text-2xl mb-2">⚡</div>
                <p className="text-[#836EF9] font-bold text-lg mb-1">MONAD BLOCKCHAIN</p>
                <p className="text-[#FBFAF9] text-sm">
                  Ultra-fast, EVM-compatible blockchain delivering superior performance and scalability
                </p>
              </div>
              <div className="text-xs text-[#FBFAF9] opacity-80">
                All games and smart contracts deployed on Monad Network
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#836EF9]/20 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-[#FBFAF9] text-sm">
                © 2024 <span className="text-[#836EF9] font-semibold">Humi</span>. All rights reserved.
              </p>
              <p className="text-xs text-[#FBFAF9] opacity-70 mt-1">
                Developed with ❤️ for the Monad ecosystem
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-[#836EF9]/20 px-4 py-2 rounded-lg border border-[#836EF9]/30">
                <p className="text-[#836EF9] font-bold text-sm">MONAD POLICY</p>
                <p className="text-xs text-[#FBFAF9] opacity-80">Compliant & Secure</p>
              </div>
              
              <div className="text-right">
                <p className="text-[#A0055D] font-semibold text-sm">MoanGem Platform</p>
                <p className="text-xs text-[#FBFAF9] opacity-70">Next-Gen Blockchain Gaming</p>
              </div>
            </div>
          </div>
        </div>

        {/* Blockchain Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#836EF9] to-[#A0055D] px-6 py-2 rounded-full">
            <span className="text-white font-bold text-sm">⛓️ ALL MADE ON MONAD BLOCKCHAIN</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;