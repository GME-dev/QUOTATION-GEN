FROM node:18-slim

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Korean and Thai)
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Create necessary directories
RUN mkdir -p public/static/images

# Install dependencies
RUN npm install

# Copy public directory first
COPY public ./public

# Copy the rest of the application
COPY . .

# Build the React app
RUN npm run build

# Expose the port
EXPOSE 8080

# Start the server
CMD ["npm", "start"] 