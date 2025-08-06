import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertChatSessionSchema } from "@shared/schema";
import { randomUUID } from "crypto";

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

      // Generate bot response
      const botResponse = generateBotResponse(message);
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
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateBotResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('deep creek') || lowerMessage.includes('lake')) {
    return "Deep Creek Lake is Maryland's premier mountain destination! We have lakefront, lake access, and lake view properties available. Would you like to see our current lakefront listings or learn more about lake access properties?";
  } else if (lowerMessage.includes('ski') || lowerMessage.includes('wisp') || lowerMessage.includes('resort')) {
    return "Wisp Resort offers fantastic ski-in/ski-out properties! We have condos and homes near the slopes. Are you looking for a ski property for vacation rental income or personal use?";
  } else if (lowerMessage.includes('property') || lowerMessage.includes('search') || lowerMessage.includes('house') || lowerMessage.includes('home')) {
    return "I can help you find the perfect property in Garrett County and Deep Creek Lake area! Are you interested in lakefront properties, ski resort homes, mountain retreats, or year-round residences?";
  } else if (lowerMessage.includes('schedule') || lowerMessage.includes('showing') || lowerMessage.includes('view')) {
    return "I'd be happy to schedule a property showing with one of our Railey Realty agents. Please share your contact information and which property caught your interest - we'll arrange a visit to beautiful Garrett County!";
  } else if (lowerMessage.includes('agent') || lowerMessage.includes('contact') || lowerMessage.includes('speak')) {
    return "Our experienced Railey Realty agents know the Deep Creek Lake area inside and out. May I have your name and phone number so one of our local experts can reach out to you?";
  } else if (lowerMessage.includes('mortgage') || lowerMessage.includes('loan') || lowerMessage.includes('financing')) {
    return "We work with local and regional lenders who understand the unique Deep Creek Lake market. What's your budget range? Mountain properties often have special financing considerations we can help navigate.";
  } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('budget')) {
    return "Deep Creek Lake properties range from cozy cabins around $200k to luxury lakefront estates over $750k. What budget range works for you? I can show you what's available in your price point.";
  } else if (lowerMessage.includes('bedroom') || lowerMessage.includes('bed')) {
    return "How many bedrooms do you need? We have everything from 1-bedroom ski condos to 5+ bedroom luxury mountain estates. Family size or rental income potential - what's your priority?";
  } else if (lowerMessage.includes('location') || lowerMessage.includes('area') || lowerMessage.includes('neighborhood') || lowerMessage.includes('garrett')) {
    return "Garrett County offers diverse areas: lakefront properties on Deep Creek Lake, ski-access homes near Wisp Resort, Northern Garrett County with farms and acreage, and Southern Garrett County near Oakland. Which area interests you most?";
  } else if (lowerMessage.includes('vacation') || lowerMessage.includes('rental') || lowerMessage.includes('investment')) {
    return "Deep Creek Lake is a fantastic vacation rental market! Properties near the lake and Wisp Resort perform especially well. Are you looking for an investment property or a personal vacation home that could earn rental income?";
  } else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return "You're welcome! Railey Realty has been serving the Deep Creek Lake community for years. Is there anything else I can help you with regarding mountain properties?";
  } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! Welcome to Railey Realty - your Deep Creek Lake and Garrett County specialists! I can help you find lakefront properties, ski homes, mountain retreats, and year-round residences. What brings you to our beautiful area?";
  } else {
    return "I'm here to help you discover the beauty of Deep Creek Lake and Garrett County real estate! Whether you're looking for a lakefront home, ski property, mountain retreat, or investment opportunity, I can guide you through our current listings. How can I assist you today?";
  }
}
