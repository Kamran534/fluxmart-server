# Docker Setup for FluxMart Server

This document provides instructions for building and running the FluxMart Server using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (usually comes with Docker Desktop)

## Quick Start

### Using Docker Compose (Recommended)

1. **Build and run the application:**
   ```bash
   npm run docker:compose:up
   ```

2. **View logs:**
   ```bash
   npm run docker:compose:logs
   ```

3. **Stop the application:**
   ```bash
   npm run docker:compose:down
   ```

### Using Docker Commands Directly

1. **Build the Docker image:**
   ```bash
   npm run docker:build
   ```

2. **Run the container:**
   ```bash
   npm run docker:run
   ```

3. **View logs:**
   ```bash
   npm run docker:logs
   ```

4. **Stop the container:**
   ```bash
   npm run docker:stop
   ```

5. **Remove the container:**
   ```bash
   npm run docker:rm
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run docker:build` | Build the Docker image |
| `npm run docker:run` | Run the container |
| `npm run docker:stop` | Stop the running container |
| `npm run docker:rm` | Remove the container |
| `npm run docker:logs` | View container logs |
| `npm run docker:compose:up` | Start with Docker Compose |
| `npm run docker:compose:down` | Stop Docker Compose |
| `npm run docker:compose:logs` | View Docker Compose logs |
| `npm run docker:compose:build` | Build with Docker Compose |

## Configuration

### Environment Variables

The application uses the following environment variables:

- `NODE_ENV`: Set to `production` in the container
- `PORT`: Set to `8000` (can be overridden)

### Ports

- **8000**: Main application port (mapped to host port 8000)

### Health Check

The container includes a health check that verifies the application is responding on the `/health` endpoint.

## Docker Image Details

- **Base Image**: `node:18-alpine` (lightweight Alpine Linux)
- **Working Directory**: `/app`
- **User**: Non-root user (`nodejs`) for security
- **Exposed Port**: 8000

## Troubleshooting

### Container Won't Start

1. Check if port 8000 is already in use:
   ```bash
   netstat -tulpn | grep :8000
   ```

2. View container logs:
   ```bash
   npm run docker:logs
   ```

### Permission Issues

If you encounter permission issues, ensure Docker has proper permissions on your system.

### Build Issues

1. Clear Docker cache:
   ```bash
   docker system prune -a
   ```

2. Rebuild without cache:
   ```bash
   docker build --no-cache -t fluxmart-server .
   ```

## Development vs Production

- **Development**: Use `npm run dev` for local development with hot reload
- **Production**: Use Docker for production deployment

## Security Notes

- The container runs as a non-root user
- Only necessary files are copied to the container
- Sensitive files are excluded via `.dockerignore`
