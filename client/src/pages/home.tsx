import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { ChatWidget } from "@/components/chat-widget";
import { LeadCaptureModal } from "@/components/lead-capture-modal";
import { PropertyCard } from "@/components/property-card";
import { ScraperControl } from "@/components/scraper-control";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showLeadModal, setShowLeadModal] = useState(false);

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  const handlePropertySearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-real-estate-blue rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-real-estate-dark">Railey Realty</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-real-estate-gray hover:text-real-estate-blue transition-colors">Properties</a>
              <a href="#" className="text-real-estate-gray hover:text-real-estate-blue transition-colors">About</a>
              <a href="#" className="text-real-estate-gray hover:text-real-estate-blue transition-colors">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold text-real-estate-dark mb-4">Discover Deep Creek Lake Properties</h2>
          <p className="text-xl text-real-estate-gray mb-8">Find lakefront homes, ski properties, and mountain retreats in beautiful Garrett County, Maryland</p>
          
          {/* Property Search Bar */}
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
            <form onSubmit={handlePropertySearch} className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                placeholder="Search Deep Creek Lake, Garrett County properties..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-real-estate-blue focus:border-transparent"
              />
              <button 
                type="submit"
                className="bg-real-estate-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search Properties
              </button>
            </form>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="mb-12 flex justify-center">
          <ScraperControl />
        </section>

        {/* Featured Properties */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-real-estate-dark mb-6">Featured Properties</h3>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-300"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded mb-3 w-2/3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-300 rounded w-24"></div>
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.slice(0, 6).map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  onLeadCapture={() => setShowLeadModal(true)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Chat Widget */}
      <ChatWidget onLeadCapture={() => setShowLeadModal(true)} />

      {/* Lead Capture Modal */}
      <LeadCaptureModal 
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
      />
    </div>
  );
}
