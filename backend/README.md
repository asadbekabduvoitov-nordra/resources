# Resurs Bot Backend

A scalable Telegram bot backend built with Node.js, Express.js, TypeScript, and Supabase.

## Architecture

```
src/
├── config/          # Configuration files (env, supabase)
├── controllers/     # HTTP request handlers
├── services/        # Business logic layer
├── repositories/    # Database operations layer
├── models/          # TypeScript interfaces and types
├── middleware/      # Express middleware
├── routes/          # API route definitions
├── bot/             # Telegram bot logic
│   ├── handlers/    # Command and message handlers
│   ├── keyboards/   # Keyboard markups
│   └── scenes/      # Conversation scenes (for multi-step flows)
└── utils/           # Utility functions (logger, errors, etc.)
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### 3. Set up Supabase database

Run the migration in your Supabase SQL editor:

```sql
-- Copy contents from supabase/migrations/001_create_users_table.sql
```

### 4. Start development server

```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server
- `npm run typecheck` - Type check without emitting

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Bot Commands

- `/start` - Start the bot and register user
- `/help` - Show help message

## Adding New Features

### 1. Create a new model
Add types in `src/models/your-model.model.ts`

### 2. Create a repository
Add database operations in `src/repositories/your-model.repository.ts`

### 3. Create a service
Add business logic in `src/services/your-model.service.ts`

### 4. Create a controller (optional)
Add HTTP handlers in `src/controllers/your-model.controller.ts`

### 5. Create routes (optional)
Add routes in `src/routes/your-model.routes.ts`

### 6. Add bot handlers
Add handlers in `src/bot/handlers/your-handler.ts`

## Production Deployment

1. Build the project: `npm run build`
2. Set `NODE_ENV=production`
3. Set `WEBHOOK_DOMAIN` for Telegram webhook
4. Run: `npm start`
