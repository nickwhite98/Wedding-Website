# Wedding Website

A full-stack wedding website with RSVP management, guest search, and admin controls. Built with React + TypeScript frontend and Express + TypeScript backend, deployed on AWS EC2 with automated CI/CD.

---

## Features

- **Guest RSVP System**: Search by name, select invitation, RSVP for entire party
- **Plus-One Support**: Configurable per invitation
- **Admin Panel**: Manage guests and RSVPs (Konami code access: ↑↑↓↓←→←→BA)
- **Responsive Design**: Material-UI components, mobile-friendly
- **Photo Gallery**: (Planned)
- **Registry Links**: (Planned)

---

## Tech Stack

### Frontend
- React 19 + Vite
- TypeScript (strict mode)
- Material-UI v6
- React Router v7

### Backend
- Express v5
- TypeScript
- Prisma ORM
- SQLite database
- JWT authentication

### Infrastructure
- Docker + Docker Compose
- Nginx (reverse proxy + SSL)
- Let's Encrypt (SSL certificates)
- GitHub Actions (CI/CD)
- AWS EC2 (hosting)

---

## Project Structure

```
wedding/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks (Konami code)
│   │   └── theme.ts        # MUI theme configuration
│   ├── Dockerfile          # Frontend Docker build
│   └── nginx.conf          # Frontend nginx config
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Auth & error handling
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # Database migrations
│   └── Dockerfile          # Backend Docker build
├── nginx/                  # Nginx reverse proxy config
│   ├── nginx.conf          # Main nginx config
│   └── conf.d/             # Site-specific configs
├── scripts/                # Deployment scripts
│   ├── setup-ec2.sh        # Initial EC2 setup
│   ├── ssl-setup.sh        # SSL certificate setup
│   └── backup-db.sh        # Database backup
├── .github/workflows/      # GitHub Actions CI/CD
│   └── deploy.yml          # Deployment workflow
├── docker-compose.yml      # Service orchestration
├── DEPLOYMENT.md           # Detailed deployment guide
├── QUICKSTART.md           # Fast-track deployment
└── claude.md               # Project context for Claude
```

---

## Local Development

### Prerequisites
- Node.js 20+
- npm

### Setup

```bash
# Clone repository
git clone https://github.com/YOUR-USERNAME/wedding.git
cd wedding

# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install

# Setup database
npx prisma generate
npx prisma migrate dev

# Start development servers (in separate terminals)
cd client && npm run dev        # http://localhost:5173
cd server && npm run dev        # http://localhost:3001
```

### Environment Variables

**Backend** (`server/.env`):
```bash
PORT=3001
NODE_ENV=development
JWT_SECRET=dev-secret-key
JWT_EXPIRATION_HRS=24
DATABASE_URL="file:./dev.db"
```

**Frontend** (`client/.env`):
```bash
VITE_API_URL=http://localhost:3001/api
VITE_ADMIN_PASSWORD=your-password
```

---

## Database Management

```bash
cd server

# Create migration after schema changes
npx prisma migrate dev --name migration_name

# View/edit data in GUI
npx prisma studio

# Generate Prisma Client (after schema changes)
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

---

## Deployment

### Quick Start (1 hour)

See [QUICKSTART.md](./QUICKSTART.md) for fast-track deployment.

### Full Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

### Summary

1. Launch AWS EC2 instance (Ubuntu 22.04)
2. Run `scripts/setup-ec2.sh`
3. Configure DNS to point to EC2 IP
4. Setup GitHub Actions secrets
5. Push to `main` branch → auto-deploy
6. Run `scripts/ssl-setup.sh` for HTTPS

---

## CI/CD Pipeline

GitHub Actions automatically:
- Builds frontend and backend
- Runs type checks
- Deploys to EC2 via SSH
- Runs database migrations
- Performs health checks
- Rolls back on failure

**Trigger**: Push to `main` branch

---

## Admin Access

**Konami Code**: Press ↑ ↑ ↓ ↓ ← → ← → B A anywhere on the site

After triggering, enter admin password (set via `VITE_ADMIN_PASSWORD`).

---

## API Endpoints

### Public
- `GET /api/guests/search?name=Smith` - Search guests by name
- `POST /api/rsvp` - Submit RSVP response

### Admin (requires JWT)
- `GET /api/admin/guests` - List all guests
- `GET /api/admin/rsvps` - List all RSVPs
- `POST /api/admin/guests` - Create guest/invitation
- `PUT /api/admin/guests/:id` - Update guest
- `DELETE /api/admin/guests/:id` - Delete guest

---

## Database Schema

### Invitation
- Represents a household/couple receiving one invitation
- Fields: email, address, plusOne flag
- Has many: Guests, RsvpResponses

### Guest
- Individual person within an invitation
- Fields: firstName, lastName, email
- Belongs to: Invitation
- Has one: RsvpResponse

### RsvpResponse
- RSVP answer for a specific guest
- Fields: isAttending, respondedAt
- Belongs to: Invitation, Guest

---

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit: `git commit -m "Add feature"`
4. Push: `git push origin feature/your-feature`
5. Create Pull Request

---

## Monitoring & Maintenance

### Check Service Status
```bash
docker-compose ps
docker-compose logs -f
```

### Database Backup
```bash
bash scripts/backup-db.sh
```

### SSL Renewal
Auto-renews via cron. Manual renewal:
```bash
docker-compose run --rm certbot renew
docker-compose restart nginx
```

---

## Troubleshooting

See [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting) for common issues.

Quick checks:
```bash
# Service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Health checks
curl http://localhost/health
curl http://localhost:3001/api/health

# Database access
docker-compose exec backend npx prisma studio
```

---

## License

Private project for personal use.

---

## Support

For questions or issues, contact [your-email@example.com]

---

**Last Updated**: January 2026
