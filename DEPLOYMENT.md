# Wedding Website - Deployment Guide

Complete guide for deploying the wedding website to AWS EC2 with CI/CD via GitHub Actions.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [AWS EC2 Setup](#aws-ec2-setup)
4. [Server Configuration](#server-configuration)
5. [Domain & DNS Setup](#domain--dns-setup)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [GitHub Actions CI/CD](#github-actions-cicd)
8. [Manual Deployment](#manual-deployment)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Infrastructure
- **Single EC2 Instance** (t3.small or t3.medium recommended)
- **Docker Compose** orchestration
- **Nginx** reverse proxy with SSL termination
- **SQLite** database (persisted in Docker volume)
- **Let's Encrypt** SSL certificates
- **GitHub Actions** for automated deployments

### Services
```
Internet → Nginx (80/443) → Frontend Container (React/Vite)
                          → Backend Container (Express API) → SQLite DB
```

### CI/CD Flow
```
Push to main → GitHub Actions → Build & Test → SSH to EC2 → Deploy with Docker → Health Check
```

---

## Prerequisites

### Local Requirements
- GitHub account with repository access
- AWS account
- Domain name (Namecheap or any registrar)
- SSH client (Terminal on Mac/Linux, PuTTY on Windows)

### Knowledge Prerequisites
- Basic Linux command line
- Basic Docker concepts
- Git basics

---

## AWS EC2 Setup

### 1. Launch EC2 Instance

1. **Go to AWS Console** → EC2 → Launch Instance

2. **Choose AMI**: Ubuntu Server 22.04 LTS

3. **Instance Type**:
   - Development/Testing: `t3.small` (2 vCPU, 2GB RAM)
   - Production: `t3.medium` (2 vCPU, 4GB RAM)

4. **Key Pair**:
   - Create new key pair or use existing
   - **IMPORTANT**: Download `.pem` file and save securely
   - Mac/Linux: `chmod 400 your-key.pem`

5. **Network Settings**:
   - Enable "Auto-assign public IP"
   - Create/select security group with these rules:
     ```
     SSH (22)    - Your IP (or 0.0.0.0/0 if dynamic IP)
     HTTP (80)   - 0.0.0.0/0
     HTTPS (443) - 0.0.0.0/0
     ```

6. **Storage**:
   - 20-30 GB gp3 (sufficient for wedding site + Docker images)

7. **Launch Instance**

### 2. Connect to Instance

```bash
# Mac/Linux
ssh -i /path/to/your-key.pem ubuntu@<EC2-PUBLIC-IP>

# Windows (using PuTTY)
# Convert .pem to .ppk using PuTTYgen first
```

### 3. Note Your Public IP

```bash
curl http://checkip.amazonaws.com
```

**Save this IP** - you'll need it for DNS configuration.

---

## Server Configuration

### 1. Run Initial Setup Script

```bash
# Download setup script
curl -o setup-ec2.sh https://raw.githubusercontent.com/YOUR-USERNAME/wedding/main/scripts/setup-ec2.sh

# Make executable
chmod +x setup-ec2.sh

# Run as root
sudo bash setup-ec2.sh
```

This script installs:
- Docker & Docker Compose
- Node.js
- Essential utilities
- Firewall configuration
- Log rotation

### 2. Log Out and Back In

```bash
exit
# SSH back in to activate docker group
ssh -i /path/to/your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### 3. Verify Docker Installation

```bash
docker --version
docker-compose --version
docker ps  # Should work without sudo
```

### 4. Setup Application Directory

```bash
cd /var/www/wedding
cp .env.production.template .env.production
vim .env.production
```

### 5. Configure Environment Variables

Edit `.env.production`:

```bash
# Generate secure JWT secret
openssl rand -base64 32

# Fill in:
DOMAIN_NAME=your-domain.com
SSL_EMAIL=your-email@example.com
JWT_SECRET=<generated-secret>
VITE_API_URL=https://your-domain.com/api
VITE_ADMIN_PASSWORD=<choose-secure-password>
```

---

## Domain & DNS Setup

### Namecheap Configuration

1. **Login to Namecheap** → Domain List → Manage

2. **Advanced DNS** → Add/Edit Records:

   ```
   Type    Host    Value                   TTL
   A       @       <EC2-PUBLIC-IP>         Automatic
   A       www     <EC2-PUBLIC-IP>         Automatic
   ```

3. **Wait for Propagation** (5-60 minutes)

   ```bash
   # Check DNS propagation
   nslookup your-domain.com
   dig your-domain.com
   ```

### AWS Route 53 (Alternative)

If using Route 53 instead:

1. Create hosted zone for your domain
2. Create A record pointing to EC2 public IP
3. Update nameservers in Namecheap to Route 53 nameservers

---

## SSL Certificate Setup

### Automatic Setup (Recommended)

Once DNS is pointing to your EC2:

```bash
cd /var/www/wedding/current
bash scripts/ssl-setup.sh your-domain.com your-email@example.com
```

This will:
1. Start services with HTTP-only config
2. Obtain Let's Encrypt certificate
3. Enable HTTPS configuration
4. Setup auto-renewal cron job

### Manual Setup

If automatic fails:

```bash
cd /var/www/wedding/current

# Start services
docker-compose up -d

# Get certificate
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/html \
  --email your-email@example.com \
  --agree-tos \
  -d your-domain.com

# Update nginx config with your domain
sed -i "s/\${DOMAIN_NAME}/your-domain.com/g" nginx/conf.d/default.conf

# Restart nginx
docker-compose restart nginx
```

### Verify SSL

```bash
# Should redirect HTTP to HTTPS
curl -I http://your-domain.com

# Check certificate
curl -I https://your-domain.com
```

---

## GitHub Actions CI/CD

### 1. Setup GitHub Secrets

Go to **GitHub Repository** → Settings → Secrets and Variables → Actions

Add these secrets:

| Secret Name | Value | How to Get |
|------------|-------|------------|
| `EC2_HOST` | EC2 public IP | AWS Console or `curl checkip.amazonaws.com` on EC2 |
| `EC2_USER` | `ubuntu` | Default for Ubuntu AMI |
| `EC2_SSH_KEY` | Private key content | See below |
| `JWT_SECRET` | JWT secret | `openssl rand -base64 32` |
| `VITE_API_URL` | `https://your-domain.com/api` | Your domain |
| `VITE_ADMIN_PASSWORD` | Admin password | Choose secure password |

### 2. Generate GitHub Actions SSH Key

On your **EC2 instance**:

```bash
# Generate new key pair for GitHub Actions
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github-actions -N ""

# Add public key to authorized_keys
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# Display private key (copy this to GitHub Secret)
cat ~/.ssh/github-actions
```

**Copy the entire private key** (including `-----BEGIN` and `-----END` lines) to GitHub Secret `EC2_SSH_KEY`.

### 3. Test SSH Connection

On your **local machine**:

```bash
# Save the private key temporarily
echo "$EC2_SSH_KEY_CONTENT" > /tmp/test-key
chmod 600 /tmp/test-key

# Test connection
ssh -i /tmp/test-key ubuntu@<EC2-IP> "echo 'SSH works!'"

# Clean up
rm /tmp/test-key
```

### 4. Trigger Deployment

```bash
# Commit and push to main branch
git add .
git commit -m "Initial deployment setup"
git push origin main
```

GitHub Actions will automatically:
1. Build frontend and backend
2. Run type checks
3. Deploy to EC2
4. Run health checks
5. Rollback if deployment fails

### 5. Monitor Deployment

- **GitHub**: Actions tab → Watch workflow progress
- **EC2**: `docker-compose logs -f` to see live logs

---

## Manual Deployment

If you need to deploy manually (without GitHub Actions):

### Initial Deployment

```bash
# On EC2
cd /var/www/wedding

# Clone repository
git clone https://github.com/YOUR-USERNAME/wedding.git current
cd current

# Copy environment file
cp /var/www/wedding/.env.production .env

# Build and start
docker-compose build
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

### Update Deployment

```bash
cd /var/www/wedding/current

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

---

## Monitoring & Maintenance

### Check Service Status

```bash
# All services
docker-compose ps

# Logs (all services)
docker-compose logs -f

# Logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Resource usage
docker stats
```

### Database Backup

```bash
# Manual backup
bash scripts/backup-db.sh

# Setup automated backups (daily at 2 AM)
sudo crontab -e
# Add this line:
0 2 * * * /var/www/wedding/current/scripts/backup-db.sh
```

### Disk Space

```bash
# Check disk usage
df -h

# Clean old Docker images
docker image prune -af

# Clean old backups (keeps 30 days)
find /var/backups/wedding -name "*.db.gz" -mtime +30 -delete
```

### SSL Certificate Renewal

Certificates auto-renew via cron job. To manually renew:

```bash
cd /var/www/wedding/current
docker-compose run --rm certbot renew
docker-compose restart nginx
```

### Update Dependencies

```bash
# Pull latest code
cd /var/www/wedding/current
git pull

# Rebuild with latest dependencies
docker-compose build --no-cache
docker-compose up -d
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Common issues:
# 1. Port already in use
sudo lsof -i :3001  # Backend
sudo lsof -i :80    # Frontend/Nginx

# 2. Environment variables missing
docker-compose config  # Validates docker-compose.yml

# 3. Database migration failed
docker-compose exec backend npx prisma migrate deploy
```

### SSL Certificate Issues

```bash
# Check certificate status
docker-compose run --rm certbot certificates

# Test nginx config
docker-compose exec nginx nginx -t

# Force renewal
docker-compose run --rm certbot renew --force-renewal
docker-compose restart nginx
```

### Database Issues

```bash
# Access database
docker-compose exec backend sh
cd /app/data
sqlite3 prod.db

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### GitHub Actions Deployment Fails

```bash
# SSH into EC2 and check:
cd /var/www/wedding

# Check if deployment file arrived
ls -la /tmp/deployment.tar.gz

# Check docker-compose status
cd current
docker-compose ps

# Manual health check
curl http://localhost/health
curl https://your-domain.com/health
```

### High Memory Usage

```bash
# Check container memory
docker stats

# Restart services
docker-compose restart

# If needed, increase EC2 instance size
# AWS Console → EC2 → Instance → Actions → Instance Settings → Change Instance Type
```

### Cannot Access Website

1. **Check DNS**: `nslookup your-domain.com`
2. **Check Security Group**: AWS Console → EC2 → Security Groups → Verify ports 80/443
3. **Check nginx**: `docker-compose logs nginx`
4. **Check firewall**: `sudo ufw status`
5. **Check SSL**: `curl -I https://your-domain.com`

---

## Post-Deployment Checklist

- [ ] Website accessible via HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] API endpoints working (`/api/health`)
- [ ] RSVP functionality tested
- [ ] Admin panel accessible (Konami code)
- [ ] Database backups configured
- [ ] SSL auto-renewal setup
- [ ] GitHub Actions deploying successfully
- [ ] Monitoring/logging in place

---

## Costs Estimate (Monthly)

- **EC2 t3.small**: ~$15/month
- **EC2 t3.medium**: ~$30/month
- **Storage (30GB)**: ~$3/month
- **Data Transfer**: ~$1-5/month (low traffic)
- **Total**: ~$20-40/month

---

## Security Best Practices

1. **Keep Ubuntu Updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Review Security Groups**: Only open necessary ports

3. **Use Strong Passwords**: For admin panel and JWT secret

4. **Enable CloudWatch**: For monitoring and alerts (optional)

5. **Regular Backups**: Database backup cron job

6. **SSH Key Management**: Use separate keys for GitHub Actions

---

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Docker logs: `docker-compose logs -f`
3. Check GitHub Actions workflow logs
4. Review AWS CloudWatch logs (if enabled)

---

**Last Updated**: January 2026
