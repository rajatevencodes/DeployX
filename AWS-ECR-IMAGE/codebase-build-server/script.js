// * Build Process Overview for Vite App :)
//   - User's source code is cloned into /home/app/codebase.
//   - Supports building codebases such as Vite apps.
//   - After building, a 'dist' folder is created and its contents are uploaded to an S3 bucket.

// * Note on child_process:
//   - Node.js's built-in 'child_process' module allows running external programs from within your code, outside the main event loop.
//   - The 'exec' function is used to execute shell commands from Node.js.

import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url"; // Needed to get the directory path
// AWS s3 : https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-s3/
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mime from "mime-types"; // https://www.npmjs.com/package/mime-types

// This is the modern replacement for __dirname in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = process.env.PROJECT_ID;

// Valkey for Logs - with graceful failure handling
import Valkey from "ioredis";

let valkey = null;
let valkeyConnected = false;

// Only create Valkey client if URI is provided
if (process.env.VALKEY_AIVEN_URI) {
  valkey = new Valkey(process.env.VALKEY_AIVEN_URI, {
    retryStrategy: (times) => {
      // Retry up to 10 times for build server (faster timeout)
      if (times > 10) {
        console.log(
          "⚠️ Valkey connection failed after 10 attempts. Continuing without logs."
        );
        return null; // Stop retrying
      }
      const delay = Math.min(times * 500, 5000); // Max 5 seconds between retries
      console.log(
        `🔄 Valkey reconnection attempt ${times}, retrying in ${delay}ms...`
      );
      return delay;
    },
    connectTimeout: 10000, // 10 second connection timeout
    maxRetriesPerRequest: 3,
  });

  valkey.on("connect", () => {
    console.log("✅ Connected to Valkey/Redis successfully!");
    valkeyConnected = true;
  });

  valkey.on("ready", () => {
    console.log("✅ Valkey/Redis is ready!");
    valkeyConnected = true;
  });

  valkey.on("error", (err) => {
    console.error("⚠️ Valkey Connection Error:", err.message);
    valkeyConnected = false;
    // Don't crash - just continue without logs
  });

  valkey.on("close", () => {
    console.log("⚠️ Valkey connection closed.");
    valkeyConnected = false;
  });
} else {
  console.log(
    "⚠️ Valkey URI not provided. Build will continue without real-time logs."
  );
}

// Non-blocking log publishing
async function publishLogs(log) {
  if (!valkey) {
    // No Valkey configured - just skip logging
    return;
  }

  try {
    // Try to publish the log (with short timeout)
    await Promise.race([
      valkey.publish(`deployx:logs:${PROJECT_ID}`, JSON.stringify({ log })),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Publish timeout")), 2000)
      ),
    ]);
  } catch (error) {
    // If it fails, we log to console but DO NOT stop the build process
    // Only log occasionally to avoid spam
    if (Math.random() < 0.1) {
      // Log 10% of failures to reduce noise
      console.error(
        "⚠️ Valkey log publishing failed, continuing build...",
        error.message
      );
    }
  }
}
// ---------------

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function main() {
  console.log(`\n🚀 Kicking off the build process...`);
  // ✨ AWAIT REMOVED ✨
  publishLogs(`🚀 Kicking off the build process for project: ${PROJECT_ID}`);
  const codebasePath = path.join(__dirname, "codebase");

  const status = exec(`cd ${codebasePath} && npm install && npm run build`);

  status.stdout.on("data", function (data) {
    console.log("📄 Build Logs:\n", data.toString());
    publishLogs(`📄 Build Logs: ${data.toString()}`);
  });

  status.stderr.on("data", function (data) {
    console.error("⚠️ Build Warnings:\n", data.toString());
    publishLogs(`⚠️ Build Warnings: ${data.toString()}`);
  });

  status.on("close", async (code) => {
    if (code !== 0) {
      console.error(
        `\n❌ Build failed with exit code ${code}. Deployment aborted.`
      );
      // ✨ AWAIT REMOVED ✨
      publishLogs(
        `❌ Build failed with exit code ${code}. Deployment aborted.`
      );
      process.exit(1); // Stops the container with love :)
    }

    console.log(`\n✅ Build complete!`);
    console.log(`\n☁️ Starting deployment to S3 bucket...`);
    // ✨ AWAIT REMOVED ✨
    publishLogs(`✅ Build complete!`);
    // ✨ AWAIT REMOVED ✨
    publishLogs(`☁️ Starting deployment to S3 bucket...`);

    const distFolderPath = path.join(__dirname, "codebase", "dist");

    try {
      const distFolderContents = fs.readdirSync(distFolderPath, {
        recursive: true,
      });

      console.log("\nPreparing files for parallel upload...");
      // ✨ AWAIT REMOVED ✨
      publishLogs(`Preparing files for parallel upload...`);

      const uploadPromises = [];
      for (const file of distFolderContents) {
        const itemPath = path.join(distFolderPath, file);
        if (fs.lstatSync(itemPath).isDirectory()) {
          continue;
        }

        const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `builds/${PROJECT_ID}/${file.replace(/\\/g, "/")}`,
          Body: fs.createReadStream(itemPath),
          ContentType: mime.lookup(itemPath) || "application/octet-stream",
        };

        console.log(`  └── Queuing: ${file.replace(/\\/g, "/")}`);
        // ✨ AWAIT REMOVED ✨
        publishLogs(`  └── Queuing: ${file.replace(/\\/g, "/")}`);
        uploadPromises.push(s3Client.send(new PutObjectCommand(uploadParams)));
      }

      await Promise.all(uploadPromises);

      console.log(
        `\n🎉 [${PROJECT_ID}] Deployment successful! All files uploaded.`
      );
      // ✨ AWAIT REMOVED ✨
      publishLogs(
        `🎉 [${PROJECT_ID}] Deployment successful! All files uploaded.`
      );
      process.exit(0); // Stops the container with love :)
    } catch (error) {
      console.error(`\n❌ An error occurred during the upload process:`, error);
      // ✨ AWAIT REMOVED ✨
      publishLogs(
        `❌ An error occurred during the upload process: ${error.message}`
      );
      process.exit(1);
    }
  });
}

main();
