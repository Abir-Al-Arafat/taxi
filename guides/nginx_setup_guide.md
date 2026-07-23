# Nginx Reverse Proxy Setup & Domain Mapping Guide

This guide details how to map your subdomains (`api.taxily.app` and `dashboard.domain.app`) to your EC2 instance using Nginx and secure them with free SSL certificates via Let's Encrypt (Certbot).

---

## Prerequisites

1. An EC2 instance running Ubuntu with a **Public Elastic IP**.
2. DNS **A Records** configured in Namecheap pointing to your Elastic IP:
   - Host `api` -> `YOUR_EC2_ELASTIC_IP`
   - Host `dashboard` -> `YOUR_EC2_ELASTIC_IP`
3. Your backend running locally on port `5000` (e.g., via Docker or PM2).
4. Your dashboard running locally on port `3000` (or another port of your choice).

---

## Step 1: Install Nginx

Log into your EC2 server via SSH and run:

```bash
# Update local package lists
sudo apt update

# Install Nginx
sudo apt install nginx -y

# Verify Nginx is active and running
sudo systemctl status nginx
```

---

## Step 2: Configure Security Group / Firewall

Ensure port **80 (HTTP)** and port **443 (HTTPS)** are open in your AWS EC2 Security Group:

1. Go to **AWS Console** -> **EC2** -> **Instances** -> Select your instance.
2. Click on the **Security** tab and click your **Security Group**.
3. Click **Edit inbound rules** and ensure the following exist:
   - **HTTP:** Type `HTTP` | Port `80` | Source `0.0.0.0/0`
   - **HTTPS:** Type `HTTPS` | Port `443` | Source `0.0.0.0/0`
   - **SSH:** Type `SSH` | Port `22` | Source `Anywhere` or `My IP`

---

## Step 3: Create Nginx Server Block Profiles

Create a dedicated Nginx configuration file for your domain subdomains:

```bash
sudo nano /etc/nginx/sites-available/taxily
```

Paste the following configuration into the editor:

```nginx
# ----------------------------------------------------
# 1. Backend API Configuration (api.domain.app)
# ----------------------------------------------------
server {
    listen 80;
    server_name api.taxily.app;

    location / {
        proxy_pass http://127.0.0.1:5000; # Points to your Node.js backend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ----------------------------------------------------
# 2. Frontend Dashboard Configuration (dashboard.taxily.app)
# ----------------------------------------------------
server {
    listen 80;
    server_name dashboard.taxily.app;

    location / {
        proxy_pass http://127.0.0.1:3000; # Points to your dashboard frontend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

_Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit._

---

## Step 4: Enable Configuration & Test Nginx

Enable the site by linking it to the `sites-enabled` directory and disable the default Nginx placeholder:

```bash
# Link configuration file to sites-enabled
sudo ln -s /etc/nginx/sites-available/taxily /etc/nginx/sites-enabled/

# Remove default Nginx site configuration
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx syntax for errors
sudo nginx -t

# Reload Nginx to apply changes
sudo systemctl reload nginx
```

---

## Step 5: Install Certbot & Enable SSL (HTTPS)

Once DNS propagation completes for `api.taxily.app` and `dashboard.taxily.app`, install Certbot to secure your traffic with free SSL certificates:

```bash
# Install Certbot and Nginx plugin
sudo apt install certbot python3-certbot-nginx -y

# Obtain and automatically install SSL certificates for both subdomains
sudo certbot --nginx -d api.taxily.app -d dashboard.taxily.app
```

Follow the on-screen prompts:

1. Enter your email address for renewal notifications.
2. Agree to the Terms of Service.
3. Certbot will automatically issue certificates, modify your Nginx file, and set up HTTP to HTTPS redirection.

---

## Step 6: Verify Automatic SSL Renewal

Certbot sets up a daily system timer to renew certificates before expiration automatically. Test the renewal process with:

```bash
sudo certbot renew --dry-run
```
