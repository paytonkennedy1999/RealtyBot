import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertChatSessionSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import OpenAI from "openai";

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
    
    // If OpenAI quota exceeded, fall back to smart keyword matching
    if (error instanceof Error && error.message.includes('quota')) {
      return generateSmartFallbackResponse(message, conversationHistory);
    }
    
    return "I'm here to help you discover beautiful Deep Creek Lake and Garrett County properties! What type of home are you looking for?";
  }
}

function generateSmartFallbackResponse(message: string, conversationHistory: any[]): string {
  const lowerMessage = message.toLowerCase();
  
  // Enhanced keyword matching with context awareness
  if (lowerMessage.includes('deep creek') || lowerMessage.includes('lake') || lowerMessage.includes('lakefront')) {
    return "Deep Creek Lake is absolutely beautiful! We have stunning lakefront properties, lake access homes, and lake view properties available. The lake offers year-round recreation - swimming, boating, and fishing in summer, ice fishing in winter. Are you interested in direct lakefront access or would a lake view property work for you?";
  } else if (lowerMessage.includes('ski') || lowerMessage.includes('wisp') || lowerMessage.includes('resort') || lowerMessage.includes('slope')) {
    return "Wisp Resort is fantastic for skiing and year-round mountain activities! We have ski-in/ski-out condos, mountain homes near the slopes, and properties perfect for vacation rentals. The resort offers skiing, mountain biking, and scenic chairlift rides. Are you looking for a vacation home or investment property near Wisp?";
  } else if (lowerMessage.includes('bedroom') || lowerMessage.includes('bed') || lowerMessage.includes('size')) {
    return "Great question about size! Our Deep Creek Lake properties range from cozy 1-bedroom condos perfect for couples' getaways, to spacious 5+ bedroom mountain estates ideal for large families or vacation rentals. What size property would work best for your needs?";
  } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('budget') || lowerMessage.includes('afford')) {
    return "Deep Creek Lake offers properties for various budgets! We have charming cabins starting around $200k, family homes in the $300-500k range, and luxury lakefront estates up to $750k+. Mountain properties often have great value compared to other vacation destinations. What's your target budget range?";
  } else if (lowerMessage.includes('schedule') || lowerMessage.includes('showing') || lowerMessage.includes('view') || lowerMessage.includes('visit')) {
    return "I'd love to arrange a property showing for you! Deep Creek Lake is even more beautiful in person. Our local agents know every neighborhood and can show you the best properties for your needs. Would you like me to connect you with one of our experienced agents to schedule a visit?";
  } else if (lowerMessage.includes('vacation') || lowerMessage.includes('rental') || lowerMessage.includes('investment') || lowerMessage.includes('income')) {
    return "Deep Creek Lake has an excellent vacation rental market! Properties near the lake and Wisp Resort stay booked, especially during peak seasons. Many owners cover their mortgage payments with rental income. Are you thinking about a property for personal use that could also generate rental income?";
  } else if (lowerMessage.includes('area') || lowerMessage.includes('location') || lowerMessage.includes('neighborhood') || lowerMessage.includes('garrett')) {
    return "Garrett County has wonderful diverse areas! Lakefront properties offer direct access to Deep Creek Lake, mountain properties near Wisp Resort provide ski access, and rural areas offer privacy with acreage. Each area has its own character and benefits. What type of setting appeals to you most?";
  } else if (lowerMessage.includes('thanks') || lowerMessage.includes('thank')) {
    return "You're very welcome! I'm here to help you find your perfect Deep Creek Lake property. The area truly offers something special - whether you're drawn to lakefront living, mountain adventures, or peaceful retreats. What else would you like to know about our beautiful area?";
  } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello and welcome to Railey Realty! I'm excited to help you explore Deep Creek Lake and Garrett County properties. We specialize in this gorgeous mountain region with its pristine lake, excellent skiing, and peaceful mountain retreats. What type of property experience are you looking for?";
  } else {
    // Default response with more personality
    return "I'm passionate about helping people discover the magic of Deep Creek Lake and Garrett County! Whether you're dreaming of morning coffee overlooking the lake, afternoon skiing at Wisp Resort, or peaceful evenings in a mountain retreat, we have incredible properties to explore. What draws you to our beautiful area?";
  }
}
