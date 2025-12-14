The Sweet Shop Management System is a full-stack web application for managing sweets, inventory, and users. The frontend is built with Next.js and React and provides a simple, responsive interface for viewing, searching, and purchasing sweets.

The backend is built using Express and TypeScript and provides a secure REST API for handling application logic, user authentication, and inventory management. JWT-based authentication and role-based access control ensure that only authorized users can manage and restock sweets.

PostgreSQL with Prisma ORM is used for storing data, offering type-safe access, schema management, and database migrations. The project follows Test-Driven Development (TDD) and uses AI tools responsibly, with all AI usage clearly documented in commits and project documentation.
Frontend (Next.js)
Location: /frontend/

Technology: Next.js 15 + React 19 + TypeScript
Features: Shopping cart, authentication, search/filter, admin panel
Port: 3000
Access: http://localhost:3000
Backend (Express.js)
Location: /backend/

Technology: Express.js + TypeScript + Prisma
Features: RESTful API, JWT auth, file upload, CRUD operations
Port: 3001
Access: http://localhost:3001
Database (Prisma + SQLite)
Location: /database/

Technology: Prisma ORM + SQLite
Features: Complete schema, sample data, migrations
Access: Prisma Studio on port 5555
Monorepo Structure
Root: / with workspace configuration

Scripts: Coordinated development and building
Dependencies: Shared workspace management


# One-command setup for everything
./setup.sh

# Or manual setup:
npm run install:all    # Install all dependencies
npm run db:setup       # Setup database
npm run dev            # Start frontend + backend

# Individual components:
cd frontend && npm run dev    # Frontend only
cd backend  && npm run dev    # Backend only
cd database && npm run studio  # Database browser

Access Points:
Frontend: http://localhost:3000
Backend API: http://localhost:3001
Health Check: http://localhost:3001/health
Database Studio: http://localhost:5555
Default Accounts:
Admin: admin@sweetshop.com / admin123
User: user@sweetshop.com / user123
Complete Documentation:
Main README: Comprehensive setup and architecture guide
Frontend README: React app details and components
Backend README: API endpoints and security features
Database README: Schema and data management


Architecture Benefits:
Scalability: Each component can be scaled independently
Team Development: Frontend and backend teams can work separately
Technology Flexibility: Easy to swap or upgrade individual components
Deployment Options: Deploy each component to different platforms
Testing Isolation: Unit tests for each component separately
Code Organization: Clear separation of concerns
