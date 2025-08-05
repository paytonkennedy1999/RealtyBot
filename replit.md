# Real Estate Property Website

## Overview

This is a modern real estate property website built with React, TypeScript, and Express.js. The application features a property listing interface with an integrated chatbot for lead generation and customer engagement. It uses a full-stack architecture with a PostgreSQL database and includes a comprehensive UI component library based on shadcn/ui.

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
- **Property Listings**: Browse and search real estate properties with filtering capabilities
- **Interactive Chatbot**: AI-powered chat widget for customer engagement and lead qualification
- **Lead Capture**: Modal-based lead capture system integrated with chatbot interactions
- **Responsive Design**: Mobile-first responsive design with adaptive layouts
- **Real-time Updates**: Query invalidation and optimistic updates for seamless user experience

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

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
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