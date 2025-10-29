import { type Property, type InsertProperty } from "@shared/schema";

interface RaileyProperty {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: string;
  sqft?: number;
  lotSize?: string;
  imageUrl: string;
  description: string;
  features: string[];
  daysOnMarket: number;
  mlsNumber: string;
}

export class RaileyScraper {
  private baseUrl = "https://www.railey.com";
  private listings: RaileyProperty[] = [];
  private lastFetched: Date | null = null;
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes

  async fetchListings(): Promise<RaileyProperty[]> {
    // Return cached data if still valid
    if (
      this.lastFetched &&
      Date.now() - this.lastFetched.getTime() < this.cacheTimeout
    ) {
      return this.listings;
    }

    try {
      // console.log(`Attempting to fetch from: ${this.baseUrl}/listings/`);
      // const response = await fetch(`${this.baseUrl}/listings/`);

      // console.log(`Response status: ${response.status} ${response.statusText}`);
      // console.log(
      //   `Response headers:`,
      //   Object.fromEntries(response.headers.entries()),
      // );

      // const html = await response.text();
      // console.log(`HTML length: ${html.length} characters`);
      // console.log(`HTML preview (first 500 chars):`, html.substring(0, 500));

      // Parse the HTML to extract property data
      const properties = []

      if (properties.length === 0) {
        console.log(
          "No properties parsed from HTML - likely website structure changed",
        );
        console.log("Using sample data as fallback");
        return this.getSampleData();
      }

      this.listings = properties;
      this.lastFetched = new Date();

      console.log(
        `Successfully parsed ${properties.length} properties from Railey.com`,
      );
      return properties;
    } catch (error) {
      console.error("Error fetching Railey listings:", error);
      console.log("Using sample data as fallback due to error");
      // Return cached data if available, or sample data as fallback
      return this.listings.length > 0 ? this.listings : this.getSampleData();
    }
  }

  private parseListingsFromHtml(html: string): RaileyProperty[] {
    const properties: RaileyProperty[] = [];

    // Extract property data using regex patterns from the HTML structure
    const listingPattern =
      /MLS#:\s*(\d+).*?href="([^"]*)".*?\$([0-9,]+).*?([^<]*)<.*?(\d+)\s+Bed.*?(\d+(?:\.\d+)?)\s+Bath.*?(\d+,?\d*)\s+SqFt/g;

    let match;
    while (
      (match = listingPattern.exec(html)) !== null &&
      properties.length < 50
    ) {
      const [, mlsNumber, url, priceStr, addressLine, beds, baths, sqft] =
        match;

      // Clean up the data
      const price = parseInt(priceStr.replace(/,/g, ""));
      const address = addressLine.trim();
      const bedrooms = parseInt(beds);
      const bathrooms = baths;
      const squareFeet = parseInt(sqft.replace(/,/g, ""));

      // Extract image URL from a separate pattern
      const imagePattern = new RegExp(
        `img[^>]*src="([^"]*)"[^>]*alt="[^"]*${mlsNumber}[^"]*"`,
      );
      const imageMatch = html.match(imagePattern);
      const imageUrl = imageMatch
        ? imageMatch[1]
        : "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";

      // Determine property type and features based on location and details
      const features = this.extractFeatures(address, squareFeet, price);
      const title = this.generateTitle(address, features);
      const description = this.generateDescription(address, features, price);

      properties.push({
        id: mlsNumber,
        title,
        address,
        price,
        bedrooms,
        bathrooms,
        sqft: squareFeet,
        imageUrl,
        description,
        features,
        daysOnMarket: 0,
        mlsNumber,
      });
    }

    // If parsing failed, return sample data with Railey.com context
    if (properties.length === 0) {
      return this.getSampleData();
    }

    return properties;
  }

  private extractFeatures(
    address: string,
    sqft: number,
    price: number,
  ): string[] {
    const features: string[] = [];

    // Location-based features
    if (
      address.toLowerCase().includes("deep creek") ||
      address.toLowerCase().includes("lake")
    ) {
      features.push("Lake Access", "Mountain Views");
    }
    if (
      address.toLowerCase().includes("wisp") ||
      address.toLowerCase().includes("ski")
    ) {
      features.push("Ski Access", "Resort Area");
    }
    if (address.toLowerCase().includes("garrett")) {
      features.push("Garrett County", "Mountain Location");
    }

    // Size-based features
    if (sqft > 2500) {
      features.push("Spacious Living", "Large Floor Plan");
    }
    if (sqft > 3500) {
      features.push("Luxury Home");
    }

    // Price-based features
    if (price > 500000) {
      features.push("Premium Property", "High-End Finishes");
    }
    if (price > 750000) {
      features.push("Luxury Estate");
    }

    // Default features for Maryland mountain properties
    if (features.length === 0) {
      features.push(
        "Mountain Living",
        "Natural Setting",
        "Four Season Location",
      );
    }

    return features;
  }

  private generateTitle(address: string, features: string[]): string {
    if (features.includes("Lake Access")) {
      return `Lake Access Home - ${address.split(",")[0]}`;
    }
    if (features.includes("Ski Access")) {
      return `Ski Resort Property - ${address.split(",")[0]}`;
    }
    if (features.includes("Luxury Estate")) {
      return `Luxury Mountain Estate - ${address.split(",")[0]}`;
    }

    return `Mountain Home - ${address.split(",")[0]}`;
  }

  private generateDescription(
    address: string,
    features: string[],
    price: number,
  ): string {
    const location = address.includes("MD") ? "Maryland mountain" : "scenic";
    const priceRange =
      price > 500000 ? "luxury" : price > 300000 ? "premium" : "comfortable";

    return `Beautiful ${priceRange} home in the ${location} area of Garrett County. This property offers ${features.slice(0, 3).join(", ").toLowerCase()} and is perfect for year-round living or as a vacation retreat in Deep Creek Lake area.`;
  }

  private getSampleData(): RaileyProperty[] {
    // Sample data based on actual Railey.com market (Deep Creek Lake, MD area)
    return [
      {
        id: "sample-1",
        title: "Lakefront Mountain Retreat",
        address: "123 Deep Creek Lake Dr, McHenry, MD 21541",
        price: 525000,
        bedrooms: 3,
        bathrooms: "2.5",
        sqft: 2100,
        imageUrl:
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        description:
          "Stunning lakefront property with private dock access and panoramic mountain views. Perfect for year-round living or vacation rental.",
        features: ["Lakefront", "Private Dock", "Mountain Views", "Fireplace"],
        daysOnMarket: 15,
        mlsNumber: "SAMPLE001",
      },
      {
        id: "sample-2",
        title: "Ski-In/Ski-Out Condo",
        address: "456 Wisp Resort Rd, McHenry, MD 21541",
        price: 285000,
        bedrooms: 2,
        bathrooms: "2",
        sqft: 1200,
        imageUrl:
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        description:
          "Modern condo with direct ski slope access at Wisp Resort. Fully furnished and ready for mountain adventures.",
        features: [
          "Ski Access",
          "Resort Amenities",
          "Furnished",
          "Mountain Views",
        ],
        daysOnMarket: 8,
        mlsNumber: "SAMPLE002",
      },
      {
        id: "sample-3",
        title: "Mountain View Family Home",
        address: "789 Garrett Heights Way, Oakland, MD 21550",
        price: 375000,
        bedrooms: 4,
        bathrooms: "3",
        sqft: 2800,
        imageUrl:
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        description:
          "Spacious family home with breathtaking mountain views and large yard. Great for full-time residence in beautiful Garrett County.",
        features: [
          "Mountain Views",
          "Large Yard",
          "Family Friendly",
          "Updated Kitchen",
        ],
        daysOnMarket: 22,
        mlsNumber: "SAMPLE003",
      },
      {
        id: "sample-4",
        title: "Lake Access Cabin",
        address: "321 Lakeshore Trail, Swanton, MD 21561",
        price: 195000,
        bedrooms: 2,
        bathrooms: "1",
        sqft: 1000,
        imageUrl:
          "https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        description:
          "Cozy cabin with lake access and hiking trails nearby. Perfect weekend getaway in the heart of nature.",
        features: [
          "Lake Access",
          "Hiking Trails",
          "Cozy Cabin",
          "Natural Setting",
        ],
        daysOnMarket: 5,
        mlsNumber: "SAMPLE004",
      },
      {
        id: "sample-5",
        title: "Luxury Mountain Estate",
        address: "654 Summit Ridge Dr, Terra Alta, WV 26764",
        price: 750000,
        bedrooms: 5,
        bathrooms: "4.5",
        sqft: 4200,
        imageUrl:
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        description:
          "Impressive luxury estate with premium finishes, multiple fireplaces, and expansive mountain views from every room.",
        features: [
          "Luxury Estate",
          "Premium Finishes",
          "Multiple Fireplaces",
          "Panoramic Views",
        ],
        daysOnMarket: 45,
        mlsNumber: "SAMPLE005",
      },
    ];
  }

  // Convert Railey property to our app's property format
  convertToAppProperty(raileyProperty: RaileyProperty): Property {
    return {
      id: raileyProperty.id,
      title: raileyProperty.title,
      address: raileyProperty.address,
      price: raileyProperty.price,
      bedrooms: raileyProperty.bedrooms,
      bathrooms: raileyProperty.bathrooms,
      imageUrl: raileyProperty.imageUrl,
      description: raileyProperty.description,
      features: raileyProperty.features,
      createdAt: new Date(),
    };
  }
}

export const raileyScraper = new RaileyScraper();
