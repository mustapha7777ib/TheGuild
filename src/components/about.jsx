import React, { useEffect, useRef } from "react";

function About() {
  const aboutRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-10");
        }
      },
      { threshold: 0.1 }
    );

    if (aboutRef.current) observer.observe(aboutRef.current);
    return () => aboutRef.current && observer.unobserve(aboutRef.current);
  }, []);

  return (
    <section 
      id="about" 
      className="relative w-full py-24 overflow-hidden bg-stone-900"
    >
      {/* Wooden Texture Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-40 mix-blend-overlay"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1546487803-997d6dd673f4?q=80&w=2000')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Dark Gradient to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-transparent to-stone-900/80 z-10" />

      <div 
        ref={aboutRef}
        className="relative z-20 max-w-4xl mx-auto px-6 text-center transition-all duration-1000 transform opacity-0 translate-y-10"
      >
        <span className="text-amber-500 text-xs font-bold uppercase tracking-[0.4em] mb-6 block">
          Our Philosophy
        </span>
        
        <h2 className="text-3xl md:text-5xl font-serif text-white mb-10 tracking-tight">
          A Note from our Founder
        </h2>
        
        <div className="relative">
          {/* Stylized Quote Mark */}
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-8xl text-amber-600/20 font-serif">“</span>
          
          <p className="text-xl md:text-2xl text-stone-200 leading-relaxed font-serif italic font-light">
            "We believe that the connection between a craftsman and a client is sacred. 
            Our mission is to preserve the heritage of manual mastery by bridging the 
            gap between those who value quality and the artisans who live to create it."
          </p>
          
          <div className="mt-12">
            <div className="w-12 h-[1px] bg-amber-500 mx-auto mb-6" />
            <p className="text-white font-serif text-xl tracking-wide">Mustapha Ibrahim</p>
            <p className="text-amber-500/80 text-xs uppercase tracking-[0.2em] mt-1">
              Founder & Master Artisan
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;