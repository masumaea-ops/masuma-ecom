
import React from 'react';
import { ShieldCheck, MapPin, Users, PenTool as Tool, ArrowRight, Star } from 'lucide-react';
import { ViewState } from '../types';

interface AboutProps {
    setView: (view: ViewState) => void;
}

const About: React.FC<AboutProps> = ({ setView }) => {
  return (
    <div className="animate-fade-in bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-masuma-dark text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-masuma-dark via-masuma-dark/90 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 flex flex-col justify-center h-full">
            <span className="text-masuma-orange font-bold uppercase tracking-[0.2em] text-sm mb-4">Our Story</span>
            <h1 className="text-5xl md:text-6xl font-bold font-display uppercase leading-none mb-6">
                Japanese Precision.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-masuma-orange to-orange-400">African Resilience.</span>
            </h1>
            <p className="text-gray-300 max-w-2xl text-lg leading-relaxed">
                Masuma Autoparts East Africa Limited is the exclusive distributor of Masuma automotive components. We bridge the gap between Japanese engineering excellence and the rugged demands of East African roads.
            </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
                <h2 className="text-3xl font-bold text-masuma-dark font-display uppercase mb-6">The Fight Against <span className="text-masuma-orange">Counterfeits</span></h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>
                        For years, the Kenyan market has been flooded with substandard, counterfeit spare parts wrapped in branded boxes. These fake parts not only fail prematurely but endanger lives and destroy engines.
                    </p>
                    <p>
                        <strong>Masuma East Africa</strong> was founded with a single mission: to provide a reliable, transparent source of high-quality parts. When you buy Masuma, you aren't just buying a filter or a brake pad; you are buying the assurance that it was engineered in Japan, tested rigorously, and imported directly from the manufacturer.
                    </p>
                    <p>
                        We cover 45 product groups and over 10,000 items, focusing on the core "wear and tear" parts: chassis, engine, suspension, and filtration.
                    </p>
                </div>
                
                <div className="mt-8 flex gap-4">
                    <button 
                        onClick={() => setView('CATALOG')}
                        className="bg-masuma-dark text-white px-8 py-3 font-bold uppercase tracking-widest text-sm hover:bg-masuma-orange transition flex items-center gap-2"
                    >
                        Browse Catalog <ArrowRight size={16} />
                    </button>
                    <button 
                        onClick={() => setView('CONTACT')}
                        className="border-2 border-gray-200 text-gray-600 px-8 py-3 font-bold uppercase tracking-widest text-sm hover:border-masuma-dark hover:text-masuma-dark transition"
                    >
                        Visit Us
                    </button>
                </div>
            </div>
            
            <div className="relative">
                <div className="absolute top-0 right-0 w-3/4 h-full bg-gray-100 rounded-lg -z-10 transform translate-x-4 translate-y-4"></div>
                <img 
                    src="https://masuma.com/wp-content/uploads/2021/09/chassis-parts.jpg" 
                    alt="Masuma Suspension Parts" 
                    className="rounded-lg shadow-xl w-full object-cover"
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-lg shadow-lg border-l-4 border-masuma-orange max-w-xs">
                    <div className="flex items-center gap-2 mb-2">
                        <Star className="text-masuma-orange fill-current" size={20} />
                        <Star className="text-masuma-orange fill-current" size={20} />
                        <Star className="text-masuma-orange fill-current" size={20} />
                        <Star className="text-masuma-orange fill-current" size={20} />
                        <Star className="text-masuma-orange fill-current" size={20} />
                    </div>
                    <p className="text-sm font-bold text-gray-800">"Finally, suspension bushes that survive Nairobi potholes. Highly recommended."</p>
                    <p className="text-xs text-gray-500 mt-2">— John K., Taxi Fleet Owner</p>
                </div>
            </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gray-50 py-20 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-masuma-dark font-display uppercase">Why Choose Masuma?</h2>
                  <div className="h-1 w-16 bg-masuma-orange mx-auto mt-4"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:-translate-y-1 transition duration-300">
                      <div className="w-14 h-14 bg-masuma-orange/10 rounded-full flex items-center justify-center text-masuma-orange mb-6">
                          <ShieldCheck size={32} />
                      </div>
                      <h3 className="font-bold text-lg text-masuma-dark uppercase mb-3">12-Month Warranty</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                          We stand behind our quality. If a part fails due to a manufacturing defect within 12 months, we replace it. No excuses.
                      </p>
                  </div>

                  <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:-translate-y-1 transition duration-300">
                      <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6">
                          <Tool size={32} />
                      </div>
                      <h3 className="font-bold text-lg text-masuma-dark uppercase mb-3">OEM Specification</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                          Masuma parts are built to match or exceed Original Equipment Manufacturer (OEM) specifications. Perfect fit, every time.
                      </p>
                  </div>

                  <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:-translate-y-1 transition duration-300">
                      <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-6">
                          <Users size={32} />
                      </div>
                      <h3 className="font-bold text-lg text-masuma-dark uppercase mb-3">Technical Support</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                          Our team isn't just sales staff; they are technical experts. We help you find the exact part for your chassis number.
                      </p>
                  </div>
              </div>
          </div>
      </div>

      {/* Stats */}
      <div className="bg-masuma-dark text-white py-16">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                  <div className="text-4xl font-bold font-display text-masuma-orange mb-2">45+</div>
                  <div className="text-xs uppercase tracking-widest text-gray-400">Product Categories</div>
              </div>
              <div>
                  <div className="text-4xl font-bold font-display text-masuma-orange mb-2">10k+</div>
                  <div className="text-xs uppercase tracking-widest text-gray-400">Parts in Stock</div>
              </div>
              <div>
                  <div className="text-4xl font-bold font-display text-masuma-orange mb-2">100%</div>
                  <div className="text-xs uppercase tracking-widest text-gray-400">Genuine Guarantee</div>
              </div>
              <div>
                  <div className="text-4xl font-bold font-display text-masuma-orange mb-2">24h</div>
                  <div className="text-xs uppercase tracking-widest text-gray-400">Delivery Countrywide</div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default About;
