# Local Development Guide

This guide covers running the GitHub Repositories Viewer locally for development and debugging.

## Prerequisites

- **Node.js 20+** (check with `node --version`)
- **npm** or **yarn**
- **Git**

## Quick Start

### Option 1: Automated Setup (Recommended)

Run the all-in-one development script:

```bash
./dev-start.sh
```

This script will:
- Check and install dependencies
- Start both backend and frontend in a tmux session
- Configure environment if needed

**Tmux Controls:**
- Switch panes: `Ctrl+B` then arrow keys
- Detach: `Ctrl+B` then `D`
- Reattach: `tmux attach -t github-repos`
- Kill session: `tmux kill-session -t github-repos`

### Option 2: Manual Setup (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
./dev.sh
```

**Terminal 2 - Frontend:**
```bash
cd frontend
./dev.sh
```

### Option 3: Step-by-Step Manual Setup

#### Backend Setup

1. **Navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   ```

4. **Generate encryption key:**
   ```bash
   # Generate a secure key
   openssl rand -base64 32
   ```

5. **Edit `.env` file:**
   ```bash
   nano .env  # or vim, code, etc.
   ```

   Update the `ENCRYPTION_KEY`:
   ```env
   PORT=3001
   NODE_ENV=development
   ENCRYPTION_KEY=<paste-your-generated-key-here>
   DATABASE_PATH=./data/app.db
   CORS_ORIGIN=http://localhost:5173
   ```

6. **Create data directory:**
   ```bash
   mkdir -p data
   ```

7. **Start development server:**
   ```bash
   npm run dev
   ```

   Backend will be available at: **http://localhost:3001**

#### Frontend Setup

1. **Navigate to frontend (new terminal):**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend will be available at: **http://localhost:5173**

## Development Workflow

### Accessing the Application

1. Open browser to **http://localhost:5173**
2. Go to Settings page
3. Enter your GitHub Personal Access Token
4. Browse your repositories

### Hot Reload

Both servers support hot reload:
- **Backend**: Uses `tsx watch` - auto-restarts on TypeScript file changes
- **Frontend**: Uses Vite HMR - instant updates on React/TypeScript changes

### API Proxy

The frontend development server is configured to proxy API requests:
- Frontend calls: `http://localhost:5173/api/*`
- Proxied to: `http://localhost:3001/api/*`

See `frontend/vite.config.ts` for proxy configuration.

## Debugging

### Backend Debugging

**Using VS Code:**

1. Create `.vscode/launch.json`:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Debug Backend",
         "type": "node",
         "request": "launch",
         "runtimeExecutable": "npm",
         "runtimeArgs": ["run", "dev"],
         "cwd": "${workspaceFolder}/backend",
         "console": "integratedTerminal",
         "internalConsoleOptions": "neverOpen"
       }
     ]
   }
   ```

2. Set breakpoints in TypeScript files
3. Press F5 to start debugging

**Using Chrome DevTools:**

```bash
cd backend
node --inspect node_modules/.bin/tsx watch src/index.ts
```

Open `chrome://inspect` in Chrome and click "inspect"

**Logging:**

Add debug logs anywhere in backend code:
```typescript
console.log('Debug info:', { variable, data });
console.error('Error occurred:', error);
```

### Frontend Debugging

**Browser DevTools:**
- Press F12 to open DevTools
- Use Console for logs
- Use React DevTools extension for component debugging
- Use Network tab to inspect API calls

**React DevTools:**
Install the browser extension:
- Chrome: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- Firefox: [React Developer Tools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

**Logging:**
```typescript
console.log('Component rendered:', { props, state });
console.error('Error in component:', error);
```

### Database Inspection

The SQLite database is stored at `backend/data/app.db`

**View database contents:**
```bash
# Install sqlite3 if not available
sudo dnf install sqlite

# Open database
sqlite3 backend/data/app.db

# List tables
.tables

# View credentials table
SELECT * FROM credentials;

# Exit
.exit
```

**GUI Tools:**
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- [DBeaver](https://dbeaver.io/)

## Common Tasks

### Reset Database

```bash
rm -f backend/data/app.db
# Restart backend - database will be recreated
```

### Clear All Data

```bash
# Stop servers
# Delete database
rm -f backend/data/app.db

# Clear node_modules and reinstall
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

### Update Dependencies

```bash
# Backend
cd backend
npm update
npm outdated  # Check for updates

# Frontend
cd frontend
npm update
npm outdated
```

### Run Linting

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

### Build for Production

```bash
# Backend
cd backend
npm run build
# Output in backend/dist/

# Frontend
cd frontend
npm run build
# Output in frontend/dist/
```

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Backend server port | `3001` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `ENCRYPTION_KEY` | Encryption key for credentials | - | **Yes** |
| `DATABASE_PATH` | SQLite database path | `./data/app.db` | No |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` | No |

## Troubleshooting

### Port Already in Use

**Backend (3001):**
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

**Frontend (5173):**
```bash
# Find process using port 5173
lsof -i :5173

# Kill process
kill -9 <PID>
```

### Dependencies Issues

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Rebuild TypeScript
cd backend
npm run build

# Check for errors
npx tsc --noEmit
```

### Database Locked Error

```bash
# Stop all backend processes
pkill -f "tsx watch"

# Remove database lock
rm -f backend/data/app.db-shm backend/data/app.db-wal

# Restart backend
```

### CORS Errors

Ensure backend `.env` has correct CORS origin:
```env
CORS_ORIGIN=http://localhost:5173
```

Restart backend after changes.

## Testing API Endpoints

### Using curl

**Check credentials:**
```bash
curl http://localhost:3001/api/credentials
```

**Save credentials:**
```bash
curl -X POST http://localhost:3001/api/credentials \
  -H "Content-Type: application/json" \
  -d '{"token": "ghp_your_token_here"}'
```

**Fetch repositories:**
```bash
curl http://localhost:3001/api/repositories
```

**Health check:**
```bash
curl http://localhost:3001/health
```

### Using httpie (prettier output)

```bash
# Install httpie
sudo dnf install httpie

# Check credentials
http GET localhost:3001/api/credentials

# Save credentials
http POST localhost:3001/api/credentials token="ghp_your_token"

# Fetch repositories
http GET localhost:3001/api/repositories
```

## Project Structure

```
github-repositories-viewer/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── config.ts          # Configuration management
│   │   ├── models/
│   │   │   └── database.ts        # Database models & operations
│   │   ├── routes/
│   │   │   ├── credentials.ts     # Credentials API routes
│   │   │   └── repositories.ts    # Repositories API routes
│   │   ├── services/
│   │   │   ├── encryption.ts      # Encryption/decryption
│   │   │   ├── credentials.ts     # Credentials service
│   │   │   └── github.ts          # GitHub API integration
│   │   └── index.ts               # Express app entry point
│   ├── data/                      # SQLite database location
│   ├── .env                       # Environment variables (not in git)
│   ├── .env.example               # Environment template
│   ├── dev.sh                     # Development startup script
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx         # App layout with nav
│   │   │   └── ThemeToggle.tsx    # Dark mode toggle
│   │   ├── context/
│   │   │   └── ThemeContext.tsx   # Theme state management
│   │   ├── pages/
│   │   │   ├── RepositoriesPage.tsx  # Main repos list
│   │   │   └── SettingsPage.tsx      # Settings/credentials
│   │   ├── services/
│   │   │   └── api.ts             # API client
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript types
│   │   ├── App.tsx                # React app root
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Tailwind imports
│   ├── dev.sh                     # Development startup script
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts             # Vite config with proxy
│
├── dev-start.sh                   # Start both services
├── docker-compose.yml
├── .env                           # Docker environment
└── README.md
```

## Tips for Development

1. **Use separate terminals** for backend and frontend logs
2. **Enable auto-save** in your editor for instant hot reload
3. **Use React DevTools** to inspect component state
4. **Check Network tab** in browser for API call debugging
5. **Keep backend logs visible** to catch API errors
6. **Use TypeScript** - let the type system catch errors
7. **Test with different themes** - toggle between light/dark
8. **Test filters in combination** - ensure all work together

## Next Steps

Once you have the app running locally:

1. Create a GitHub Personal Access Token
2. Test the Settings page
3. Test repository fetching
4. Test all filter combinations
5. Test theme switching
6. Test database persistence (restart backend, check if credentials remain)

Happy developing! 🚀
