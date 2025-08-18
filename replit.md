# Overview

Vision for Africa SACCO is a comprehensive financial management system designed for Savings and Credit Cooperative Organizations (SACCOs). The application provides a complete solution for managing members, loans, savings, and financial transactions in a cooperative financial institution.

The system features a modern web interface built with React and TypeScript, offering dashboards for financial overview, member management, loan tracking, transaction processing, and administrative controls. It's designed to handle the core operations of a SACCO including member registration, savings management, loan disbursement and tracking, and comprehensive financial reporting.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client-side application uses a modern React stack with TypeScript for type safety. The architecture follows a component-based design pattern with clear separation of concerns:

- **UI Framework**: React with TypeScript for type safety and better developer experience
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, accessible UI components
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for robust form handling
- **Charts**: Recharts for financial data visualization

The frontend is organized into logical modules:
- `/pages` - Main application pages (Dashboard, Members, Loans, Reports, Admin)
- `/components` - Reusable UI components organized by purpose (forms, layout, charts, ui)
- `/lib` - Utility functions and configuration
- `/hooks` - Custom React hooks

## Backend Architecture

The server follows a RESTful API design pattern built on Express.js:

- **Runtime**: Node.js with TypeScript for full-stack type safety
- **Framework**: Express.js for HTTP server and API routes
- **API Design**: RESTful endpoints organized by resource (members, loans, transactions)
- **Data Layer**: Storage interface pattern allowing for different implementations

Key architectural decisions:
- **Storage Abstraction**: IStorage interface allows switching between different storage implementations (currently in-memory, designed for database integration)
- **Shared Schema**: Common TypeScript types and Zod schemas shared between client and server
- **Error Handling**: Centralized error handling with consistent HTTP status codes
- **Request Logging**: Comprehensive request/response logging for debugging and monitoring

## Data Storage Solutions

The application uses a flexible storage architecture:

- **Database**: PostgreSQL configured through Drizzle ORM
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment
- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple

Database schema includes:
- Members table with personal information and status tracking
- Loans table with disbursement tracking, interest calculations, and repayment status
- Transactions table for all financial movements (deposits, withdrawals, loan payments)
- Savings table for member savings balance tracking

## Development and Build System

- **Build Tool**: Vite for fast development and optimized production builds
- **Development**: Hot module replacement and development server integration
- **TypeScript**: Strict type checking across the entire codebase
- **Deployment**: Production build creates optimized static assets and server bundle

## Authentication and Authorization

Currently designed for single-user admin access with plans for role-based access control. The session management infrastructure is in place using PostgreSQL-backed sessions.

## External Dependencies

- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm & drizzle-kit**: Type-safe database ORM and migration tool
- **@radix-ui/***: Accessible, unstyled UI primitives for building the component library
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form & @hookform/resolvers**: Form handling with validation
- **zod**: Runtime type validation and schema definition
- **recharts**: Chart library for financial data visualization
- **wouter**: Lightweight client-side routing
- **tailwindcss**: Utility-first CSS framework
- **date-fns**: Date manipulation and formatting
- **connect-pg-simple**: PostgreSQL session store for Express
- **class-variance-authority**: Utility for creating variant-based component APIs