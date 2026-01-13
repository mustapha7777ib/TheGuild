import { useState } from "react";
import Pic1 from "../images/pic-1.webp";
import Pic2 from "../images/pic-2.webp";
import Pic3 from "../images/pic-3.webp";
import Pic4 from "../images/pic-4.webp";
import Pic5 from "../images/pic-5.webp";
import Pic6 from "../images/pic-6.webp";

const Gallery = ({ items = [] }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  // TEMPORARY: Placeholder data for testing — remove when you pass real items
  const placeholderItems = [
    {
      id: 1,
      url: Pic1,
      title: "The Ebon Wing Chair",
      description: "Hand-carved from reclaimed English oak, upholstered in deep forest velvet with subtle brass detailing.",
      category: "Seating",
    },
    {
      id: 2,
      url: Pic6,
      title: "Luna Marble Console",
      description: "Italian Carrara marble floating atop a hand-forged blackened steel base. Minimal, eternal.",
      category: "Tables",
    },
    {
      id: 3,
      url: Pic5,
      title: "Aurum Floor Lamp",
      description: "Solid brass arc with hand-blown opal glass diffuser. A sculptural presence in any room.",
      category: "Lighting",
    },
    {
      id: 4,
      url: Pic3,
      title: "Obsidian Credenza",
      description: "Ebonized walnut with custom bronze pulls and hidden soft-close drawers.",
      category: "Storage",
    },
    {
      id: 5,
      url: Pic4,
      title: "Velvet Chaise Longue",
      description: "Reimagined classic form in midnight blue mohair with tapered brass legs.",
      category: "Seating",
    },
    {
      id: 6,
      url: Pic2,
      title: "Sculpted Dining Table",
      description: "Ten-foot solid travertine top on monumental cast bronze pedestals.",
      category: "Tables",
    },
  ];

  const galleryItems = items.length > 0 ? items : placeholderItems;

  return (
    <div className="bg-[#FAF9F6] py-12 md:py-20 px-4 md:px-6">
      {/* Gallery Header */}
      <div className="max-w-7xl mx-auto mb-10 md:mb-16 border-b border-stone-200 pb-6 md:pb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl md:text-5xl font-serif text-stone-900 tracking-tighter">
            Bespoke Gallery
          </h2>
          <p className="text-amber-600 text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] font-bold mt-2 md:mt-3">
            Selected Works & Masterpieces
          </p>
        </div>
        <div className="text-stone-300 font-serif italic text-4xl hidden md:block">
          {galleryItems.length}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {galleryItems.length > 0 ? (
          galleryItems.map((item, index) => {
            const isLarge = index % 7 === 0;
            const isTall = index % 4 === 0;

            return (
              <div
                key={item.id || index}
                className={`relative overflow-hidden group cursor-pointer bg-stone-100 shadow-sm
                  ${isLarge ? "md:col-span-8 md:row-span-2" : "md:col-span-4"}
                  ${isTall && !isLarge ? "md:row-span-2" : ""}
                `}
                onClick={() => setSelectedImage(item)}
              >
                {/* Mobile: Fixed aspect ratio | Desktop: Dynamic grid height */}
                <div className="w-full h-full relative aspect-[4/3] md:aspect-auto min-h-[300px] md:min-h-full">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover grayscale-0 md:grayscale-40 md:group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-out"
                  />

                  {/* Overlay - Always visible on mobile for accessibility, or hover on desktop */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent md:bg-stone-900/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 md:p-8">
                    <p className="text-amber-500 text-[9px] uppercase tracking-[0.3em] font-bold md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-500">
                      {item.category || "Craftsmanship"}
                    </p>
                    <h3 className="text-white font-serif text-xl md:text-2xl mt-1 md:mt-2 md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-700">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
            <EmptyState />
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/98 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 overflow-y-auto"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close Button - Sticky/Fixed for mobile */}
          <button
            onClick={() => setSelectedImage(null)}
            className="fixed top-6 right-6 text-white text-4xl font-light hover:text-amber-500 transition-colors z-[60]"
          >
            ×
          </button>

          <div
            className="relative max-w-5xl w-full flex flex-col md:flex-row gap-8 md:gap-12 items-center py-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Container */}
            <div className="w-full md:w-2/3">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="w-full h-auto max-h-[60vh] md:max-h-[80vh] object-contain shadow-2xl mx-auto"
              />
            </div>

            {/* Content Container */}
            <div className="w-full md:w-1/3 text-white space-y-4 md:space-y-6 text-center md:text-left px-2">
              <p className="text-amber-500 text-[10px] uppercase tracking-[0.4em] font-bold">
                Project Details
              </p>
              <h3 className="text-3xl md:text-4xl font-serif leading-tight">
                {selectedImage.title}
              </h3>
              <p className="text-stone-400 font-serif italic text-base md:text-lg leading-relaxed">
                "{selectedImage.description || "A testament to the dedication of the craft."}"
              </p>
              <div className="pt-6 md:pt-8 border-t border-stone-800">
                <button className="w-full md:w-auto px-8 py-4 md:py-3 bg-white text-stone-900 text-[10px] uppercase font-bold tracking-widest hover:bg-amber-600 hover:text-white transition-all">
                  Inquire About This Work
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Extracted Empty State for cleaner code
const EmptyState = () => (
    <div className="md:col-span-12 text-center py-20 md:py-32 px-6">
        <div className="max-w-md mx-auto">
            <h3 className="text-2xl md:text-3xl font-serif text-stone-900 mb-4">Gallery Coming Soon</h3>
            <p className="text-stone-500 text-base md:text-lg font-serif">Our collection is being curated with care.</p>
        </div>
    </div>
);

export default Gallery;