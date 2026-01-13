import React, { useState, useEffect } from 'react';
import Artisan1 from '../images/artisan-1.webp';
import Artisan2 from '../images/artisan-2.webp';
import Artisan3 from '../images/artisan-3.webp';
import Artisan4 from '../images/artisan-4.webp';
import Artisan5 from '../images/artisan-5.webp';

const slides = [
    {
    id: 1,
    image: Artisan1,
    title: "Keeping You Cool",
    highlight: "AC Repair",
    description: "Professional air conditioning repair and maintenance services, ensuring optimal cooling and energy efficiency for your home or office.",
    },
    {
    id: 2,
    image: Artisan2,
    title: "Powering Your World",
    highlight: "Electrical Work",
    description: "Expert electrical installations, repairs, and maintenance, ensuring safety and efficiency for homes and businesses.",
    },
  {
    id: 3,
    image: Artisan3,
    title: "Mastery in Every Grain",
    highlight: "Custom Woodwork",
    description: "Hand-carved furniture and home accents crafted from sustainably sourced local hardwoods.",
  },
  {
    id: 4,
    image: Artisan4,
    title: "The Art of the Wheel",
    highlight: "Functional Ceramics",
    description: "Minimalist stoneware designed for the daily rituals of the modern kitchen and home.",
  },
  {
  id: 5,
  image: Artisan5,
  title: "Forging Strength",
  highlight: "Welding",
  description: "Skilled welding services for metal structures, repairs, and custom projects, combining precision with durability.",
},

];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full h-[100vh] overflow-hidden bg-stone-900">
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-1000 ease-in-out h-full "
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="w-full shrink-0 h-full relative">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover opacity-30"
            />
            {/* Elegant dark overlay with a hint of warm brown */}
            <div className="absolute inset-0 bg-stone-900/40" />
          </div>
        ))}
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center mt-">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
                        <div 
                          key={currentIndex} 
                          className="animate-in fade-in slide-in-from-bottom-6 duration-1000"
                        >
                          <span className="text-amber-200 uppercase tracking-[0.3em] text-sm font-semibold mb-4 block">
                          Since 1994
                          </span>
                          
                          <h1 className="text-5xl md:text-7xl font-serif text-white leading-tight">
                          {slides[currentIndex].title}
                          <span className="block text-amber-500 italic font-light mt-2">
                            {slides[currentIndex].highlight}
                          </span>
                          </h1>

                          <p className="mt-6 text-lg md:text-xl text-stone-200 max-w-xl leading-relaxed font-light">
                          {slides[currentIndex].description}
                          </p>

                          <div className="mt-10 flex flex-wrap gap-5">
                          <button
                            type="button"
                            onClick={() => { window.location.href = '/gallery'; }}
                            className="px-8 py-4 bg-amber-600 text-white font-medium hover:bg-amber-700 transition-all duration-300 transform hover:-translate-y-1"
                          >
                            View Collection
                          </button>
                          <button 
                            onClick={() => document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 border border-white/30 text-white backdrop-blur-sm hover:bg-white hover:text-stone-900 transition-all duration-300"
                          >
                            Our Process
                          </button>
                          </div>
                        </div>
                        </div>
                      </div>
                      </div>

                      {/* Modern Progress Bar Indicators */}
      <div className="absolute bottom-12 left-6 lg:left-12 flex items-center gap-4 ml-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className="group relative h-12 flex items-center"
            aria-label={`Slide ${index + 1}`}
          >
            <div className={`h-0.5 transition-all duration-500 ${
              index === currentIndex ? 'w-16 bg-amber-500' : 'w-8 bg-white/40 group-hover:bg-white/70'
            }`} />
            <span className={`ml-2 text-xs font-mono transition-opacity duration-500 ${
              index === currentIndex ? 'text-amber-500 opacity-100' : 'opacity-0'
            }`}>
              0{index + 1}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
