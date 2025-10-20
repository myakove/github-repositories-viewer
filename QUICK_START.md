# Quick Start Guide

## 🐳 Docker (Production/Easy Setup)

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env and set ENCRYPTION_KEY

# 2. Start containers
docker-compose up --build

# 3. Access app
open http://localhost:3000
```

---

## 💻 Local Development (Debugging)

### Automatic (Recommended)

```bash
./dev-start.sh
```

Uses tmux to run both services in split terminal.

### Manual (Two Terminals)

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

### First Time Setup

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set ENCRYPTION_KEY (generate with: openssl rand -base64 32)
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📝 Generate Encryption Key

```bash
openssl rand -base64 32
```

---

## 🔗 URLs

- **Frontend (Docker):** http://localhost:3000
- **Frontend (Local):** http://localhost:5173
- **Backend:** http://localhost:3001
- **Backend Health:** http://localhost:3001/health

---

## 🎫 GitHub Token Setup

1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select `repo` scope
4. Copy token
5. Paste in Settings page of app

---

## 📚 Documentation

- **Full README:** [README.md](README.md)
- **Development Guide:** [DEVELOPMENT.md](DEVELOPMENT.md)

---

## 🛠️ Common Commands

```bash
# Reset database
rm -f backend/data/app.db

# View database
sqlite3 backend/data/app.db

# Check backend logs (Docker)
docker-compose logs backend

# Rebuild containers
docker-compose up --build

# Stop containers
docker-compose down

# Kill port (if stuck)
lsof -i :3001  # backend
lsof -i :5173  # frontend
```

---

## ⚡ Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | `lsof -i :3001` then `kill -9 <PID>` |
| Docker Hub down | Use local development instead |
| Dependencies error | `rm -rf node_modules && npm install` |
| Database locked | Stop backend, delete `*.db-shm` and `*.db-wal` |
| CORS error | Check backend `.env` has `CORS_ORIGIN=http://localhost:5173` |

---

## 🎯 Quick Test Checklist

- [ ] Backend starts on port 3001
- [ ] Frontend starts on port 5173 or 3000
- [ ] Can access Settings page
- [ ] Can save GitHub token
- [ ] Can view repositories
- [ ] Filters work (public/private/forks/search)
- [ ] Theme toggle works
- [ ] Links open in new tab
