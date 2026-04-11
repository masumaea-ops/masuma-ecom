import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MapPin, Calendar, Gauge, 
  Fuel, Settings2, Heart, Share2, MessageCircle,
  ChevronRight, ArrowRight, Star, Info, Car, Bike, Calculator, ShieldCheck, AlertTriangle, FileText, ExternalLink, Plus, XCircle
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { VehicleListing, Product } from '../types';
import { formatPrice } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import FraudReportModal from './FraudReportModal';
import VehicleListingForm from './VehicleListingForm';
import ShareButtons from './ShareButtons';

interface MarketplaceProps {
  user: any;
  setView: (view: any) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ user, setView }) => {
  const [listings, setListings] = useState<VehicleListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CAR' | 'MOTORCYCLE'>('ALL');
  
  const [selectedListing, setSelectedListing] = useState<VehicleListing | null>(null);
  const [recommendedParts, setRecommendedParts] = useState<Product[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isListingFormOpen, setIsListingFormOpen] = useState(false);

  useEffect(() => {
    fetchListings();
    
    // Handle deep linking for listings
    const params = new URLSearchParams(window.location.search);
    const listingId = params.get('listing');
    if (listingId) {
      const fetchListing = async () => {
        try {
          const res = await apiClient.get(`/marketplace/${listingId}`);
          if (res.data) {
            handleListingClick(res.data);
          }
        } catch (e) {
          console.error('Error fetching deep linked listing', e);
        }
      };
      fetchListing();
    }
  }, [filterType]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let url = '/marketplace';
      const params = new URLSearchParams();
      if (filterType !== 'ALL') params.append('vehicleType', filterType);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await apiClient.get(url);
      setListings(res.data);
    } catch (e) {
      console.error('Error fetching listings', e);
    } finally {
      setLoading(false);
    }
  };

  const handleListingClick = async (listing: VehicleListing) => {
    setSelectedListing(listing);
    
    // Update URL for deep linking
    const params = new URLSearchParams(window.location.search);
    params.set('listing', listing.id);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    // Fetch recommended parts for this vehicle
    try {
      const res = await apiClient.get(`/products?search=${listing.make} ${listing.model}`);
      setRecommendedParts(res.data.slice(0, 3));
    } catch (e) {
      console.error('Error fetching recommendations', e);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header & Search */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Search by make, model, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <button 
                onClick={() => setFilterType('ALL')}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filterType === 'ALL' ? 'bg-masuma-orange text-white shadow-lg shadow-masuma-orange/20' : 'bg-white text-gray-600 border border-gray-200 hover:border-masuma-orange'}`}
              >
                All Vehicles
              </button>
              <button 
                onClick={() => setFilterType('CAR')}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center ${filterType === 'CAR' ? 'bg-masuma-orange text-white shadow-lg shadow-masuma-orange/20' : 'bg-white text-gray-600 border border-gray-200 hover:border-masuma-orange'}`}
              >
                <Car className="w-4 h-4 mr-2" />
                Cars
              </button>
              <button 
                onClick={() => setFilterType('MOTORCYCLE')}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center ${filterType === 'MOTORCYCLE' ? 'bg-masuma-orange text-white shadow-lg shadow-masuma-orange/20' : 'bg-white text-gray-600 border border-gray-200 hover:border-masuma-orange'}`}
              >
                <Bike className="w-4 h-4 mr-2" />
                Motorcycles
              </button>
              <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
              
              <button 
                onClick={() => {
                  if (!user) {
                    setView('LOGIN');
                    return;
                  }
                  setIsListingFormOpen(true);
                }}
                className="ml-auto bg-masuma-dark text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all flex items-center shadow-xl shadow-gray-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                List Your Vehicle
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-96 animate-pulse" />
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map(listing => (
                  <motion.div 
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleListingClick(listing)}
                    className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={listing.images?.[0] || 'https://picsum.photos/seed/car/800/600'} 
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-masuma-dark uppercase tracking-widest shadow-sm">
                          {listing.vehicleType}
                        </span>
                        {listing.isImported && (
                          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                            Imported
                          </span>
                        )}
                      </div>
                      <button className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-full text-gray-400 hover:text-red-500 hover:scale-110 transition-all shadow-sm">
                        <Heart className="w-5 h-5" />
                      </button>
                      
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">Price</p>
                            <span className="text-2xl font-black text-white">{formatPrice(listing.price)}</span>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {listing.seller?.role === 'DEALER' ? (
                              <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-1 rounded-md flex items-center shadow-lg">
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                DEALER
                              </span>
                            ) : (
                              <span className="text-[9px] font-black bg-masuma-orange text-white px-2 py-1 rounded-md shadow-lg">VERIFIED</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-masuma-dark mb-3 group-hover:text-masuma-orange transition-colors line-clamp-1 font-display">
                        {listing.year} {listing.make} {listing.model}
                      </h3>
                      
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="flex flex-col items-center justify-center text-center bg-gray-50 p-2.5 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:border-masuma-orange/20 transition-colors">
                          <Gauge className="w-4 h-4 mb-1 text-masuma-orange" />
                          <span className="text-[10px] font-bold text-gray-900">{listing.mileage?.toLocaleString()}</span>
                          <span className="text-[8px] text-gray-400 uppercase font-bold">KM</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center bg-gray-50 p-2.5 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:border-masuma-orange/20 transition-colors">
                          <Fuel className="w-4 h-4 mb-1 text-masuma-orange" />
                          <span className="text-[10px] font-bold text-gray-900">{listing.fuelType}</span>
                          <span className="text-[8px] text-gray-400 uppercase font-bold">FUEL</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center bg-gray-50 p-2.5 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:border-masuma-orange/20 transition-colors">
                          <Settings2 className="w-4 h-4 mb-1 text-masuma-orange" />
                          <span className="text-[10px] font-bold text-gray-900">{listing.transmission?.substring(0, 4)}</span>
                          <span className="text-[8px] text-gray-400 uppercase font-bold">TRANS</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center text-xs font-bold text-gray-400">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-masuma-orange" />
                          {listing.location || 'Nairobi'}
                        </div>
                        <div className="flex items-center text-xs font-black text-masuma-orange uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                          Details
                          <ChevronRight className="w-4 h-4 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No listings found</h3>
                <p className="text-gray-500">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>

          {/* Sidebar / Details Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {selectedListing ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-masuma-dark font-display">VEHICLE SPECS</h3>
                      <div className="w-12 h-1 bg-masuma-orange mt-1 rounded-full"></div>
                    </div>
                    <button onClick={() => {
                      setSelectedListing(null);
                      const params = new URLSearchParams(window.location.search);
                      params.delete('listing');
                      const newSearch = params.toString();
                      const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
                      window.history.pushState({ path: newUrl }, '', newUrl);
                    }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <XCircle className="w-6 h-6 text-gray-300" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Seller</p>
                      <p className="text-sm font-bold text-masuma-dark truncate">{selectedListing.seller.fullName}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Body</p>
                      <p className="text-sm font-bold text-masuma-dark">{selectedListing.bodyType || 'Sedan'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Engine</p>
                      <p className="text-sm font-bold text-masuma-dark">{selectedListing.engineSize} CC</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Color</p>
                      <p className="text-sm font-bold text-masuma-dark">{selectedListing.color || 'Silver'}</p>
                    </div>
                  </div>

                  {/* Trust Verification Section */}
                  <div className="mb-8">
                    <h4 className="text-xs font-black text-masuma-dark uppercase tracking-widest mb-4 flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-2 text-masuma-orange" />
                      Verification Status
                    </h4>
                    
                    <div className="space-y-3">
                      {selectedListing.scanReportUrl ? (
                        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 relative overflow-hidden group">
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <FileText className="w-5 h-5 text-green-600 mr-2" />
                                <h4 className="text-xs font-black text-green-800 uppercase tracking-wider">Diagnostic Scan</h4>
                              </div>
                              <span className="bg-green-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">Verified</span>
                            </div>
                            <p className="text-[10px] text-green-700 mb-3 leading-relaxed">
                              Full computerized diagnostic report available for this unit.
                            </p>
                            <a 
                              href={selectedListing.scanReportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-white text-green-700 py-2.5 rounded-xl text-xs font-black hover:bg-green-600 hover:text-white transition-all flex items-center justify-center border border-green-200 shadow-sm"
                            >
                              OPEN PDF REPORT
                              <ExternalLink className="w-3 h-3 ml-2" />
                            </a>
                          </div>
                          <ShieldCheck className="absolute -bottom-4 -right-4 w-20 h-20 text-green-600/5 rotate-12" />
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4 flex items-center justify-center text-center">
                          <p className="text-[10px] font-bold text-gray-400">No diagnostic scan report uploaded.</p>
                        </div>
                      )}

                      {selectedListing.auctionSheetUrl && (
                        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 relative overflow-hidden group">
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <FileText className="w-5 h-5 text-purple-600 mr-2" />
                                <h4 className="text-xs font-black text-purple-800 uppercase tracking-wider">Auction Sheet</h4>
                              </div>
                              <span className="bg-purple-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">Official</span>
                            </div>
                            <p className="text-[10px] text-purple-700 mb-3 leading-relaxed">
                              Original auction sheet verifying condition and mileage.
                            </p>
                            <a 
                              href={selectedListing.auctionSheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-white text-purple-700 py-2.5 rounded-xl text-xs font-black hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center border border-purple-200 shadow-sm"
                            >
                              VIEW AUCTION SHEET
                              <ExternalLink className="w-3 h-3 ml-2" />
                            </a>
                          </div>
                          <FileText className="absolute -bottom-4 -right-4 w-20 h-20 text-purple-600/5 rotate-12" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Monetization Layer */}
                  <div className="bg-masuma-dark rounded-2xl p-5 mb-8 relative overflow-hidden">
                    <div className="relative z-10">
                      <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center">
                        <Star className="w-4 h-4 mr-2 text-masuma-orange fill-masuma-orange" />
                        MASUMA SPARES
                      </h4>
                      <div className="space-y-3">
                        {recommendedParts.map(part => (
                          <div key={part.id} className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/10 group cursor-pointer hover:bg-white/10 transition-all">
                            <img src={part.image} alt={part.name} className="w-10 h-10 object-cover rounded-lg" />
                            <div className="flex-grow min-w-0">
                              <p className="text-[10px] font-bold text-white truncate">{part.name}</p>
                              <p className="text-[10px] text-masuma-orange font-black">{formatPrice(part.price)}</p>
                            </div>
                            <ArrowRight className="w-3 h-3 text-white/30 group-hover:text-masuma-orange transition-colors" />
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => setView('CATALOG')}
                        className="w-full mt-4 text-[10px] font-black text-white/50 hover:text-masuma-orange transition-colors uppercase tracking-widest"
                      >
                        Browse all compatible parts
                      </button>
                    </div>
                    <Settings2 className="absolute -bottom-6 -right-6 w-24 h-24 text-white/5 rotate-12" />
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        const phone = selectedListing.seller.phone || '254792506590';
                        const text = encodeURIComponent(`Hi, I'm interested in your ${selectedListing.year} ${selectedListing.make} ${selectedListing.model} listed on Masuma Marketplace for ${formatPrice(selectedListing.price)}. Is it still available?`);
                        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
                      }}
                      className="w-full bg-masuma-orange text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-masuma-orange-dark transition-all flex items-center justify-center shadow-xl shadow-masuma-orange/20"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Contact Seller
                    </button>
                    <div className="pt-4 border-t border-gray-100">
                      <ShareButtons 
                        url={`${window.location.origin}/?listing=${selectedListing.id}`}
                        title={`Check out this ${selectedListing.year} ${selectedListing.make} ${selectedListing.model} on Masuma Marketplace`}
                        contentId={selectedListing.id}
                        contentType="POST" 
                      />
                    </div>
                    <button 
                      onClick={() => setIsReportModalOpen(true)}
                      className="w-full bg-red-50 text-red-600 py-3 rounded-2xl font-bold text-xs hover:bg-red-100 transition-all flex items-center justify-center"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Report Listing
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-12 text-center">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Car className="w-10 h-10 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-black text-masuma-dark font-display uppercase tracking-wider mb-2">Select Vehicle</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">Click on a listing to view detailed specs and verified reports.</p>
                </div>
              )}

              {/* Fraud Prevention Tips */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-green-600" />
                  Safe Buying Tips
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />
                    Never send a deposit before seeing the vehicle in person.
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />
                    Meet in a safe, public place for inspections.
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />
                    Verify the logbook and chassis number with NTSA/KRA.
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />
                    Use our "Report" feature if a deal seems too good to be true.
                  </li>
                </ul>
              </div>

              {/* Promo Card */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2">Importing a car?</h3>
                  <p className="text-gray-300 text-sm mb-4">Use our intelligent calculator to see exact KRA duties and taxes.</p>
                  <button 
                    onClick={() => setView('IMPORT_CALCULATOR')}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors flex items-center"
                  >
                    Try Calculator
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
                <Calculator className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isReportModalOpen && selectedListing && (
          <FraudReportModal 
            listingId={selectedListing.id}
            listingTitle={`${selectedListing.year} ${selectedListing.make} ${selectedListing.model}`}
            onClose={() => setIsReportModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isListingFormOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="my-8 w-full max-w-4xl">
              <VehicleListingForm 
                onSuccess={() => {
                  setIsListingFormOpen(false);
                  fetchListings();
                }}
                onCancel={() => setIsListingFormOpen(false)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Marketplace;
