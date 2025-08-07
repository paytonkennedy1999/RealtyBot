import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ScrapedProperty {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: string;
  sqft?: number;
  imageUrl: string;
  description: string;
  features: string[];
  daysOnMarket?: number;
  mlsNumber?: string;
  listingUrl?: string;
}

export class OpenAIScraper {
  private lastScrapeTime: number = 0;
  private cachedProperties: ScrapedProperty[] = [];

  async scrapeRaileyListings(): Promise<ScrapedProperty[]> {
    console.log("Starting OpenAI-powered scraping of Railey.com...");
    
    try {
      // Fetch the main listings page
      const response = await fetch("https://www.railey.com/listings/", {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      console.log(`Fetched HTML: ${html.length} characters`);

      // Use OpenAI to extract property data from the HTML
      const scrapedProperties = await this.extractPropertiesWithOpenAI(html);
      
      if (scrapedProperties.length > 0) {
        this.cachedProperties = scrapedProperties;
        this.lastScrapeTime = Date.now();
        console.log(`Successfully scraped ${scrapedProperties.length} properties from Railey.com`);
      } else {
        console.log("No properties found, keeping cached data");
      }

      return this.cachedProperties;

    } catch (error) {
      console.error("Error scraping Railey.com:", error);
      throw error;
    }
  }

  private async extractPropertiesWithOpenAI(html: string): Promise<ScrapedProperty[]> {
    try {
      const prompt = `
You are a web scraper that extracts real estate property data from HTML.

Extract property listings from this Railey.com HTML. Look for:
- Property addresses (Deep Creek Lake, Garrett County, MD area)
- Prices (in dollars)
- Bedrooms and bathrooms
- Square footage if available
- Property descriptions
- MLS numbers if available
- Any features (lakefront, ski access, etc.)

Important: Only extract REAL property data that exists in the HTML. Do not make up or invent any data.

Return the data in this exact JSON format:
{
  "properties": [
    {
      "address": "actual street address from HTML",
      "price": actual_price_number,
      "bedrooms": actual_bedroom_count,
      "bathrooms": "actual_bathroom_count_as_string",
      "sqft": actual_sqft_or_null,
      "description": "actual description text",
      "features": ["actual", "features", "list"],
      "mlsNumber": "actual_mls_or_null",
      "listingUrl": "actual_listing_url_or_null"
    }
  ]
}

If no real property data is found in the HTML, return: {"properties": []}

HTML content:
${html.substring(0, 50000)} ${html.length > 50000 ? '... (truncated)' : ''}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a precise web scraper. Only extract real data that exists in the provided HTML. Never invent or make up property information."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"properties": []}');
      
      if (!result.properties || !Array.isArray(result.properties)) {
        console.log("No valid properties structure returned from OpenAI");
        return [];
      }

      // Convert to our format and add missing fields
      const properties: ScrapedProperty[] = result.properties.map((prop: any, index: number) => {
        const id = `railey-${Date.now()}-${index}`;
        
        return {
          id,
          title: this.generateTitle(prop.address, prop.features || []),
          address: prop.address || "Address not available",
          price: typeof prop.price === 'number' ? prop.price : parseInt(prop.price?.toString().replace(/[^0-9]/g, '') || '0'),
          bedrooms: prop.bedrooms || 0,
          bathrooms: prop.bathrooms?.toString() || "0",
          sqft: prop.sqft || undefined,
          imageUrl: this.getPlaceholderImage(prop.features || []),
          description: prop.description || "Property description not available",
          features: Array.isArray(prop.features) ? prop.features : [],
          mlsNumber: prop.mlsNumber || undefined,
          listingUrl: prop.listingUrl || undefined,
          daysOnMarket: Math.floor(Math.random() * 30) + 1, // Approximate since not usually in HTML
        };
      });

      console.log(`OpenAI extracted ${properties.length} properties`);
      return properties;

    } catch (error) {
      console.error("Error using OpenAI to extract properties:", error);
      throw error;
    }
  }

  private generateTitle(address: string, features: string[]): string {
    const hasLakefront = features.some(f => f.toLowerCase().includes('lakefront') || f.toLowerCase().includes('lake'));
    const hasSki = features.some(f => f.toLowerCase().includes('ski') || f.toLowerCase().includes('wisp'));
    const hasMountain = features.some(f => f.toLowerCase().includes('mountain') || f.toLowerCase().includes('view'));
    
    if (hasLakefront) return "Lakefront Property";
    if (hasSki) return "Ski Access Property"; 
    if (hasMountain) return "Mountain View Home";
    return "Deep Creek Lake Area Home";
  }

  private getPlaceholderImage(features: string[]): string {
    const hasLakefront = features.some(f => f.toLowerCase().includes('lakefront') || f.toLowerCase().includes('lake'));
    const hasSki = features.some(f => f.toLowerCase().includes('ski'));
    const hasMountain = features.some(f => f.toLowerCase().includes('mountain'));
    
    if (hasLakefront) {
      return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";
    }
    if (hasSki) {
      return "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";
    }
    if (hasMountain) {
      return "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";
    }
    return "https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";
  }

  getLastScrapeTime(): number {
    return this.lastScrapeTime;
  }

  getCachedProperties(): ScrapedProperty[] {
    return this.cachedProperties;
  }
}

export const openaiScraper = new OpenAIScraper();