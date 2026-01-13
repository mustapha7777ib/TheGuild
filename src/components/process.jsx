import React from "react";
import One from "../images/one.svg";
import Two from "../images/two.svg";
import Three from "../images/three.svg";
import Four from "../images/four.svg";

const steps = [
    { 
        icon: One, 
        name: "Join the Guild", 
        text: "Create your profile to access our curated network of independent master craftsmen and studios." 
    },
    { 
        icon: Two, 
        name: "Discover Talent", 
        text: "Filter by craft, material, or location to find the perfect hands for your specific project." 
    },
    { 
        icon: Three, 
        name: "Discuss the Vision", 
        text: "Connect directly with artisans to share sketches, discuss materials, and refine every detail." 
    },
    { 
        icon: Four, 
        name: "Begin the Commission", 
        text: "Secure your project and watch your bespoke piece transition from raw material to finished art." 
    }
];

function Process() {
  return (
    <div id="process" className="max-w-7xl mx-auto px-6 py-24 my-10 bg-white border-y border-stone-100">
      <div className="text-center mb-20">
        <span className="text-amber-600 text-xs font-bold uppercase tracking-[0.3em] mb-3 block">
          The Journey
        </span>
        <h2 className="text-3xl md:text-5xl font-serif text-stone-900 tracking-tight">
          How to Commission a Masterpiece
        </h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-6" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
        {steps.map((step, index) => (
          <div key={index} className="group relative">
            {/* Step Number (Visual Background) */}
            <div className="absolute -top-8 -left-4 text-8xl font-serif text-stone-50 opacity-[0.03] select-none group-hover:opacity-[0.07] transition-opacity">
              0{index + 1}
            </div>

            <div className="relative">
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="mb-6 p-4 bg-stone-50 rounded-full group-hover:bg-amber-50 transition-colors duration-500">
                    <img 
                        src={step.icon} 
                        alt={step.name} 
                        className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity" 
                    />   
                </div>
                
                <h3 className="text-xl font-serif font-medium text-stone-900 mb-4 tracking-wide">
                    {step.name}
                </h3>  
                
                <p className="text-stone-500 leading-relaxed text-sm font-light">
                  {step.text}
                </p>
              </div>
            </div>

            {/* Connecting Line (Only for Desktop) */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-12 left-2/3 w-full h-[1px] bg-stone-100 z-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Process;