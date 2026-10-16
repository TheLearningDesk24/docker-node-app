# SINGLE-STAGE: the same image contains the runtime and application source.
# Good for learning and small applications; simple, but not as minimal as a
# carefully designed multi-stage image.
FROM node:22-alpine

WORKDIR /app

# Copy package metadata first. If it does not change, Docker can reuse this layer.
COPY package*.json ./

# This beginner app uses only Node.js built-in modules, so there are no
# third-party dependencies to install. If dependencies are added later, use:
# RUN npm ci --omit=dev

COPY src/ ./src/

ENV NODE_ENV=production
ENV PORT=3000

# Run as the non-root "node" user provided by the official Node image.
USER node

EXPOSE 3000

CMD ["node", "src/server.js"]
