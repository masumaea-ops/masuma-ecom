import React, { useEffect } from 'react';
import { ShieldCheck, CheckCircle, Star, Globe, Wrench, AlertTriangle, Target, Eye, Truck, Activity } from 'lucide-react';
import { ViewState } from '../types';
import SEO from './SEO';

interface AboutProps {
    setView: (view: ViewState) => void;
}

const About: React.FC<AboutProps> = ({ setView }) => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleNav = (e: React.MouseEvent, view: ViewState) => {
      e.preventDefault();
      setView(view);
      const newUrl = `/?view=${view}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      window.scrollTo(0, 0);
  };

  return (
    <div className="animate-fade-in bg-white min-h-screen font-sans">
      <SEO 
        title="About Masuma" 
        description="Masuma Autoparts East Africa - The exclusive distributor of Japanese engineered automotive parts in Kenya. Learn about our heritage, mission, and 12-month warranty."
      />

      {/* 1. HERO SECTION */}
      <div className="relative bg-masuma-dark text-white h-[500px] flex items-center overflow-hidden">
        {/* Background with overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-40 grayscale"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-masuma-dark via-masuma-dark/90 to-transparent"></div>
        
        <div className="relative max-w-screen-2xl mx-auto px-6 lg:px-12 w-full">
            <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-masuma-orange/20 border border-masuma-orange text-masuma-orange px-4 py-1.5 mb-6 backdrop-blur-md">
                    <span className="w-2 h-2 bg-masuma-orange rounded-full animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">Official Distributor • East Africa</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold font-display uppercase leading-[0.9] mb-8 tracking-tighter">
                    Built for the <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-masuma-orange to-orange-500">Long Road.</span>
                </h1>
                <p className="text-gray-300 text-lg md:text-xl font-light leading-relaxed max-w-2xl mb-10 border-l-4 border-masuma-orange pl-6">
                    Masuma Autoparts East Africa is the bridge between Japanese precision engineering and the rugged demands of the African continent. We don't just sell parts; we provide reliability.
                </p>
                <a 
                    href="/?view=CATALOG"
                    onClick={(e) => handleNav(e, 'CATALOG')}
                    className="bg-white text-masuma-dark hover:bg-masuma-orange hover:text-white px-10 py-4 font-bold uppercase tracking-widest text-sm transition duration-300 shadow-xl inline-flex items-center justify-center"
                >
                    Explore Our Catalog
                </a>
            </div>
        </div>
      </div>

      {/* 2. MISSION & VISION GRID */}
      <section className="bg-gray-50 py-16 -mt-10 relative z-10 rounded-t-3xl border-t border-white/20">
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Mission */}
                  <div className="bg-white p-8 shadow-sm border-t-4 border-masuma-orange hover:shadow-xl transition rounded-sm">
                      <div className="bg-masuma-orange/10 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                          <Target size={24} className="text-masuma-orange" />
                      </div>
                      <h3 className="text-xl font-bold font-display uppercase text-masuma-dark mb-3">Our Mission</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                          To provide Kenyan motorists with reliable, high-quality auto parts that withstand local road conditions, ensuring safety and reducing maintenance costs through Japanese engineering excellence.
                      </p>
                  </div>

                  {/* Vision */}
                  <div className="bg-white p-8 shadow-sm border-t-4 border-masuma-dark hover:shadow-xl transition rounded-sm">
                      <div className="bg-masuma-dark/10 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                          <Eye size={24} className="text-masuma-dark" />
                      </div>
                      <h3 className="text-xl font-bold font-display uppercase text-masuma-dark mb-3">Our Vision</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                          To be the undisputed leader in the East African automotive aftermarket, creating a safer driving environment where every vehicle runs on parts they can trust.
                      </p>
                  </div>

                  {/* Reach */}
                  <div className="bg-white p-8 shadow-sm border-t-4 border-blue-500 hover:shadow-xl transition rounded-sm">
                      <div className="bg-blue-50 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                          <Truck size={24} className="text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold font-display uppercase text-masuma-dark mb-3">Our Reach</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                          From our central warehouse in Nairobi, we serve a network of over 600 partner garages and retailers across Kenya, Uganda, Tanzania, and Rwanda.
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* 3. THE MASUMA HERITAGE */}
      <section className="py-24 bg-white">
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                  <div>
                      <h2 className="text-4xl font-bold text-masuma-dark font-display uppercase mb-6 leading-none">
                          Japanese Roots, <br/>
                          <span className="text-gray-400">Global Standard</span>
                      </h2>
                      <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                          <p>
                              Masuma was founded in Tokyo, Japan, with a simple goal: to produce aftermarket parts that match the quality of Original Equipment (OE) components at a fraction of the price.
                          </p>
                          <p>
                              Today, Masuma is a global brand with a presence in over 40 countries. Our factories produce parts for major automakers, ensuring that the filter or brake pad you buy from us is made on the same assembly lines as the parts that came with your car.
                          </p>
                          <p className="text-masuma-dark font-medium border-l-2 border-masuma-orange pl-4">
                              Masuma East Africa is the exclusive distributor for the region. We work directly with headquarters to develop "Tropical Spec" components reinforced for heat, dust, and vibration.
                          </p>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <img src="https://images.unsplash.com/photo-1599317522509-d343460464f1?auto=format&fit=crop&w=800&q=80" alt="Suspension Detail" className="w-full h-64 object-cover rounded-sm shadow-lg translate-y-8" />
                      <img src="https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=800&q=80" alt="Engine Bay" className="w-full h-64 object-cover rounded-sm shadow-lg" />
                  </div>
              </div>
          </div>
      </section>

      {/* 4. CORE PILLARS (Dark Section) */}
      <section className="py-24 bg-masuma-dark text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[#222] skew-x-12 transform translate-x-1/3"></div>
          
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-20">
                  <span className="text-masuma-orange font-bold uppercase tracking-widest text-xs">Our Philosophy</span>
                  <h2 className="text-4xl md:text-5xl font-bold font-display uppercase mt-2">Why Masuma?</h2>
                  <div className="w-20 h-1 bg-masuma-orange mx-auto mt-6"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {[
                      {
                          icon: Globe,
                          title: "Japanese Engineering",
                          desc: "Designed in Tokyo. Every part adheres strictly to OEM geometric specifications, ensuring a perfect fit every time. No modifications needed."
                      },
                      {
                          icon: ShieldCheck,
                          title: "12-Month Warranty",
                          desc: "We stand behind our quality. If a part fails due to a manufacturing defect within 12 months, we replace it. No questions asked."
                      },
                      {
                          icon: Wrench,
                          title: "Mechanic Approved",
                          desc: "Trusted by over 500 garages in Nairobi. Mechanics prefer Masuma because they don't bounce back for warranty claims."
                      }
                  ].map((item, idx) => (
                      <div key={idx} className="bg-white/5 p-10 border border-white/10 hover:border-masuma-orange hover:bg-white/10 transition duration-500 group">
                          <item.icon size={48} className="text-masuma-orange mb-6 group-hover:scale-110 transition-transform" />
                          <h3 className="text-xl font-bold font-display uppercase mb-4 tracking-wide">{item.title}</h3>
                          <p className="text-gray-400 leading-relaxed text-sm">
                              {item.desc}
                          </p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* 5. PRODUCT CATEGORY DEEP DIVE */}
      <section className="py-24 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
              <div className="flex flex-col md:flex-row justify-between items-end mb-16">
                  <div>
                      <h2 className="text-4xl font-bold text-masuma-dark font-display uppercase">Engineered to Outlast</h2>
                      <p className="text-gray-500 mt-2">Specific adaptations for the African market.</p>
                  </div>
                  <a 
                    href="/?view=CATALOG"
                    onClick={(e) => handleNav(e, 'CATALOG')}
                    className="hidden md:flex items-center gap-2 text-masuma-orange font-bold uppercase text-xs tracking-widest hover:text-masuma-dark transition"
                  >
                      View Full Catalog <Activity size={16} />
                  </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Suspension */}
                  <div className="bg-white p-8 shadow-sm border-t-4 border-masuma-orange hover:shadow-xl transition group">
                      <h3 className="text-2xl font-bold font-display text-masuma-dark mb-4">Suspension</h3>
                      <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                          Our bushings use a high-density rubber compound that resists cracking under heavy vibration. Ball joints feature mirror-polished studs and high-performance grease to reduce friction and wear on rough roads.
                      </p>
                      <ul className="space-y-2">
                          <li className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase"><CheckCircle size={12} className="text-masuma-orange"/> Reinforced Rubber</li>
                          <li className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase"><CheckCircle size={12} className="text-masuma-orange"/> Dust-Sealed Joints</li>
                      </ul>
                  </div>

                  {/* Brakes */}
                  <div className="bg-white p-8 shadow-sm border-t-4 border-masuma-dark hover:shadow-xl transition group">
                      <h3 className="text-2xl font-bold font-display text-masuma-dark mb-4">Braking Systems</h3>
                      <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                          Masuma ceramic brake pads are formulated to handle high heat without fading. They produce minimal dust and include anti-squeal shims, providing quiet, confident stopping power in Nairobi traffic.
                      </p>
                      <ul className="space-y-2">
                          <li className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase"><CheckCircle size={12} className="text-masuma-dark"/> Low Dust Ceramic</li>
                          <li className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase"><CheckCircle size={12} className="text-masuma-dark"/> High Temp Resistance</li>
                      </ul>
                  </div>

                  {/* Filtration */}
                  <div className="bg-white p-8 shadow-sm border-t-4 border-gray-400 hover:shadow-xl transition group">
                      <h3 className="text-2xl font-bold font-display text-masuma-dark mb-4">Filtration</h3>
                      <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                          Protect your engine from dust and bad fuel. Our filters use multi-layer media that traps 99% of contaminants while maintaining high flow rates, essential for preserving engine life in dusty environments.
                      </p>
                      <ul className="space-y-2">
                          <li className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase"><CheckCircle size={12} className="text-gray-400"/> Multi-layer Media</li>
                          <li className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase"><CheckCircle size={12} className="text-gray-400"/> High Pressure Valve</li>
                      </ul>
                  </div>
              </div>
          </div>
      </section>

      {/* 6. COUNTERFEIT WARNING */}
      <section className="py-20 bg-white border-y border-gray-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-red-50 rounded-full text-red-600 mb-6">
                  <AlertTriangle size={32} />
              </div>
              <h2 className="text-3xl font-bold text-masuma-dark font-display uppercase mb-4">Warning: Counterfeit Parts</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  The Kenyan market is flooded with fake parts packaged to look like originals. These parts often use inferior materials that can lead to catastrophic engine failure or accidents.
              </p>
              <div className="bg-gray-50 p-6 border border-gray-200 inline-block text-left max-w-2xl">
                  <h4 className="font-bold text-masuma-dark uppercase text-sm mb-4">How to Identify Genuine Masuma:</h4>
                  <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                          <Star size={18} className="text-masuma-orange mt-0.5" />
                          <span className="text-sm text-gray-600"><strong>Hologram Seal:</strong> Every box features a holographic security seal.</span>
                      </li>
                      <li className="flex items-start gap-3">
                          <Star size={18} className="text-masuma-orange mt-0.5" />
                          <span className="text-sm text-gray-600"><strong>Batch Number:</strong> Printed directly on the part (e.g., filter canister or brake backing plate).</span>
                      </li>
                      <li className="flex items-start gap-3">
                          <Star size={18} className="text-masuma-orange mt-0.5" />
                          <span className="text-sm text-gray-600"><strong>Authorized Source:</strong> Buy only from Masuma Autoparts East Africa Limited or our verified partners.</span>
                      </li>
                  </ul>
              </div>
          </div>
      </section>

      {/* 7. STATS */}
      <div className="bg-masuma-dark py-16 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center text-white">
              {[
                  { label: "Product Categories", value: "50+" },
                  { label: "Fitment Accuracy", value: "99.9%" },
                  { label: "Partner Garages", value: "600+" },
                  { label: "Years in Market", value: "21+" },
              ].map((stat, idx) => (
                  <div key={idx}>
                      <div className="text-4xl md:text-6xl font-bold font-display text-masuma-orange mb-2">{stat.value}</div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">{stat.label}</div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default About;