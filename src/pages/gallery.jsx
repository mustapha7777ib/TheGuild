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

  // Use real items if provided, otherwise fall back to placeholders
  const galleryItems = items.length > 0 ? items : placeholderItems;

  return (
    <div className="bg-[#FAF9F6] py-20 px-6">
      {/* Gallery Header */}
      <div className="max-w-7xl mx-auto mb-16 border-b border-stone-200 pb-8 flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-serif text-stone-900 tracking-tighter">
            Bespoke Gallery
          </h2>
          <p className="text-amber-600 text-[10px] uppercase tracking-[0.4em] font-bold mt-3">
            Selected Works & Masterpieces
          </p>
        </div>
        <div className="text-stone-300 font-serif italic text-4xl hidden md:block">
          {galleryItems.length}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
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
                <div className="w-full h-full relative aspect-4/5 md:aspect-auto">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover grayscale-40 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-out"
                  />

                  {/* Elegant Overlay */}
                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                    <p className="text-amber-500 text-[9px] uppercase tracking-[0.3em] font-bold translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      {item.category || "Craftsmanship"}
                    </p>
                    <h3 className="text-white font-serif text-2xl mt-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                      {item.title}
                    </h3>
                  </div>

                  {/* Thin Frame Border on Hover */}
                  <div className="absolute inset-4 border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          <div className="md:col-span-12 text-center py-32 px-8">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-stone-200 rounded-full mx-auto mb-8 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-stone-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-4L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-3xl font-serif text-stone-900 mb-4">
                Gallery Coming Soon
              </h3>
              <p className="text-stone-500 text-lg font-serif leading-relaxed mb-8">
                Our collection of bespoke masterpieces is being curated with care.
              </p>
              <p className="text-stone-400 text-sm">
                Check back soon for extraordinary craftsmanship.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/98 backdrop-blur-xl flex items-center justify-center p-6 md:p-12"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-5xl w-full h-full flex flex-col md:flex-row gap-10 items-center"
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white text-4xl font-light hover:text-amber-500 transition-colors z-10"
            >
              ×
            </button>

            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="w-full md:w-2/3 h-auto max-h-[80vh] object-contain shadow-2xl"
            />

            <div className="w-full md:w-1/3 text-white space-y-6">
              <p className="text-amber-500 text-[10px] uppercase tracking-[0.4em] font-bold">
                Project Details
              </p>
              <h3 className="text-4xl font-serif leading-tight">
                {selectedImage.title}
              </h3>
              <p className="text-stone-400 font-serif italic text-lg leading-relaxed">
                "{selectedImage.description || "A testament to the dedication of the craft and the soul of the material."}"
              </p>
              <div className="pt-8 border-t border-stone-800">
                <button className="px-8 py-3 bg-white text-stone-900 text-[10px] uppercase font-bold tracking-widest hover:bg-amber-600 hover:text-white transition-all">
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

export default Gallery;