import { Property } from "@shared/schema";

interface PropertyCardProps {
  property: Property;
  onLeadCapture: () => void;
}

export function PropertyCard({ property, onLeadCapture }: PropertyCardProps) {
  const handleClick = () => {
    // For MVP, clicking on a property triggers lead capture
    onLeadCapture();
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
      onClick={handleClick}
    >
      <img 
        src={property.imageUrl} 
        alt={property.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h4 className="text-lg font-semibold text-real-estate-dark mb-2">{property.title}</h4>
        <p className="text-real-estate-gray text-sm mb-3">{property.address}</p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-real-estate-blue">
            ${property.price.toLocaleString()}
          </span>
          <span className="text-sm text-real-estate-gray">
            {property.bedrooms} bed • {property.bathrooms} bath
          </span>
        </div>
      </div>
    </div>
  );
}
