
import React from 'react';
import { ShieldCheck, Cog, Activity, CheckCircle, Star } from 'lucide-react';
import { ViewState } from '../types';

interface AboutProps {
    setView: (view: ViewState) => void;
}

const About: React.FC<AboutProps> = ({ setView }) => {
  return (
    <div className="animate-fade-in bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-masuma-dark text-white py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1498887960847-2a5e46312788?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-masuma-dark via-masuma-dark/95 to-masuma-dark/60"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 flex flex-col justify-center h-full">
            <span className="text-masuma-orange font-bold uppercase tracking-[0.3em] text-xs mb-6 pl-1">The Masuma Story</span>
            <h1 className="text-6xl md:text-7xl font-bold font-display uppercase leading-[0.9] mb-8">
                Engineering.<br />
                <span className="text-white">Reliability.</span>
            </h1>
            <div className="h-1 w-24 bg-masuma-orange mb-8"></div>
            <p className="text-gray-300 max-w-2xl text-xl leading-relaxed font-light">
                Masuma Autoparts East Africa Limited is the official bridge between Japanese precision engineering and the rugged resilience required for African roads.
            </p>
        </div>
      </div>

      {/* Elements of Quality Grid */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
                <h2 className="text-4xl font-bold text-masuma-dark font-display uppercase tracking-tight">The Elements of Quality</h2>
                <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Every Masuma part is the result of four critical elements working in harmony to ensure safety and longevity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                {[
                    { 
                        title: "Material", 
                        icon: Star, 
                        text: "We use only virgin rubber, high-grade steel, and ceramic compounds. No recycled fillers, ensuring bushings don't crack and brakes don't fade." 
                    },
                    { 
                        title: "Engineering", 
                        icon: Cog, 
                        text: "Designed in Tokyo with strict adherence to OEM geometric specifications. Every part fits exactly like the original, guaranteeing easy installation." 
                    },
                    { 
                        title: "Resilience", 
                        icon: ShieldCheck, 
                        text: "Our 'Tropical Spec' parts feature enhanced heat resistance and dust sealing, specifically adapted for the harsh East African environment." 
                    },
                    { 
                        title: "Testing", 
                        icon: Activity, 
                        text: "Rigorous lifecycle testing simulates over 50,000km of driving conditions before any batch is approved for shipment to Nairobi." 
                    }
                ].map((item, idx) => (
                    <div key={idx} className="group">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-masuma-orange mb-6 group-hover:bg-masuma-orange group-hover:text-white transition duration-500">
                            <item.icon size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-masuma-dark uppercase mb-4 font-display">{item.title}</h3>
                        <p className="text-gray-600 text-sm leading-7">
                            {item.text}
                        </p>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Mission Section with Dark Background */}
      <div className="bg-masuma-dark text-white py-24 relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div>
                      <span className="text-masuma-orange font-bold uppercase tracking-[0.2em] text-xs mb-4 block">Our Mission</span>
                      <h2 className="text-4xl md:text-5xl font-bold font-display uppercase leading-tight mb-8">
                          Eliminating the <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-masuma-orange to-orange-500">Compromise.</span>
                      </h2>
                      <div className="space-y-6 text-gray-400 text-lg leading-relaxed font-light">
                          <p>
                              For too long, car owners in East Africa have faced a difficult choice: buy expensive dealer parts or risk their safety with unreliable counterfeits.
                          </p>
                          <p className="text-white font-medium">
                              Masuma exists to eliminate that compromise.
                          </p>
                          <p>
                              We provide parts that match or exceed OEM performance at a price that makes sense for the market. By controlling the entire supply chain from our factories to our Nairobi distribution center, we guarantee authenticity and eliminate the middleman markup.
                          </p>
                      </div>

                      <div className="mt-10 space-y-4">
                          {[
                              "Defect rate below 0.02%",
                              "12-Month Unlimited Mileage Warranty",
                              "Direct technical support from experts"
                          ].map((feat, i) => (
                              <div key={i} className="flex items-center gap-4">
                                  <CheckCircle className="text-masuma-orange shrink-0" size={20} />
                                  <span className="text-gray-300">{feat}</span>
                              </div>
                          ))}
                      </div>

                      <div className="mt-12">
                        <button 
                            onClick={() => setView('CATALOG')}
                            className="bg-masuma-orange text-white px-10 py-4 font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-masuma-orange transition duration-300"
                        >
                            View Our Catalog
                        </button>
                      </div>
                  </div>

                  <div className="relative h-[600px] bg-gray-800 rounded-sm overflow-hidden border border-gray-700 group">
                      <img 
                          src="https://images.unsplash.com/photo-1486006920555-c77dcf18193c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
                          alt="Masuma Engine Parts" 
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition duration-700 transform group-hover:scale-105" 
                      />
                      <div className="absolute bottom-0 left-0 p-8 w-full bg-gradient-to-t from-black via-black/80 to-transparent">
                          <div className="flex items-end justify-between">
                              <div>
                                  <p className="text-masuma-orange font-bold uppercase tracking-widest text-xs mb-1">Engine Parts</p>
                                  <p className="text-4xl font-bold font-display">20,000+</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-gray-400 text-xs uppercase tracking-widest">SKUs in Catalog</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 py-20 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              {[
                  { label: "Product Categories", value: "45" },
                  { label: "Fitment Accuracy", value: "99%" },
                  { label: "Partner Garages", value: "500+" },
                  { label: "Warranty (Months)", value: "12M" },
              ].map((stat, idx) => (
                  <div key={idx}>
                      <div className="text-5xl md:text-6xl font-bold font-display text-masuma-orange mb-4">{stat.value}</div>
                      <div className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">{stat.label}</div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default About;
