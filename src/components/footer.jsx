import React from "react";
import Youtube from "../images/youtube.svg";
import Instagram from "../images/instagram.svg";
import Linkedin from "../images/linkedin.svg";
import Discord from "../images/discord.svg";

function Footer() {
  return (
    <footer id="footer" className="bg-stone-950 text-stone-300 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Section */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-serif text-white tracking-tight">The Guild</h3>
              <p className="text-amber-500 text-[10px] uppercase tracking-[0.3em] mt-1">
                The Artisan Guild
              </p>
            </div>
            <p className="text-sm leading-relaxed text-stone-400 max-w-xs">
              Connecting the world to the heritage of manual mastery. We believe in quality that lasts for generations.
            </p>
          </div>

          {/* Contact Section */}
          <div className="space-y-6">
            <h4 className="text-white font-medium text-sm uppercase tracking-widest">Inquiries</h4>
            <div className="space-y-3 text-sm">
              <p className="hover:text-amber-500 transition-colors cursor-pointer">info@theguild.com</p>
              <p className="hover:text-amber-500 transition-colors cursor-pointer">+234 905-617-1492</p>
              <p className="text-stone-500">Abuja, Nigeria</p>
            </div>
          </div>

          {/* Explore Section */}
          <div className="space-y-6">
            <h4 className="text-white font-medium text-sm uppercase tracking-widest">Explore</h4>
            <div className="flex flex-col space-y-3 text-sm">
              <a href="/" className="hover:text-amber-500 transition-colors">Home</a>
              <a href="/workers" className="hover:text-amber-500 transition-colors">Find an Artisan</a>
              <a href="/gallery" className="hover:text-amber-500 transition-colors">The Gallery</a>
            </div>
          </div>

          {/* Social Section */}
          <div className="space-y-6">
            <h4 className="text-white font-medium text-sm uppercase tracking-widest">The Studio</h4>
            <div className="flex space-x-5">
              {[
                { src: Youtube, alt: "Youtube" },
                { src: Linkedin, alt: "Linkedin" },
                { src: Instagram, alt: "Instagram" },
                { src: Discord, alt: "Discord" },
              ].map((social, index) => (
                <a 
                  key={index} 
                  href="#" 
                  className="w-8 h-8 flex items-center justify-center border border-stone-800 rounded-full hover:border-amber-500 hover:bg-amber-500/10 transition-all group"
                >
                  <img 
                    src={social.src} 
                    className="w-4 h-4 invert opacity-60 group-hover:opacity-100 transition-opacity" 
                    alt={social.alt} 
                  />
                </a>
              ))}
            </div>
            <p className="text-[10px] text-stone-500 italic font-serif">
              "Excellence is not an act, but a habit."
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-stone-600 uppercase tracking-widest">
            © 2026 The Guild. Handcrafted by Design.
          </p>
          <div className="flex space-x-6 text-[10px] uppercase tracking-tighter text-stone-600">
            <a href="#" className="hover:text-stone-400">Privacy Policy</a>
            <a href="#" className="hover:text-stone-400">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;