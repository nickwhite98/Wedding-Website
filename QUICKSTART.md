# Quick Start - Deployment Checklist

Fast-track guide to get your wedding website live on AWS EC2.

---

## 1. AWS Setup (15 minutes)

```bash
# Launch EC2 instance:
# - Ubuntu 22.04 LTS
# - t3.small or t3.medium
# - Security Group: ports 22, 80, 443 open
# - Download and save .pem key file

# Connect to EC2
ssh -i your-key.pem ubuntu@<EC2-IP>

# Run setup script
curl -o setup.sh https://raw.githubusercontent.com/YOUR-USERNAME/wedding/main/scripts/setup-ec2.sh
chmod +x setup.sh
sudo bash setup.sh

# Log out and back in
exit
ssh -i your-key.pem ubuntu@<EC2-IP>
```

---

## 2. Environment Configuration (5 minutes)

```bash
# On EC2
cd /var/www/wedding
cp .env.production.template .env.production
vim .env.production
```

Fill in:
```bash
DOMAIN_NAME=your-domain.com
SSL_EMAIL=your-email@example.com
JWT_SECRET=$(openssl rand -base64 32)  # Generate secure secret
VITE_API_URL=https://your-domain.com/api
VITE_ADMIN_PASSWORD=your-secure-password
```

---

## 3. DNS Setup (5 minutes + propagation time)

**Namecheap**:
1. Advanced DNS → Add A Record
2. Host: `@` → Value: `<EC2-IP>`
3. Host: `www` → Value: `<EC2-IP>`
4. Wait 5-60 minutes for propagation

**Test DNS**:
```bash
nslookup your-domain.com
```

---

## 4. GitHub Actions Setup (10 minutes)

### Generate SSH Key for GitHub Actions

```bash
# On EC2
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github-actions -N ""
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github-actions  # Copy this to GitHub
```

### Add GitHub Secrets

Repository → Settings → Secrets → New secret

| Secret | Value |
|--------|-------|
| `EC2_HOST` | Your EC2 public IP |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Private key from above |
| `JWT_SECRET` | Same as in .env.production |
| `VITE_API_URL` | `https://your-domain.com/api` |
| `VITE_ADMIN_PASSWORD` | Same as in .env.production |

---

## 5. First Deployment (5 minutes)

```bash
# On your local machine
git add .
git commit -m "Initial deployment setup"
git push origin main
```

Watch deployment: GitHub → Actions tab

---

## 6. SSL Setup (5 minutes)

**After DNS propagates and first deployment succeeds**:

```bash
# On EC2
cd /var/www/wedding/current
bash scripts/ssl-setup.sh your-domain.com your-email@example.com
```

---

## 7. Verify Everything Works

```bash
# Check services
docker-compose ps

# Test endpoints
curl https://your-domain.com/health
curl https://your-domain.com/api/health

# Visit your site
open https://your-domain.com
```

---

## Total Time: ~1 hour

(Including DNS propagation wait time)

---

## Troubleshooting

### Services won't start
```bash
docker-compose logs -f
```

### SSL fails
```bash
# Make sure DNS is propagated first
nslookup your-domain.com

# Try manual SSL setup
docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/html --email your-email@example.com --agree-tos -d your-domain.com
```

### GitHub Actions fails
```bash
# Check EC2 logs
cd /var/www/wedding/current
docker-compose logs -f

# Verify SSH key works
ssh -i ~/.ssh/github-actions ubuntu@<EC2-IP>
```

---

## Next Steps

- [ ] Test RSVP functionality
- [ ] Test admin panel (Konami code: ↑↑↓↓←→←→BA)
- [ ] Setup database backups: `crontab -e` → `0 2 * * * /var/www/wedding/current/scripts/backup-db.sh`
- [ ] Monitor logs: `docker-compose logs -f`

---

For detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md)
