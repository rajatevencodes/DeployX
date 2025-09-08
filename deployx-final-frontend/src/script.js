import JSConfetti from "js-confetti";
import { deployRepository } from "./main-server-api.js";
import { listenToLogs } from "./socket.js";
import { env } from "./env.js";
import {
  validateURL,
  validateProjectName,
  updateValidationUI,
  fillTestCredentials,
} from "./utils.js";

document.addEventListener("DOMContentLoaded", function () {
  const loader = document.getElementById("loader");
  const websiteUrlInput = document.getElementById("urlInput");
  const projectNameInput = document.getElementById("projectNameInput");
  const validateUrlButton = document.getElementById("validateBtn");
  const testCredentialsButton = document.getElementById("testCredentialsBtn");
  const logsContainer = document.getElementById("logsContainer");
  const logsContent = document.getElementById("logsContent");
  const urlDisplay = document.getElementById("urlDisplay");
  const deployedUrl = document.getElementById("deployedUrl");

  // --- Loader and Vanta.js setup (no changes) ---
  const minimumLoaderTime = 1500;
  const startTime = new Date().getTime();
  function hideLoader() {
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - startTime;
    const remainingTime = minimumLoaderTime - elapsedTime;
    if (remainingTime > 0) {
      setTimeout(hideLoader, remainingTime);
    } else {
      loader.style.transform = "translateY(-100%)";
    }
  }
  window.addEventListener("load", hideLoader);

  VANTA.TOPOLOGY({
    el: "#vanta-background",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.0,
    minWidth: 200.0,
    scale: 1.0,
    scaleMobile: 1.0,
    color: 0x808080,
    backgroundColor: 0x0,
  });
  // ------------------------------------------

  // --- Input Validation Logic ---
  websiteUrlInput.addEventListener("input", () =>
    updateValidationUI(websiteUrlInput, projectNameInput, validateUrlButton)
  );
  projectNameInput.addEventListener("input", () =>
    updateValidationUI(websiteUrlInput, projectNameInput, validateUrlButton)
  );

  // Test credentials button
  testCredentialsButton.addEventListener("click", () => {
    fillTestCredentials(websiteUrlInput, projectNameInput);
  });
  // ------------------------------------------

  // --- Confetti Animation ---
  function createConfettiAnimation() {
    const jsConfetti = new JSConfetti();
    jsConfetti.addConfetti({
      emojis: ["🚀", "🎉", "✨", "💫", "🌟", "⭐", "🎊", "🎈"],
      emojiSize: 50,
      confettiNumber: 60,
      confettiRadius: 6,
    });
  }

  // --- Show Deployed URL ---
  function showDeployedUrl() {
    let deployedUrlText;
    if (window.deploymentProjectId) {
      deployedUrlText = `http://${window.deploymentProjectId}.${env.currentDomain}`;
    } else {
      const projectName = projectNameInput.value.trim();
      deployedUrlText = `http://${projectName}.${env.currentDomain}`;
    }
    deployedUrl.textContent = deployedUrlText;
    deployedUrl.href = deployedUrlText;
    urlDisplay.classList.add("visible");
  }

  // --- Show Loading Logs ---
  function showLoadingLogs() {
    const loadingEntry = document.createElement("div");
    loadingEntry.className = "log-entry loading-log";
    loadingEntry.innerHTML =
      '<span class="loading-text">Wait 😅 Container 🐬 is spinning</span><span class="loading-dots">...</span>';
    logsContent.appendChild(loadingEntry);

    // Auto-scroll to the bottom
    logsContainer.scrollTo({
      top: logsContainer.scrollHeight,
      behavior: "smooth",
    });
  }

  // --- Append Log ---
  function appendLog(data, onSuccess) {
    try {
      // Parse the JSON log data
      const messageData = JSON.parse(data);
      const actualLog = messageData.log;

      // Remove loading log if it exists
      const loadingLog = logsContent.querySelector(".loading-log");
      if (loadingLog) {
        loadingLog.remove();
      }

      const logEntry = document.createElement("div");
      logEntry.className = "log-entry";

      logEntry.textContent = actualLog;
      logsContent.appendChild(logEntry);

      // Auto-scroll to the bottom
      logsContainer.scrollTo({
        top: logsContainer.scrollHeight,
        behavior: "smooth",
      });

      // Check for deployment success
      if (actualLog.includes("Deployment successful!") && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // This is a fallback in case a log message isn't valid JSON.
      console.error("Could not parse log data:", data);
      // You could optionally display the raw data in case of an error.
      const logEntry = document.createElement("div");
      logEntry.textContent = `${data}`;
      logsContent.appendChild(logEntry);
    }
  }

  // --- Deploy Repository ---
  validateUrlButton.addEventListener("click", async function () {
    const url = websiteUrlInput.value.trim();
    const projectName = projectNameInput.value.trim();

    if (validateURL(url) && validateProjectName(projectName)) {
      // Show the log container and clear old logs
      logsContainer.classList.remove("hidden");
      logsContent.innerHTML = "";

      // Show loading logs immediately
      showLoadingLogs();

      let deploymentHandled = false;
      const completeDeployment = () => {
        if (deploymentHandled) return;
        deploymentHandled = true;
        showDeployedUrl(); // Show the URL immediately
        setTimeout(() => {
          createConfettiAnimation();
        }, 300); // Add confetti shortly after
      };

      // Set a timeout to show the URL after 15 seconds, regardless of log status
      setTimeout(completeDeployment, 20000);

      try {
        const result = await deployRepository(url, projectName);
        console.log("Deployment started:", result);
        window.deploymentProjectId = result.projectId;

        // Start listening for real-time logs
        listenToLogs(projectName, (logData) => {
          appendLog(logData, completeDeployment);
        });
      } catch (error) {
        console.error("Deployment failed:", error);
        // Display an error message in the logs UI
        appendLog(`❌ Error: Failed to start deployment. ${error.message}`);
      }
    } else {
      console.log("Invalid URL or project name format");
    }
  });

  websiteUrlInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !validateUrlButton.disabled) {
      validateUrlButton.click();
    }
  });
});
