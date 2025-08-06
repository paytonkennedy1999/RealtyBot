# Railey Realty Chatbot Website

## Overview

This is a modern real estate chatbot website built for Railey Realty, specializing in Deep Creek Lake and Garrett County, Maryland properties. The application integrates live property data from Railey.com and features an intelligent chatbot for lead generation and customer engagement. Built with React, TypeScript, and Express.js, it provides an authentic real estate experience with actual market data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern React application with strict TypeScript configuration for type safety
- **Component Library**: Built on shadcn/ui with Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom real estate theme colors and CSS variables for theming
- **State Management**: TanStack React Query for server state management and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Express.js**: RESTful API server with middleware for JSON parsing and request logging
- **TypeScript**: Full-stack TypeScript implementation with ES modules
- **Storage Pattern**: Interface-based storage layer (`IStorage`) with in-memory implementation for development
- **Error Handling**: Centralized error handling middleware with structured error responses

### Database Design
- **PostgreSQL**: Production database using Neon serverless PostgreSQL
- **ORM**: Drizzle ORM with TypeScript-first schema definitions
- **Schema**: Three main entities:
  - `properties`: Real estate listings with pricing, location, and feature data
  - `leads`: Customer contact information and preferences
  - `chatSessions`: Conversational data for chatbot interactions
- **Migrations**: Drizzle Kit for schema migrations and database management

### Key Features
- **Live Property Data**: Direct integration with Railey.com for authentic Deep Creek Lake and Garrett County listings
- **Location-Specific Chatbot**: AI-powered assistant with knowledge of lakefront, ski properties, and mountain retreats
- **Lead Capture**: Modal-based lead capture system integrated with chatbot interactions
- **Real Estate Expertise**: Specialized responses for Deep Creek Lake area including lakefront access, Wisp Resort properties, and Garrett County locations
- **Responsive Design**: Mobile-first responsive design with adaptive layouts
- **Data Caching**: Smart caching system for Railey.com property data with 30-minute refresh cycles

### Development Architecture
- **Monorepo Structure**: Client, server, and shared code organized in a single repository
- **Shared Schema**: Common TypeScript types and Zod schemas shared between frontend and backend
- **Development Server**: Vite with HMR for fast development and TSX execution for server-side development
- **Build Process**: Separate build pipelines for client (Vite) and server (esbuild) with ES module output

### API Design
- **RESTful Endpoints**: Structured API for properties, leads, and chat sessions
- **Request Validation**: Zod schema validation for all API inputs
- **Response Formatting**: Consistent JSON response structure with error handling
- **Session Management**: Unique session IDs for chat state persistence

## External Dependencies

### Data Integration
- **Custom Railey.com Scraper**: Live property data integration with intelligent parsing and caching
- **Web Scraping**: Real-time property listings from https://www.railey.com with fallback data for reliability

### Core Framework Dependencies  
- **@neondatabase/serverless**: Serverless PostgreSQL database connection (development)
- **drizzle-orm & drizzle-kit**: TypeScript ORM and migration tooling
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form & @hookform/resolvers**: Form handling with Zod integration

### UI Component Libraries
- **@radix-ui/**: Complete set of accessible UI primitives (dialogs, forms, navigation)
- **lucide-react**: Icon library for consistent iconography
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variant handling

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for server development
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Replit-specific development tooling

### Form and Validation
- **zod**: Runtime type validation and schema definition
- **drizzle-zod**: Integration between Drizzle schemas and Zod validation

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **nanoid**: Unique ID generation for sessions and entities

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional CSS class composition
- **cmdk**: Command palette component for search interfaces