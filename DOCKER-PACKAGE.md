# Docker Package Guide

This guide explains how to use the FluxMart Server Docker image from GitHub Container Registry.

## 🐳 GitHub Container Registry

The Docker image is automatically built and published to GitHub Container Registry (ghcr.io) on every push to main branch and when creating releases.

### Image Location
```
ghcr.io/kamran534/fluxmart-server:latest
```

## 📦 Available Tags

- `latest` - Latest stable version (main branch)
- `v1.0.0` - Specific version tags
- `main` - Latest from main branch
- `develop` - Latest from develop branch

## 🚀 Quick Start

### Pull and Run the Image

```bash
# Pull the latest image
docker pull ghcr.io/kamran534/fluxmart-server:latest

# Run the container
docker run -p 8000:8000 --name fluxmart-server ghcr.io/kamran534/fluxmart-server:latest
```

### Using Docker Compose

```yaml
version: '3.8'
services:
  fluxmart-server:
    image: ghcr.io/kamran534/fluxmart-server:latest
    container_name: fluxmart-server
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - PORT=8000
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

## 🔧 Local Development

### Build and Push Locally

```bash
# Build the image
npm run docker:build

# Tag for GitHub Container Registry
npm run docker:tag

# Push to GitHub Container Registry (requires login)
npm run docker:push

# Or do both in one command
npm run docker:publish
```

### Version-specific Publishing

```bash
# Tag with current package.json version
npm run docker:tag:version

# Push versioned image
npm run docker:push:version

# Or do both
npm run docker:publish:version
```

## 🔐 Authentication

To push images to GitHub Container Registry, you need to authenticate:

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

Or use GitHub CLI:
```bash
gh auth token | docker login ghcr.io -u USERNAME --password-stdin
```

## 🌐 Accessing the Application

Once running, the application will be available at:

- **Main Server**: http://localhost:8000
- **GraphQL Endpoint**: http://localhost:8000/graphql
- **API Documentation**: http://localhost:8000/api-docs
- **Health Check**: http://localhost:8000/health

## 📋 Environment Variables

The container supports the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `8000` | Server port |

## 🔄 Automated Builds

The Docker image is automatically built and pushed when:

1. **Push to main branch** → Creates `latest` and `main` tags
2. **Push to develop branch** → Creates `develop` tag
3. **Create a release tag** → Creates version-specific tags (e.g., `v1.0.0`)

## 🏷️ Release Process

To create a new release:

1. Update version in `package.json`
2. Create a git tag: `git tag v1.0.0`
3. Push the tag: `git push origin v1.0.0`
4. GitHub Actions will automatically build and push the image

## 📊 Image Details

- **Base Image**: `node:18-alpine`
- **Architecture**: Multi-platform (linux/amd64, linux/arm64)
- **Size**: ~150MB (optimized with multi-stage build)
- **Security**: Runs as non-root user
- **Health Check**: Built-in health monitoring

## 🛠️ Troubleshooting

### Permission Denied
If you get permission errors when pushing:
```bash
# Make sure you're logged in
docker login ghcr.io

# Check your GitHub token has package write permissions
```

### Image Not Found
If the image isn't found:
```bash
# Make sure you're using the correct repository name
docker pull ghcr.io/kamran534/fluxmart-server:latest
```

### Build Failures
Check the GitHub Actions logs in your repository's Actions tab for detailed build information.

## 📚 Additional Resources

- [GitHub Container Registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Multi-stage Builds](https://docs.docker.com/develop/dev-best-practices/dockerfile_best-practices/#use-multi-stage-builds)
- [GitHub Actions for Docker](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
