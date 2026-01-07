import React, { useEffect, useRef } from "react";

const reviews = [
    { name: "Layla Hassan", role: "Homeowner", quote: "A rare find. The platform connected me with a restorer who treated my antique table with incredible reverence and skill." },
    { name: "Khaled Omar", role: "Master Electrician", quote: "It’s a guild for the modern era. I connect with clients who value manual mastery over the lowest bid. It has transformed my practice." },
    { name: "Amina Bello", role: "Interior Designer", quote: "Finding authentic masonry and carpentry of this caliber used to take months. Now, I have a trusted circle of artisans at my fingertips." },
    { name: "Ibrahim Musa", role: "Stone Mason", quote: "The platform allows my work to speak for itself. I can focus on my craft while the inquiries find their way to my workshop door." }
];

function Testimonials() {
  const testimonialsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-10");
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = testimonialsRef.current.querySelectorAll(".testimonial-card");
    cards.forEach((card) => observer.observe(card));
    
    return () => cards.forEach((card) => observer.unobserve(card));
  }, []);

  return (
    <div id="testimonials" className="bg-[#FAF9F6] py-28 px-6 border-t border-stone-100">
      <div className="text-center mb-20">
        <span className="text-amber-600 text-xs font-bold uppercase tracking-[0.3em] mb-3 block">
          Community Voices
        </span>
        <h2 className="text-3xl md:text-5xl font-serif text-stone-900 tracking-tight">
          Words from the Workshop
        </h2>
      </div>

      <div 
        ref={testimonialsRef}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        {reviews.map((item, index) => (
          <div 
            key={index}
            className="testimonial-card opacity-0 translate-y-10 transition-all duration-1000 bg-white p-10 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border-t-2 border-transparent hover:border-amber-500 flex flex-col justify-between group"
          >
            <div className="relative">
              {/* Decorative Quote mark */}
              <span className="text-4xl font-serif text-amber-500/20 absolute -top-4 -left-2">“</span>
              <p className="text-stone-600 font-serif italic mb-8 leading-relaxed relative z-10 pt-2">
                {item.quote}
              </p>
            </div>

            <div className="pt-6 border-t border-stone-50">
              <p className="font-serif text-lg text-stone-900 group-hover:text-amber-700 transition-colors">
                {item.name}
              </p>
              <p className="text-xs uppercase tracking-widest text-stone-400 mt-1">
                {item.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Testimonials;