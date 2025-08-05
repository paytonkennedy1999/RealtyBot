import { type Property, type InsertProperty, type Lead, type InsertLead, type ChatSession, type InsertChatSession, type ChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Properties
  getProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property | undefined>;
  searchProperties(query: string, maxPrice?: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;

  // Leads
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(): Promise<Lead[]>;

  // Chat Sessions
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(sessionId: string, messages: ChatMessage[]): Promise<ChatSession>;
}

export class MemStorage implements IStorage {
  private properties: Map<string, Property>;
  private leads: Map<string, Lead>;
  private chatSessions: Map<string, ChatSession>;

  constructor() {
    this.properties = new Map();
    this.leads = new Map();
    this.chatSessions = new Map();
    
    // Initialize with sample properties
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleProperties: InsertProperty[] = [
      {
        title: "Downtown Luxury Condo",
        address: "123 Main St, Downtown",
        price: 425000,
        bedrooms: 2,
        bathrooms: "2",
        imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        description: "Modern downtown condo with city skyline view and premium finishes.",
        features: ["City view", "Modern appliances", "Gym access", "Concierge"]
      },
      {
        title: "Family Home with Yard",
        address: "456 Oak Ave, Suburbia",
        price: 325000,
        bedrooms: 3,
        bathrooms: "2.5",
        imageUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        description: "Spacious family home with large backyard perfect for children and pets.",
        features: ["Large yard", "Updated kitchen", "Two-car garage", "Quiet neighborhood"]
      },
      {
        title: "Waterfront Townhouse",
        address: "789 Lake Dr, Riverside",
        price: 575000,
        bedrooms: 3,
        bathrooms: "3",
        imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        description: "Beautiful waterfront townhouse with dock access and stunning lake views.",
        features: ["Waterfront", "Dock access", "Lake views", "Premium location"]
      },
      {
        title: "Oak Valley Home",
        address: "321 Valley Rd, Oak Valley",
        price: 295000,
        bedrooms: 3,
        bathrooms: "2",
        imageUrl: "https://images.unsplash.com/photo-1576941089067-2de3c901e126?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        description: "Cozy suburban home with modern updates and great schools nearby.",
        features: ["Updated interior", "Great schools", "Quiet street", "Move-in ready"]
      },
      {
        title: "Modern Ranch Style",
        address: "654 Pine St, Westfield",
        price: 385000,
        bedrooms: 4,
        bathrooms: "2.5",
        imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        description: "Single-story ranch with open floor plan and beautiful landscaping.",
        features: ["Open floor plan", "Master suite", "Landscaped yard", "Single story"]
      }
    ];

    sampleProperties.forEach(property => {
      this.createProperty(property);
    });
  }

  async getProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async getProperty(id: string): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async searchProperties(query: string, maxPrice?: number): Promise<Property[]> {
    const allProperties = Array.from(this.properties.values());
    const searchTerm = query.toLowerCase();
    
    return allProperties.filter(property => {
      const matchesQuery = 
        property.title.toLowerCase().includes(searchTerm) ||
        property.address.toLowerCase().includes(searchTerm) ||
        property.description?.toLowerCase().includes(searchTerm) ||
        property.features?.some(feature => feature.toLowerCase().includes(searchTerm));
      
      const matchesPrice = maxPrice ? property.price <= maxPrice : true;
      
      return matchesQuery && matchesPrice;
    });
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = randomUUID();
    const property: Property = {
      ...insertProperty,
      id,
      createdAt: new Date(),
    };
    this.properties.set(id, property);
    return property;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = {
      ...insertLead,
      id,
      createdAt: new Date(),
    };
    this.leads.set(id, lead);
    return lead;
  }

  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    return Array.from(this.chatSessions.values()).find(session => session.sessionId === sessionId);
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const session: ChatSession = {
      ...insertSession,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async updateChatSession(sessionId: string, messages: ChatMessage[]): Promise<ChatSession> {
    const session = await this.getChatSession(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }
    
    session.messages = messages;
    session.updatedAt = new Date();
    this.chatSessions.set(session.id, session);
    return session;
  }
}

export const storage = new MemStorage();
