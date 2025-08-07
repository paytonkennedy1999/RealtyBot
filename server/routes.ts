import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertChatSessionSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import OpenAI from "openai";
import { openaiScraper } from './openai-scraper.js';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all properties
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Debug endpoint to export scraper data
  app.get("/api/debug/scraper-data", async (req, res) => {
    try {
      const { raileyScraper } = await import("./railey-scraper.js");
      const rawData = await raileyScraper.fetchListings();
      
      res.json({
        timestamp: new Date().toISOString(),
        source: "railey-scraper",
        total_properties: rawData.length,
        cache_status: "legacy_scraper",
        data: rawData
      });
    } catch (error) {
      console.error("Error fetching scraper data:", error);
      res.status(500).json({ message: "Failed to fetch scraper data", error: String(error) });
    }
  });

  // Manual scrape endpoint using OpenAI
  app.post("/api/scrape-railey", async (req, res) => {
    try {
      console.log("Manual scrape triggered");
      const properties = await openaiScraper.scrapeRaileyListings();
      
      // Update storage with new properties
      if (properties.length > 0) {
        await storage.clearProperties();
        for (const property of properties) {
          await storage.createProperty(property);
        }
        console.log(`Updated storage with ${properties.length} properties from OpenAI scraper`);
      }

      res.json({
        success: true,
        message: `Successfully scraped ${properties.length} properties`,
        timestamp: new Date().toISOString(),
        properties_count: properties.length,
        last_scrape: openaiScraper.getLastScrapeTime()
      });
    } catch (error) {
      console.error("Error in manual scrape:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to scrape properties", 
        error: String(error)
      });
    }
  });

  // Get scraper status
  app.get("/api/scraper-status", async (req, res) => {
    try {
      const lastScrape = openaiScraper.getLastScrapeTime();
      const cachedCount = openaiScraper.getCachedProperties().length;
      
      res.json({
        last_scrape_time: lastScrape,
        last_scrape_formatted: lastScrape ? new Date(lastScrape).toLocaleString() : 'Never',
        cached_properties_count: cachedCount,
        is_recent: lastScrape && (Date.now() - lastScrape) < 3600000 // 1 hour
      });
    } catch (error) {
      console.error("Error getting scraper status:", error);
      res.status(500).json({ message: "Failed to get scraper status" });
    }
  });

  // Search properties
  app.get("/api/properties/search", async (req, res) => {
    try {
      const { q: query = "", maxPrice } = req.query;
      const maxPriceNum = maxPrice ? parseInt(maxPrice as string) : undefined;
      
      const properties = await storage.searchProperties(query as string, maxPriceNum);
      res.json(properties);
    } catch (error) {
      console.error("Error searching properties:", error);
      res.status(500).json({ message: "Failed to search properties" });
    }
  });

  // Get property by ID
  app.get("/api/properties/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  // Create lead
  app.post("/api/leads", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(400).json({ message: "Invalid lead data" });
    }
  });

  // Get chat session
  app.get("/api/chat/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getChatSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching chat session:", error);
      res.status(500).json({ message: "Failed to fetch chat session" });
    }
  });

  // Create or update chat session
  app.post("/api/chat", async (req, res) => {
    try {
      const { sessionId, message } = req.body;
      
      if (!sessionId || !message) {
        return res.status(400).json({ message: "Session ID and message are required" });
      }

      let session = await storage.getChatSession(sessionId);
      
      const newMessage = {
        id: randomUUID(),
        content: message,
        isUser: true,
        timestamp: new Date().toISOString(),
      };

      if (!session) {
        // Create new session
        session = await storage.createChatSession({
          sessionId,
          messages: [newMessage],
        });
      } else {
        // Update existing session
        const updatedMessages = [...(session.messages || []), newMessage];
        session = await storage.updateChatSession(sessionId, updatedMessages);
      }

      // Generate bot response using AI
      const botResponse = await generateAIBotResponse(message, session.messages || []);
      const botMessage = {
        id: randomUUID(),
        content: botResponse,
        isUser: false,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...(session.messages || []), botMessage];
      session = await storage.updateChatSession(sessionId, finalMessages);

      res.json(session);
    } catch (error) {
      console.error("Error handling chat message:", error);
      
      // Check if it's an OpenAI API error
      if (error && typeof error === 'object' && 'status' in error) {
        const statusCode = (error as any).status;
        if (statusCode === 429) {
          return res.status(429).json({ 
            message: "OpenAI API quota exceeded. Please check your billing and usage limits.",
            error: "quota_exceeded"
          });
        } else if (statusCode === 401) {
          return res.status(401).json({ 
            message: "OpenAI API authentication failed. Please check your API key.",
            error: "auth_failed"
          });
        }
      }
      
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function generateAIBotResponse(message: string, conversationHistory: any[]): Promise<string> {
  try {
    // Get current property data for context
    const properties = await storage.getProperties();
    const propertyContext = properties.slice(0, 5).map(p => 
      `${p.title} - ${p.location} - $${p.price?.toLocaleString() || 'Contact for price'} - ${p.bedrooms}bed/${p.bathrooms}bath`
    ).join('\n');

    // Build conversation context
    const conversationContext = conversationHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful real estate assistant for Railey Realty, specializing in Deep Creek Lake and Garrett County, Maryland properties. You help customers find lakefront homes, ski properties near Wisp Resort, mountain retreats, and investment properties.

Key expertise areas:
- Deep Creek Lake lakefront, lake access, and lake view properties
- Wisp Resort ski-in/ski-out properties and vacation rentals
- Garrett County mountain retreats and year-round homes
- Local market knowledge of pricing and neighborhoods
- Lead generation and scheduling property showings

Current available properties (sample):
${propertyContext}

Guidelines:
- Be conversational, helpful, and knowledgeable about the local area
- Ask qualifying questions to understand buyer needs
- Suggest specific property types based on their interests
- Offer to schedule showings or connect them with agents
- Mention local attractions like the lake, skiing, and mountain activities
- Keep responses concise but informative (2-3 sentences max)
- Always sound enthusiastic about the Deep Creek Lake area

If someone asks about specific properties, reference the current listings. If they want to schedule a showing or speak with an agent, offer to collect their contact information.`
        },
        {
          role: "user",
          content: `Conversation history:\n${conversationContext}\n\nLatest message: ${message}`
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "I'm here to help you find the perfect Deep Creek Lake property! What type of home interests you?";
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw error;
  }
}
