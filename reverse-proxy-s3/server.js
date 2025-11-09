const express = require("express");
const httpProxy = require("http-proxy");

const app = express();
const PORT = process.env.REVERSE_PROXY_PORT || 80; // On Production this should be 80 or 443 - Nginx

// Environment-based configuration for production deployment
BUCKET_NAME = process.env.S3_BUCKET_NAME || "deployx-bucket";
BUCKET_REGION = process.env.AWS_REGION || "ap-south-1";
BUCKET_URL = `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/builds`;

const proxy = httpProxy.createProxy();

// --- Main Proxy Logic ---
app.use((req, res) => {
  // Extract the subdomain from the request's hostname.
  // For example, in `project1.rajat-deployx.com`, the subdomain is `project1`.
  const hostname = req.hostname;
  const subdomain = hostname.split(".")[0];

  // Construct the final S3 URL to which we will forward the request.
  // This points to the specific project's folder in the S3 bucket.
  // Example: https://deployx-bucket.s3.ap-south-1.amazonaws.com/builds/project1
  const targetUrl = `${BUCKET_URL}/${subdomain}`; // index.html will be appended later.

  // Forward the request to the constructed S3 URL.
  proxy.web(req, res, {
    target: targetUrl, // Forward the request to this Bucket URL for CSS targetUrl/index.html or targetUrl/assets/xx.js
    // Crucial for S3. It looks like client is directly accessing the S3 bucket.
    changeOrigin: true,
  });
});

// --- Proxy Event Handlers ---

// This event listener triggers just BEFORE a request is sent to the target (S3).
proxy.on("proxyReq", (proxyReq, req, res) => {
  // If the user requests the root path ('/'), we append 'index.html'.
  // This ensures that 'project1.example.com' correctly serves the main HTML file.
  if (req.url === "/") {
    proxyReq.path += "index.html";
  }
});

// This event listener handles errors from the proxy server itself.
// This is the correct way to catch errors like the target S3 bucket being unreachable.
proxy.on("error", (err, req, res) => {
  console.error("Proxy Error:", err);
  res
    .status(502)
    .send("Bad Gateway: Could not connect to the upstream server.");
});

app.listen(PORT, () =>
  console.log(`✅ Reverse Proxy Server running on http://localhost:${PORT}`)
);
