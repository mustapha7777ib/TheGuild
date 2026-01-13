import React from "react";
import icon2 from "../images/Screenshot 2025-04-17 at 07.33.59.png"; // Consider a high-quality workshop image here
import { Link } from "react-router-dom";

function Join() {
  return (
    <div className="bg-white py-16 px-6 lg:py-24">
      <div className="max-w-7xl mx-auto overflow-hidden bg-stone-900 rounded-sm shadow-2xl flex flex-col lg:flex-row items-center">
        
        {/* Content Side */}
        <div className="flex-1 p-10 lg:p-20 text-center lg:text-left">
          <span className="text-amber-500 text-xs font-bold uppercase tracking-[0.4em] mb-4 block">
            Start Your Journey
          </span>
          
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-6 leading-tight">
            Ready to Join <br />
            <span className="italic text-stone-300 font-light text-3xl md:text-4xl">The Artisan Guild?</span>
          </h2>
          
          <p className="text-stone-400 mb-10 text-lg font-light leading-relaxed max-w-md mx-auto lg:mx-0">
            Whether you are a master of your craft or seeking bespoke quality for your home, 
            there is a place for you in our community.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
            <Link 
              to="/signup" 
              className="px-10 py-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold uppercase tracking-widest transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-amber-900/20"
            >
              Apply to Join
            </Link>
            
            <p className="text-stone-500 text-sm">
              Already a member?{' '}
              <Link to="/signin" className="text-white hover:text-amber-500 underline underline-offset-4 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Image/Visual Side */}
        <div className="flex-1 relative w-full h-[400px] lg:h-[600px] overflow-hidden">
          {/* Subtle wooden texture overlay on the image */}
          <div className="absolute inset-0 bg-stone-900/20 z-10" />
          <img 
            className="w-full h-full object-cover grayscale-[20%] sepia-[10%] group-hover:scale-110 transition-transform duration-700" 
            src={icon2} 
            alt="Artisan at work" 
          />
          
          {/* Floating Detail */}
          <div className="absolute bottom-10 right-10 z-20 bg-stone-900/80 backdrop-blur-md p-6 border border-white/10 hidden md:block">
            <p className="text-white font-serif italic text-sm">"Quality is never an accident; it is always the result of intelligent effort."</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Join;