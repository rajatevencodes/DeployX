require("dotenv").config();

const express = require("express");
const http = require("http"); // Import the native http module
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { Server } = require("socket.io");
const Valkey = require("ioredis");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 4571;

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // Change FRONTEND_URL in .env for production
    credentials: true,
  })
);

// --- AWS ECS Client ---
const ecsClient = new ECSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const ARN_Config = {
  CLUSTER: process.env.ECS_CLUSTER_NAME,
  TASK_DEFINITION: process.env.ECS_TASK_DEFINITION,
};

// --- Valkey (Redis) Client ---
// Check if the connection URI is provided before creating the client
if (!process.env.VALKEY_AIVEN_URI) {
  console.error(
    "⚠️ Valkey/Redis URI is not defined. Real-time logs will not be available."
  );
}

let valkey = null;
let valkeyConnected = false;

// Only create Valkey client if URI is provided
if (process.env.VALKEY_AIVEN_URI) {
  valkey = new Valkey(process.env.VALKEY_AIVEN_URI, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 1000, 30000); // Max 30 seconds between retries
      console.log(`🔄 Valkey reconnection attempt ${times}, retrying in ${delay}ms...`);
      return delay;
    },
    maxRetriesPerRequest: null, // Keep retrying indefinitely
  });

  // Add event listeners for better debugging
  valkey.on("connect", () => {
    console.log("✅ Connected to Valkey/Redis successfully!");
    valkeyConnected = true;
  });

  valkey.on("ready", () => {
    console.log("✅ Valkey/Redis is ready!");
    valkeyConnected = true;
  });

  valkey.on("error", (err) => {
    console.error("❌ Valkey/Redis connection error:", err.message);
    valkeyConnected = false;
    // Don't exit - just log the error
  });

  valkey.on("close", () => {
    console.log("⚠️ Valkey/Redis connection closed. Will retry...");
    valkeyConnected = false;
  });
}

// --- Socket.IO Server ---
// Attach Socket.IO to the same HTTP server used by Express
const server = http.createServer(app); // Create an HTTP server using the Express app
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*", // Change FRONTEND_URL in .env for production
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on("joinRoom", (projectId) => {
    // projectId - deployx:logs:rajathero
    socket.join(projectId);
    console.log(`Socket ${socket.id} joined room: ${projectId}`);
    socket.emit("roomJoined", `Successfully joined room ${projectId}`);
  });
});

// --- API Routes ---
app.get("/", (req, res) => {
  res.send("Server is working :)");
});

app.post("/deploy", async (req, res) => {
  const { PROJECT_ID, USER_GIT_REPOSITORY_URL } = req.body;

  if (!PROJECT_ID || !USER_GIT_REPOSITORY_URL) {
    return res
      .status(400)
      .json({ error: "PROJECT_ID and USER_GIT_REPOSITORY_URL are required." });
  }

  const command = new RunTaskCommand({
    cluster: ARN_Config.CLUSTER,
    taskDefinition: ARN_Config.TASK_DEFINITION,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: [
          process.env.ECS_CLUSTER_SUBNETS_1,
          process.env.ECS_CLUSTER_SUBNETS_2,
          process.env.ECS_CLUSTER_SUBNETS_3,
        ],
        securityGroups: [process.env.ECS_CLUSTER_SECURITY_GROUP],
        assignPublicIp: "ENABLED",
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: process.env.ECS_CONTAINER_NAME || "codebase-build-server-img", // ! Ensure this matches your image name in the AWS ECR
          environment: [
            { name: "PROJECT_ID", value: PROJECT_ID },
            { name: "USER_GIT_REPOSITORY_URL", value: USER_GIT_REPOSITORY_URL },
            { name: "S3_BUCKET_NAME", value: process.env.S3_BUCKET_NAME },
            { name: "AWS_REGION", value: process.env.AWS_REGION },
            { name: "AWS_ACCESS_KEY_ID", value: process.env.AWS_ACCESS_KEY_ID },
            {
              name: "AWS_SECRET_ACCESS_KEY",
              value: process.env.AWS_SECRET_ACCESS_KEY,
            },
            { name: "VALKEY_AIVEN_URI", value: process.env.VALKEY_AIVEN_URI },
          ],
        },
      ],
    },
  });

  try {
    const data = await ecsClient.send(command);
    console.log("✅ Task started successfully:", data.tasks[0].taskArn);
    res.status(200).json({
      message: "Deployment started successfully",
      projectId: PROJECT_ID,
      taskArn: data.tasks[0].taskArn,
    });
  } catch (error) {
    console.error("❌ Error starting ECS task:", error);
    res.status(500).json({ error: "Failed to start deployment task." });
  }
});

// --- Valkey (Redis) Subscriber Logic ---
async function initValkeySubscriber() {
  if (!valkey) {
    console.log("⚠️ Valkey not configured. Real-time logs will not be available.");
    return;
  }

  try {
    console.log("📡 Subscribing to log channel pattern 'deployx:logs:*'");
    // Subscribe to the pattern 'deployx:logs:*' to receive messages for all projects
    await valkey.psubscribe("deployx:logs:*");

    valkey.on("pmessage", (pattern, channel, message) => {
      console.log(`Received message from [${channel}]`);

      // E.g., from 'deployx:logs:project-123' we get 'project-123'.
      const projectId = channel.split(":")[2];

      if (projectId) {
        // Emit the message to the correct Socket.IO room using the extracted projectId.
        // Use a clear event name like "log" instead of "message:".
        io.to(projectId).emit("log", message);
        console.log(`=> Log for project ${projectId}: ${message}`);
      }
    });
  } catch (error) {
    console.error("⚠️ Failed to subscribe to Valkey channels:", error.message);
    console.log("🔄 Will retry when connection is established...");
    // Retry after a delay
    setTimeout(initValkeySubscriber, 5000);
  }
}

// --- Start the server ---
server.listen(port, () => {
  console.log(
    `🚀 API Server with Socket.IO is running on http://localhost:${port}`
  );
  
  // Initialize Valkey subscriber (non-blocking)
  if (valkey) {
    initValkeySubscriber().catch((error) => {
      console.error("⚠️ Failed to initialize Valkey subscriber:", error.message);
      console.log("🔄 Server will continue running. Real-time logs may be delayed.");
    });
  } else {
    console.log("⚠️ Valkey not configured. Deployments will work but logs won't be real-time.");
  }
});
