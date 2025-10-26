# TravelBlogr Production Dockerfile
# Optimized for Railway deployment with Puppeteer/Crawlee support

FROM node:20-slim

# Install Chromium and dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_BIN=/usr/bin/chromium

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Install dependencies at root level
RUN npm install --legacy-peer-deps

# Install dependencies in apps/web (where the build happens)
WORKDIR /app/apps/web
RUN npm install --legacy-peer-deps
WORKDIR /app

# Copy application code
COPY . .

# Accept build arguments from Railway
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ARG GROQ_API_KEY
ARG SUPABASE_SERVICE_ROLE_KEY

# Convert build args to environment variables for the build process
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV GROQ_API_KEY=$GROQ_API_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Build the Next.js application
WORKDIR /app/apps/web

# Debug: Show environment variables (without exposing secrets)
RUN echo "Building with NEXT_PUBLIC_SITE_URL: $NEXT_PUBLIC_SITE_URL"

# Run the build with explicit error handling
RUN npm run build || (echo "Build failed! Checking for common issues..." && \
    echo "Node version:" && node --version && \
    echo "NPM version:" && npm --version && \
    echo "Package.json exists:" && ls -la package.json && \
    echo "Next.js installed:" && npm list next && \
    exit 1)

# Expose port (Railway will set PORT env var)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

