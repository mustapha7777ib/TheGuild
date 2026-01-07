import React from 'react';
import { Link } from 'react-router-dom';
import Arrow from '../images/arrow.svg';

function Services() {
    return (
        <div className="py-24 bg-[#faf9f6]" id="services">
            <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
                
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-4">
                        Exceptional Craft, Delivered.
                    </h2>
                    <p className="text-stone-600 max-w-xl mx-auto font-light leading-relaxed">
                        Connect with master artisans for bespoke creations, restoration services, 
                        and handcrafted essentials for your home.
                    </p>
                </div>

                {/* The Main Action */}
                <Link 
                    to="/workers" 
                    className="group relative flex items-center gap-4 bg-stone-900 hover:bg-amber-700 text-white px-12 py-5 transition-all duration-500 shadow-xl overflow-hidden"
                >
                    {/* Subtle Shine Effect */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                        Explore our Artisans
                    </span>
                    
                    <img 
                        src={Arrow} 
                        className="w-5 h-5 invert transition-transform duration-300 group-hover:translate-x-2" 
                        alt="Arrow" 
                    />
                </Link>

                {/* Trust Footer */}
                <div className="mt-12 flex items-center gap-8 text-stone-400">
                    <div className="flex flex-col items-center">
                        <span className="text-stone-900 font-serif italic text-lg tracking-tighter">Verified Skills</span>
                    </div>
                    <div className="h-8 w-[1px] bg-stone-200" />
                    <div className="flex flex-col items-center">
                        <span className="text-stone-900 font-serif italic text-lg tracking-tighter">Bespoke Quality</span>
                    </div>
                    <div className="h-8 w-[1px] bg-stone-200" />
                    <div className="flex flex-col items-center">
                        <span className="text-stone-900 font-serif italic text-lg tracking-tighter">Fair Trade</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Services;