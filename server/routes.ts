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
        const updatedMessages = [...session.messages, newMessage];
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

      const finalMessages = [...session.messages, botMessage];
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
  
  if (lowerMessage.includes('property') || lowerMessage.includes('search') || lowerMessage.includes('house') || lowerMessage.includes('home')) {
    return "I can help you search for properties! What type of property are you looking for? You can specify bedrooms, budget range, or location preferences.";
  } else if (lowerMessage.includes('schedule') || lowerMessage.includes('showing') || lowerMessage.includes('view')) {
    return "I'd be happy to help you schedule a property showing. Please provide your contact information and let me know which property interests you.";
  } else if (lowerMessage.includes('agent') || lowerMessage.includes('contact') || lowerMessage.includes('speak')) {
    return "Let me connect you with one of our experienced agents. May I have your name and phone number so they can reach out to you?";
  } else if (lowerMessage.includes('mortgage') || lowerMessage.includes('loan') || lowerMessage.includes('financing')) {
    return "I can provide mortgage information and connect you with our preferred lenders. What's your budget range? We work with several banks to find the best rates.";
  } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('budget')) {
    return "I can help you find properties within your budget. What price range are you considering? Our current listings range from $295,000 to $575,000.";
  } else if (lowerMessage.includes('bedroom') || lowerMessage.includes('bed')) {
    return "How many bedrooms are you looking for? We have properties ranging from 2 to 4 bedrooms available.";
  } else if (lowerMessage.includes('location') || lowerMessage.includes('area') || lowerMessage.includes('neighborhood')) {
    return "What area interests you? We have properties in Downtown, Suburbia, Riverside, Oak Valley, and Westfield areas.";
  } else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return "You're welcome! I'm here to help with all your real estate needs. Is there anything else I can assist you with?";
  } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm your real estate assistant. I can help you find properties, schedule showings, provide mortgage information, and connect you with our agents. What can I help you with today?";
  } else {
    return "I'm here to help with your real estate needs! I can assist with property searches, scheduling showings, mortgage information, and connecting you with our agents. How can I help you today?";
  }
}
