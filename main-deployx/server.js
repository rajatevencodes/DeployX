// At the very top of your file to load environment variables from a .env file
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
    origin: "*",
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
    "Valkey/Redis URI is not defined. Please set VALKEY_AIVEN_URI in your environment variables."
  );
  process.exit(1); // Exit the app if the database connection string is missing
}
const valkey = new Valkey(process.env.VALKEY_AIVEN_URI);

// Add event listeners for better debugging
valkey.on("connect", () => {
  console.log("✅ Connected to Valkey/Redis successfully!");
});
valkey.on("error", (err) => {
  console.error("❌ Valkey/Redis connection error:", err);
});

// --- Socket.IO Server ---
// Attach Socket.IO to the same HTTP server used by Express
const server = http.createServer(app); // Create an HTTP server using the Express app
const io = new Server(server, {
  cors: {
    origin: "*", // Be cautious with "*" in a production environment
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
          name: "codebase-build-server-img", // ! Ensure this matches your image name in the AWS ECR
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
}

// --- Start the server ---
server.listen(port, () => {
  console.log(
    `🚀 API Server with Socket.IO is running on http://localhost:${port}`
  );
  initValkeySubscriber().catch(console.error);
});
