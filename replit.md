# AI Keyboard Web Application

## Overview

This is an AI-powered keyboard web application designed for digital nomads and non-native speakers. The application provides a virtual keyboard interface with Russian language support and AI-powered text processing features like rephrasing and translation. The interface is optimized for touch-first mobile usage with a focus on usability and touch accuracy.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for Replit environment
- **Routing**: Wouter (lightweight React router)
- **State Management**: React Query (@tanstack/react-query) for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Build**: esbuild for production bundling with selective dependency bundling
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **Storage**: Abstract storage interface with in-memory implementation (MemStorage)

### Project Structure
```
client/           # React frontend application
  src/
    components/   # UI components including keyboard implementations
    pages/        # Route pages (Home, NotFound)
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route definitions
  storage.ts      # Data storage abstraction
  vite.ts         # Vite dev server integration
  static.ts       # Static file serving for production
shared/           # Shared types and schemas
  schema.ts       # Drizzle ORM schema definitions
```

### Key Design Decisions

1. **Keyboard Implementation**: Custom virtual keyboard components (RussianKeyboard, AIPromptsKeyboard) with mode switching via KeyboardContainer
2. **Touch Optimization**: Viewport meta tags prevent zooming, touch event handlers prevent accidental zoom gestures
3. **Dual Mode Interface**: Toggle between traditional Russian ЙЦУКЕН keyboard layout and AI prompt buttons
4. **API Placeholder Pattern**: AI endpoints return placeholder responses indicating future implementation

### Database Schema
- Uses Drizzle ORM with PostgreSQL dialect
- Simple users table with id, username, and password fields
- Schema validation via drizzle-zod integration

## External Dependencies

### Database
- **PostgreSQL**: Primary database (requires DATABASE_URL environment variable)
- **Drizzle ORM**: Database toolkit with drizzle-kit for migrations

### UI Libraries
- **Radix UI**: Full suite of accessible UI primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management

### Development Tools
- **Vite**: Development server with HMR
- **@replit/vite-plugin-***: Replit-specific Vite plugins for dev experience
- **tsx**: TypeScript execution for development

### Planned Integrations (Placeholder Endpoints Ready)
- AI text rephrasing service
- AI translation service
- Text snippets library