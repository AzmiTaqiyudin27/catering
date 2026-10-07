# Multi-stage Docker build for Catering Management System
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production
COPY backend/ ./

# Generate Prisma Client
RUN npx prisma generate

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "src/index.js"]
