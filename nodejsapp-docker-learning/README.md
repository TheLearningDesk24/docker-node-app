# Node.js Docker Learning Store

A beginner-friendly Node.js HTTP API that returns fictional e-commerce products. Use it to practice the application lifecycle, Dockerfiles, single-stage and multi-stage builds, and Docker Compose.

## 1. Project files: what each file means

```text
nodejs-docker-learning/
├── src/
│   └── server.js              # Application entry point: creates and starts HTTP server
├── test/
│   └── app.test.js            # Example automated test using Node's built-in test runner
├── package.json               # Project metadata and npm scripts
├── Dockerfile                 # Single-stage image recipe (default)
├── Dockerfile.multistage      # Multi-stage learning example
├── compose.yaml               # Container runtime configuration
├── .dockerignore              # Files Docker should omit from the build context
├── .gitignore                 # Files Git should not commit
└── README.md                  # This guide
```

### `package.json`

This is the Node.js project's manifest. It names the project, sets its version, describes the entry point, declares scripts, and can list third-party dependencies.

- `main` documents the main application file for tools; our `start` script explicitly runs `src/server.js`.
- `scripts.start` is what `npm start` runs.
- `scripts.dev` uses Node's watch mode to restart the process when files change.
- `scripts.test` runs Node's built-in test runner.
- This starter has **no third-party dependencies**, so it does not need `npm install` or a `package-lock.json` yet.

### `src/server.js`

This is the application entry point. It uses Node's built-in `http` module to listen on port 3000 and return JSON for these routes:

- `GET /` — welcome message
- `GET /health` — health status and runtime details
- `GET /api/products` — all sample products
- `GET /api/products/1` — one product by ID

The sample product data lives in memory. It resets when the process/container restarts; it is not a real database.

### `Dockerfile`

A Dockerfile is a set of instructions used to build an image. The default Dockerfile is single-stage.

### `Dockerfile.multistage`

Shows named build stages and `COPY --from=build`. This demonstrates the pattern, but the app is plain JavaScript with no compilation step. For this exact project, multi-stage does not automatically make the result smaller or faster.

### `compose.yaml`

Defines how to build and run the app container: image name, port mapping, environment variables, restart policy, and health check. Compose can manage one service or many services.

### `.dockerignore` and `.gitignore`

- `.dockerignore` keeps irrelevant files out of the Docker build context.
- `.gitignore` tells Git which local files not to track.

## 2. How Node.js starts and becomes a running application

This starter uses ordinary JavaScript. Node.js does **not** compile it into a standalone executable by default.

```text
You run `npm start`
        |
        v
npm reads `package.json`
        |
        v
npm executes `node src/server.js`
        |
        v
Node.js loads and executes server.js
        |
        v
The HTTP server binds to 0.0.0.0:3000
        |
        v
It waits for requests and runs the matching route handler
        |
        v
It sends JSON responses to clients
```

At runtime, the Node.js runtime (including its JavaScript engine) parses and executes the JavaScript. The engine may internally compile JavaScript to bytecode/machine code as it runs, but you don't need a separate compilation command for this project.

### What happens inside Docker?

```text
Dockerfile + source files
        |
        | docker build (or Compose build)
        v
Docker image (packaged filesystem + metadata)
        |
        | docker run / docker compose up
        v
Container created from the image
        |
        v
CMD starts: node src/server.js
        |
        v
Node.js process listens on port 3000
```

An image is a template; a container is an instance created from it. `EXPOSE 3000` documents the container port, while `ports: ["3000:3000"]` publishes host port 3000 to container port 3000.

## 3. Run locally without Docker

Requirement: install Node.js 22 or newer.

```bash
node --version
npm --version
npm start
```

Open these URLs in a browser or use curl:

```bash
curl http://localhost:3000/
curl http://localhost:3000/health
curl http://localhost:3000/api/products
curl http://localhost:3000/api/products/1
```

Stop the server with `Ctrl+C`.

Run the sample test:

```bash
npm test
```

## 4. Single-stage Dockerfile: instruction-by-instruction

The default `Dockerfile` is a single-stage build:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY src/ ./src/
ENV NODE_ENV=production
ENV PORT=3000
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
```

- `FROM node:22-alpine`: starts from the official Node.js 22 Alpine Linux image. Docker downloads it if it is not available locally.
- `WORKDIR /app`: sets the working directory for subsequent instructions.
- `COPY package*.json ./`: copies package metadata first. This can preserve Docker layer cache when source files change. It is not strictly needed for this dependency-free app, but it teaches a common pattern.
- `COPY src/ ./src/`: copies the application source into the image.
- `ENV`: sets default environment variables.
- `USER node`: runs the application as a non-root user.
- `EXPOSE 3000`: documents the port used by the application.
- `CMD`: defines the default process that starts when a container runs.

Build and run it:

```bash
docker build -t nodejs-learning:single .
docker run --rm --name nodejs-learning -p 3000:3000 nodejs-learning:single
```

Test it in a second terminal:

```bash
curl http://localhost:3000/health
```

## 5. Single-stage: advantages and disadvantages

**Advantages**

- Easy to read, write, and debug.
- Fewer concepts to learn.
- Good for small apps and apps without a compilation step.
- All required files are in one stage.

**Disadvantages**

- Build-time tools and files can end up in the final image if you install/copy them in that stage.
- The final image may be larger than a carefully designed multi-stage image.
- It is easier to accidentally include development dependencies or unnecessary files.

These disadvantages are not automatic. A well-designed single-stage image can still be small and secure.

## 6. Multi-stage Dockerfile: how it works

Docker supports multiple `FROM` instructions. Each can create a separate stage, and the final stage becomes the default output image. `COPY --from=build` selectively copies files from a previous stage.

Build this example:

```bash
docker build -f Dockerfile.multistage -t nodejs-learning:multi .
docker run --rm --name nodejs-learning-multi -p 3000:3000 nodejs-learning:multi
```

**Important:** This app is plain JavaScript and has no compile/build step or third-party dependencies. The multi-stage file is for learning the mechanism; it is not expected to provide a major size improvement here.

A multi-stage build becomes more useful for TypeScript or frontend/server applications that generate a `dist/` directory, or when you need compilers/build tools during the build but not at runtime.

### Multi-stage advantages

- Can keep build tools and development dependencies out of the final image.
- Can reduce image size by copying only required runtime output.
- Separates build and runtime concerns.
- Helps produce a cleaner production image.

### Multi-stage disadvantages

- More complex Dockerfile and debugging.
- You must copy every runtime file the app needs.
- Can add little or no benefit when no build step exists.
- Image size and security still depend on the chosen base image, dependencies, and copied files.

## 7. Docker Compose

The included `compose.yaml` uses the single-stage Dockerfile:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: nodejs-docker-learning:single
    container_name: nodejs-learning-app
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: "3000"
    ports:
      - "3000:3000"
```

Compose creates a default network automatically. Since this project has only one service and does not persist application data, it does not need a custom network or volume.

Start the app:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Check the endpoints:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/products
```

Stop it:

```bash
docker compose down
```

To use the multi-stage Dockerfile, change `dockerfile: Dockerfile` to `dockerfile: Dockerfile.multistage` and change the image tag if desired, then run `docker compose up -d --build`.

## 8. Common Docker commands

```bash
# Build the single-stage image
docker build -t nodejs-learning:single .

# Build the multi-stage example
docker build -f Dockerfile.multistage -t nodejs-learning:multi .

# List images
docker images

# List running containers
docker ps

# View logs
docker logs nodejs-learning-app

# Remove a stopped container (if not managed by Compose)
docker rm nodejs-learning

# Stop and remove Compose-managed container/network
docker compose down
```

## 9. Try these learning exercises

1. Change a product name or price in `src/server.js`, rebuild the image, and observe the result.
2. Change `PORT` in Compose to `3001` but remember to update the published port mapping as needed.
3. Add a new route such as `/api/categories`.
4. Add a dependency later and learn why `package-lock.json` and `npm ci` matter.
5. Convert the app to TypeScript so a multi-stage build has a real compilation step.
6. Add a MySQL service to Compose and move products into a database.

## 10. Before pushing to Git

```bash
git init
git add .
git commit -m "Add Node.js Docker learning project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your repository. Do not commit `.env` or secrets.

## Learning summary

- **Node.js** is the runtime that executes JavaScript outside a browser.
- **`src/server.js`** is the entry point for this app.
- **`package.json`** describes the project and its npm scripts.
- **Dockerfile** builds an image.
- **Single-stage** is simpler; **multi-stage** can keep build-only files out of the final image.
- **Compose** configures and runs one or multiple containers together.
