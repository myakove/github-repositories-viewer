# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development (Non-Docker)

**Quick start (automated with tmux):**
```bash
./dev-start.sh
```

**Manual start (two terminals):**
```bash
# Terminal 1 - Backend
cd backend && ./dev.sh

# Terminal 2 - Frontend
cd frontend && ./dev.sh
```

**Backend commands:**
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Development server with hot reload (tsx watch)
npm run build        # Build TypeScript to dist/
npm start            # Run production build
npm run lint         # Run ESLint
```

**Frontend commands:**
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Development server with Vite HMR
npm run build        # Production build (TypeScript + Vite)
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Docker Deployment

**Build and start:**
```bash
docker compose up --build
```

**Rebuild specific service:**
```bash
docker compose up <service-name> --build
# Example: docker compose up backend --build
```

**Note:** The repository's `docker-compose.yml` is an example configuration using standard ports (3001/3000). Users may have their own compose files with custom port mappings.

## Architecture Overview

### Data Flow

1. **Credentials Storage Flow:**
   - User enters GitHub PAT in frontend Settings page
   - Frontend POSTs to `/api/credentials`
   - Backend encrypts token with AES-256-GCM (PBKDF2 key derivation)
   - Encrypted token stored in SQLite database
   - Token never exposed to frontend after initial save

2. **Repository Fetching Flow:**
   - Frontend requests `/api/repositories` (optional `?refresh=true`)
   - Backend checks 5-minute cache first (see `cache.ts`)
   - If cache miss or refresh requested:
     - Retrieves and decrypts stored GitHub PAT
     - Calls GitHub GraphQL API (NOT REST API)
     - Fetches all repos in paginated batches (100 per request)
     - Caches result for 5 minutes
   - Returns repository data to frontend

3. **Frontend Filtering Flow:**
   - Repositories fetched once from backend
   - All filtering happens client-side in `RepositoriesPage.tsx`
   - Fuzzy search powered by Fuse.js (weighted keys: name, full_name, description)
   - Owner filter uses `full_name.startsWith()` pattern matching

### Critical Architecture Decisions

**Why GraphQL instead of REST API:**
- REST API has severe rate limits (5,000 requests/hour)
- Fetching metadata (releases, PRs, issues) for 100+ repos would exhaust quota
- GraphQL allows fetching ALL data in 1-2 requests with custom queries
- See `backend/src/services/github.ts` for GraphQL query structure

**Why Client-Side Filtering:**
- Repository list is static once fetched
- Avoids backend round-trips for every filter/search change
- Fuzzy search requires full dataset for proper relevance scoring
- Better UX with instant filtering

**Why SQLite:**
- Local-only deployment, no need for external database
- Encrypted credentials are sensitive and should stay on user's machine
- Simple single-file database in `backend/data/app.db`

**Encryption Architecture:**
- Algorithm: AES-256-GCM with authentication tags
- Key derivation: PBKDF2 (100,000 iterations, SHA-512)
- Random salt (64 bytes) and IV (16 bytes) per encryption
- Format: `salt:iv:tag:encrypted` (base64 encoded)
- See `backend/src/services/encryption.ts`

### TypeScript Patterns

**Backend Route Handlers:**
- All async route handlers MUST return `Promise<void>`
- Use `res.json(); return;` pattern (NOT `return res.json()`)
- Prefix unused params with underscore: `_req`, `_next`

```typescript
// Correct pattern
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  res.json({ data });
  return;
});
```

**Frontend API Calls:**
- All API calls use `fetchWithTimeout` wrapper (30s default, 120s for repos)
- Base URL from `import.meta.env.VITE_API_BASE_URL` (NOT `process.env`)
- See `frontend/src/services/api.ts`

**Environment Variables:**
- Backend: Uses `dotenv` with `process.env`
- Frontend: Uses Vite with `import.meta.env.VITE_*`
- Frontend envs MUST be prefixed with `VITE_` to be exposed

### Fuzzy Search Implementation

Located in `frontend/src/pages/RepositoriesPage.tsx`:

```typescript
const fuse = new Fuse(filtered, {
  keys: [
    { name: 'name', weight: 2 },           // Repo name most important
    { name: 'full_name', weight: 1.5 },    // Full name (owner/repo)
    { name: 'description', weight: 1 },    // Description
    { name: 'owner.login', weight: 0.5 },  // Owner least important
  ],
  threshold: 0.4,        // 0.0 = exact, 1.0 = match anything
  ignoreLocation: true,  // Search entire string
  minMatchCharLength: 2,
});
```

### Owner Filter Logic

**IMPORTANT:** The owner filter is NOT about collaborator access. It filters by ownership pattern:

```typescript
// Correct: Only show repos where owner/repo matches pattern
if (selectedOrg && !repo.full_name.startsWith(`${selectedOrg}/`)) {
  return false;
}

// Wrong: Shows all repos where user has access (collaborators, forks, etc.)
if (selectedOrg && repo.owner.login !== selectedOrg) {
  return false;
}
```

### Cache Service

In-memory cache with automatic cleanup:
- Default TTL: 5 minutes
- Max entries: 100
- Auto-cleanup every 5 minutes (removes expired + enforces size limit)
- Used for GitHub API responses to avoid rate limits
- See `backend/src/services/cache.ts`

## Docker Build Architecture

**Multi-Stage Builds (both frontend and backend):**

Stage 1 (Builder):
- Install ALL dependencies (including devDependencies)
- Compile TypeScript to JavaScript
- Build artifacts (frontend: static files, backend: dist/ folder)

Stage 2 (Production):
- Install ONLY production dependencies
- Copy build artifacts from builder stage
- Minimal image size

**Frontend specifics:**
- Build arg `VITE_API_BASE_URL` passed at build time
- Served with `serve` package (NOT nginx for local-only deployment)
- Exposed on port 80 inside container

**Backend specifics:**
- Runs compiled JavaScript from dist/ (NOT tsx)
- Healthcheck on `/health` endpoint
- Exposed on port 3001 inside container

## CORS Configuration

Backend CORS origin MUST match frontend URL:
- Development: `CORS_ORIGIN=http://localhost:5173`
- Docker: Match frontend external port (e.g., `http://localhost:3000`)
- Set via environment variable in docker-compose.yml

Browser connects from host machine → needs exposed backend port.
Docker internal networking only works container-to-container (NOT browser-to-container).

## Port Mapping

Format: `external:internal`
- `3002:3001` means: access via `localhost:3002`, container listens on 3001
- Backend internal port is always 3001
- Frontend internal port is always 80
- External ports can be customized per deployment

## Database Schema

SQLite database in `backend/data/app.db`:

```sql
CREATE TABLE credentials (
  id INTEGER PRIMARY KEY,
  encrypted_token TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Only one credential row exists (managed by credentials service).
