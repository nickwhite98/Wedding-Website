#!/bin/bash

# SSL Certificate Setup Script
# Run this AFTER DNS is pointing to your EC2 instance
# Usage: bash ssl-setup.sh your-domain.com your-email@example.com

set -e

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <domain-name> <email>"
    echo "Example: $0 wedding.example.com admin@example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=$2

echo "=========================================="
echo "SSL Certificate Setup for $DOMAIN"
echo "=========================================="

cd /var/www/wedding/current

# Step 1: Start services without SSL first
echo "Step 1: Starting services with HTTP-only configuration..."
docker-compose down

# Temporarily use HTTP-only nginx config
if [ -f nginx/conf.d/default.conf ]; then
    mv nginx/conf.d/default.conf nginx/conf.d/default.conf.ssl
fi

cat > nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location /api {
        proxy_pass http://wedding-backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://wedding-frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

docker-compose up -d nginx

echo "Waiting for nginx to start..."
sleep 5

# Step 2: Obtain SSL certificate
echo "Step 2: Obtaining SSL certificate from Let's Encrypt..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/html \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Step 3: Restore SSL nginx config
echo "Step 3: Enabling SSL configuration..."
if [ -f nginx/conf.d/default.conf.ssl ]; then
    rm nginx/conf.d/default.conf
    mv nginx/conf.d/default.conf.ssl nginx/conf.d/default.conf
fi

# Replace domain placeholder in nginx config
sed -i "s/\${DOMAIN_NAME}/$DOMAIN/g" nginx/conf.d/default.conf

# Step 4: Restart nginx with SSL
echo "Step 4: Restarting nginx with SSL..."
docker-compose restart nginx

# Step 5: Setup auto-renewal
echo "Step 5: Setting up certificate auto-renewal..."
cat > /etc/cron.d/certbot-renew << EOF
0 3 * * * root cd /var/www/wedding/current && docker-compose run --rm certbot renew --quiet && docker-compose restart nginx
EOF

echo ""
echo "=========================================="
echo "✅ SSL Setup Complete!"
echo "=========================================="
echo ""
echo "Your site should now be accessible at:"
echo "  https://$DOMAIN"
echo ""
echo "Certificate will auto-renew daily at 3 AM"
echo "=========================================="
