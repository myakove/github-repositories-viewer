# GitHub Repositories Viewer

A web application to view and filter your GitHub repositories with support for light/dark themes and secure credential storage.

## Features

- **Repository Listing**: View all your GitHub repositories in one place
- **Advanced Filtering**: Filter by public/private, forks, and repository name
- **Rich Metadata**: See stars, watches, forks, and latest release version
- **Secure Credentials**: Encrypted storage of GitHub Personal Access Token
- **Theme Support**: Toggle between light and dark modes
- **Containerized**: Easy deployment with Docker

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Fuse.js (fuzzy search)
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (encrypted credentials)
- **Deployment**: Docker + Docker Compose

## Prerequisites

- Docker and Docker Compose
- GitHub Personal Access Token (PAT) with `repo` scope

## Getting Started

### Quick Start with Docker (Recommended)

1. **Clone the repository**:
```bash
git clone <repository-url>
cd github-repositories-viewer
```

2. **Set up environment variables** (optional but recommended):
```bash
cp .env.example .env
# Edit .env and set a secure ENCRYPTION_KEY
# You can generate one with: openssl rand -base64 32
```

3. **Build and start the containers**:
```bash
docker-compose up --build
```

4. **Access the application**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`

5. **Configure your GitHub token**:
   - Go to Settings page
   - Enter your GitHub Personal Access Token
   - Click "Save Token"

### Local Development (Without Docker)

For development and debugging, you can run the application locally without Docker.

**Quick Start:**

```bash
# Option 1: Automated (uses tmux for split terminal)
./dev-start.sh

# Option 2: Manual (two separate terminals)
# Terminal 1:
cd backend && ./dev.sh

# Terminal 2:
cd frontend && ./dev.sh
```

**Manual Setup:**

1. **Backend** (Terminal 1):
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env and set ENCRYPTION_KEY
   npm run dev
   # Runs on http://localhost:3001
   ```

2. **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm install
   npm run dev
   # Runs on http://localhost:5173
   ```


## Usage

1. **Configure Credentials**: Navigate to Settings page and enter your GitHub PAT
2. **View Repositories**: Return to the main page to see your repositories
3. **Filter Results**: Use the filter controls to narrow down repositories
4. **Theme Toggle**: Click the theme toggle button to switch between light/dark modes

## API Endpoints

- `POST /api/credentials` - Store encrypted GitHub PAT
- `GET /api/credentials` - Check if credentials exist
- `DELETE /api/credentials` - Delete stored credentials
- `GET /api/repositories` - Fetch repositories with metadata

## How to Create a GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "GitHub Repos Viewer")
4. Select the **`repo`** scope (Full control of private repositories)
5. Click "Generate token"
6. Copy the token immediately (you won't be able to see it again!)
7. Paste it in the Settings page of this application

## Security

- GitHub PATs are encrypted using AES-256-GCM before storage
- Tokens are never exposed to the frontend after saving
- Set a strong `ENCRYPTION_KEY` environment variable in production

## Configuration

The application is configured via docker-compose.yml:

- **Backend Port**: Default `3001:3001` - change to expose backend on a different port
- **Frontend Port**: Default `3000:80` - change to expose frontend on a different port
- **API URL**: Update `VITE_API_BASE_URL` build arg if you change the backend port
- **CORS**: Update `CORS_ORIGIN` to match your frontend URL

## Production Build

```bash
docker-compose up --build -d
```

## License

MIT
