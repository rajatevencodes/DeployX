import axios from "axios";
import { env } from "./env.js";

const api = axios.create({
  baseURL: env.apiURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// API functions
export const deployRepository = async (repoUrl, projectName) => {
  const response = await api.post("/deploy", {
    USER_GIT_REPOSITORY_URL: repoUrl,
    PROJECT_ID: projectName,
  });
  return response.data;
};
