#!/bin/bash

# EC2 Initial Setup Script
# Run this script on your EC2 instance after first launch
# Usage: sudo bash setup-ec2.sh

set -e

echo "=========================================="
echo "Wedding Website - EC2 Setup Script"
echo "=========================================="

# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Docker
echo "Installing Docker..."
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Install Docker Compose standalone (v2)
DOCKER_COMPOSE_VERSION="v2.24.5"
curl -SL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Create application directory
echo "Creating application directory..."
mkdir -p /var/www/wedding
chown ubuntu:ubuntu /var/www/wedding

# Install essential tools
echo "Installing essential tools..."
apt-get install -y \
    git \
    vim \
    htop \
    curl \
    wget \
    unzip \
    ufw

# Configure firewall
echo "Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Install Node.js (for debugging if needed)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Create .env.production template
echo "Creating environment template..."
cat > /var/www/wedding/.env.production.template << 'EOF'
# Production Environment Variables
# Copy this to .env.production and fill in real values

# Domain
DOMAIN_NAME=your-domain.com
SSL_EMAIL=your-email@example.com

# Backend
JWT_SECRET=generate-a-secure-random-string-here
JWT_EXPIRATION_HRS=24

# Database (SQLite in Docker volume)
DATABASE_URL=file:/app/data/prod.db

# Frontend (build-time variables)
VITE_API_URL=https://your-domain.com/api
VITE_ADMIN_PASSWORD=your-secure-admin-password
EOF

chown ubuntu:ubuntu /var/www/wedding/.env.production.template

# Create log directory
mkdir -p /var/log/wedding
chown ubuntu:ubuntu /var/log/wedding

# Setup log rotation
cat > /etc/logrotate.d/wedding << 'EOF'
/var/log/wedding/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 ubuntu ubuntu
    sharedscripts
}
EOF

# Display completion message
echo ""
echo "=========================================="
echo "✅ EC2 Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Log out and log back in for docker group to take effect"
echo "2. Create .env.production from template:"
echo "   cd /var/www/wedding"
echo "   cp .env.production.template .env.production"
echo "   vim .env.production  # Fill in real values"
echo ""
echo "3. Generate a secure JWT secret:"
echo "   openssl rand -base64 32"
echo ""
echo "4. Setup SSH key for GitHub Actions:"
echo "   ssh-keygen -t rsa -b 4096 -C 'github-actions'"
echo "   cat ~/.ssh/id_rsa.pub  # Add to EC2 authorized_keys"
echo "   cat ~/.ssh/id_rsa      # Add to GitHub Secrets as EC2_SSH_KEY"
echo ""
echo "5. Point your domain DNS to this EC2 IP:"
echo "   Public IP: $(curl -s http://checkip.amazonaws.com)"
echo ""
echo "=========================================="
