const http = require("node:http");
const os = require("node:os");

const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";

const products = [
  { id: 1, name: "Wireless Mouse", category: "Electronics", price: 799, currency: "INR" },
  { id: 2, name: "Cotton T-Shirt", category: "Clothing", price: 499, currency: "INR" },
  { id: 3, name: "Insulated Water Bottle", category: "Home & Kitchen", price: 699, currency: "INR" }
];

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(body, null, 2));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/") {
    return sendJson(res, 200, {
      message: "Welcome to the Node.js Docker Learning Store",
      next_steps: [
        "GET /health to check application health",
        "GET /api/products to view sample products",
        "Read README.md to learn how this app starts and how Docker packages it"
      ]
    });
  }

  if (req.method === "GET" && url.pathname === "/health") {
    return sendJson(res, 200, {
      status: "ok",
      app: "nodejs-docker-learning",
      node_version: process.version,
      hostname: os.hostname()
    });
  }

  if (req.method === "GET" && url.pathname === "/api/products") {
    return sendJson(res, 200, { count: products.length, products });
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/products/")) {
    const id = Number(url.pathname.split("/").pop());
    const product = products.find((item) => item.id === id);
    if (!product) {
      return sendJson(res, 404, { error: "Product not found" });
    }
    return sendJson(res, 200, product);
  }

  return sendJson(res, 404, {
    error: "Route not found",
    available_routes: ["GET /", "GET /health", "GET /api/products", "GET /api/products/:id"]
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Store API listening on http://${HOST}:${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received; closing HTTP server...`);
  server.close((error) => {
    if (error) {
      console.error("Error while closing server:", error);
      process.exit(1);
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
