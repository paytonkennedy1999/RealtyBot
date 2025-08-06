import { type Property, type InsertProperty, type Lead, type InsertLead, type ChatSession, type InsertChatSession, type ChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";
import { raileyScraper } from "./railey-scraper";

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
    
    // Initialize with Railey.com data
    this.initializeRaileyData();
  }

  private async initializeRaileyData() {
    try {
      const raileyProperties = await raileyScraper.fetchListings();
      const convertedProperties = raileyProperties.slice(0, 12).map(prop => 
        raileyScraper.convertToAppProperty(prop)
      );
      
      convertedProperties.forEach(property => {
        this.properties.set(property.id, {
          ...property,
          description: property.description || null,
          features: property.features || null
        });
      });
      
      console.log(`Initialized with ${convertedProperties.length} properties from Railey.com`);
    } catch (error) {
      console.error('Error initializing Railey data:', error);
    }
  }

  async getProperties(): Promise<Property[]> {
    // Refresh Railey.com data periodically
    if (this.properties.size === 0) {
      await this.initializeRaileyData();
    }
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
      phone: insertLead.phone || null,
      budget: insertLead.budget || null,
      interests: insertLead.interests || null
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
      messages: insertSession.messages || []
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
