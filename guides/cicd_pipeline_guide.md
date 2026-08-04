# CI/CD Pipeline Implementation & Debugging Guide

This document serves as the canonical reference for the automated Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Taxily backend service. It details the architecture, configurations, and troubleshooting steps for the automated deployment to the AWS EC2 instance.

---

## 1. Architecture Overview

The deployment pipeline is built using **GitHub Actions** and **Docker**. It ensures that every code push to the main branch is verified, built, and seamlessly deployed to the production environment without manual intervention.

*   **Source Control:** GitHub (`main` branch)
*   **CI/CD Runner:** GitHub Actions (`ubuntu-latest` environment)
*   **Target Server:** AWS EC2 Instance (Ubuntu)
*   **Containerization:** Docker & Docker Compose
*   **Application Stack:** Node.js (v18), TypeScript, Express

### Workflow Sequence
1. A developer pushes code to the `main` branch.
2. GitHub Actions checks out the code, installs Node.js 18, and runs `npm run build` to verify that the TypeScript compiles successfully.
3. If the build passes, the Action establishes a secure SSH connection to the EC2 instance.
4. On the EC2 instance, the pipeline pulls the latest code, stops the running container, rebuilds the image using the updated local Dockerfile, and starts the container in detached mode.

---

## 2. Prerequisites & GitHub Secrets

For the pipeline to authenticate with the EC2 instance, the following **Repository Secrets** must be configured in GitHub (`Settings > Secrets and variables > Actions`):

| Secret Name | Description | Example |
| :--- | :--- | :--- |
| `EC2_HOST` | The public IP or DNS of the EC2 instance. | `18.158.173.169` |
| `EC2_USERNAME` | The SSH user for the server. | `ubuntu` |
| `EC2_SSH_KEY` | The raw contents of the `.pem` private key file. | *(See formatting note below)* |

**⚠️ Critical Note on SSH Key Formatting:**
The `EC2_SSH_KEY` must contain the full, multi-line key including the header and footer boundaries. If pasted as a single line, authentication will fail.

```text
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(key contents on multiple lines)
-----END RSA PRIVATE KEY-----
```

---

## 3. Core Configurations

### The Deployment Workflow (`.github/workflows/deploy.yml`)
This file dictates the CI/CD steps.

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main

jobs:
  build:
    name: Build and Verify
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18" # Aligned with Dockerfile alpine version

      - name: Install Dependencies
        run: npm ci

      - name: Build TypeScript
        run: npm run build

  deploy:
    name: Deploy to AWS EC2
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Execute Remote SSH Commands
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USERNAME }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            # 1. Navigate to the exact directory containing the compose file
            cd ~/taxily/taxi 

            # 2. Pull the latest code
            git pull origin main

            # 3. Stop containers, force a fresh build of the local Dockerfile, and restart
            docker compose down
            docker compose up -d --build

            # 4. Clean up dangling images to preserve disk space
            docker image prune -f
```

### Docker Compose Setup (`docker-compose.yml`)
To ensure Docker Compose actually compiles the newest TypeScript changes instead of reusing a cached image, the `build: .` context is strictly required.

```yaml
services:
  api:
    image: abirwerks/taxi-backend:latest
    build: . # Crucial: forces Docker to read the local Dockerfile on --build
    container_name: taxi-backend
    ports:
      - "5000:5000"
    env_file:
      - .env
    restart: unless-stopped
```

---

## 4. Debugging & Troubleshooting

### Issue 1: GitHub Action Fails at SSH Step
**Error Message:** `ssh.ParsePrivateKey: ssh: no key found` OR `handshake failed: ssh: unable to authenticate`
*   **Cause:** The GitHub Runner cannot read the `.pem` file from the `EC2_SSH_KEY` secret.
*   **Solution:** 
    1. Verify the secret is under **Repository Secrets** (not Environment Secrets).
    2. Edit the secret, clear the field, and paste the `.pem` contents ensuring the `-----BEGIN...` and `-----END...` tags are included with no leading/trailing empty spaces.

### Issue 2: Code Pushed, Pipeline Passed, but Old Response in Browser
**Error Message:** Changes to files like `app.ts` do not reflect via the public API URL.
*   **Cause A (Missing Build Flag):** The `docker-compose.yml` is missing `build: .`. Without it, `docker compose up --build` ignores the local code and just spins up the existing `abirwerks/taxi-backend:latest` image.
*   **Cause B (Wrong Directory):** The `cd` command in the Action script is pointing to the wrong folder (e.g., `cd ~/taxily` instead of `cd ~/taxily/taxi`). The action executes successfully, but Docker doesn't see the new files.
*   **Manual Fix:** SSH into the server and rebuild manually:
    ```bash
    cd ~/taxily/taxi
    docker build -t abirwerks/taxi-backend:latest .
    docker compose down
    docker compose up -d
    ```

### Issue 3: Container Starts but Crashes Immediately
*   **Cause:** Environment variables missing, incorrect Node version, or bad build outputs.
*   **Solution:** Check the container logs directly on the EC2 instance.
    ```bash
    # View recent logs
    docker logs taxi-backend
    
    # Follow live logs
    docker logs -f taxi-backend
    ```

### Issue 4: "node: command not found" on EC2
*   **Cause:** Running `node -v` directly in the EC2 Ubuntu terminal.
*   **Solution:** The host OS does not need Node.js. The application runs isolated inside the Docker container. To run Node commands, execute them *inside* the container:
    ```bash
    docker exec -it taxi-backend node -v
    ```

---

## 5. Security & Environment Variables
Do not track `.env` files in source control. Environment variables must remain securely on the EC2 instance.
*   The `.env` file should be manually created and updated at `~/taxily/taxi/.env`.
*   Docker Compose automatically injects these into the `taxi-backend` container via the `env_file: - .env` directive.
