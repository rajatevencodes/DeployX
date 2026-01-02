import { generate } from "random-words";

// Validation regex patterns
export const urlRegex =
  /^(https?:\/\/)?(github\.com|gitlab\.com)\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+(\.git)?$/;
export const projectNameRegex = /^[a-z0-9_-]+$/;

// URL validation function
export function validateURL(url) {
  return urlRegex.test(url);
}

// Project name validation function
export function validateProjectName(name) {
  return projectNameRegex.test(name) && name.length >= 3 && name.length <= 63;
}

// Update validation UI helper function
export function updateValidationUI(
  websiteUrlInput,
  projectNameInput,
  validateUrlButton
) {
  const url = websiteUrlInput.value.trim();
  const projectName = projectNameInput.value.trim();
  const isUrlValid = url === "" || validateURL(url);
  const isProjectNameValid =
    projectName === "" || validateProjectName(projectName);

  // Update URL input styling
  websiteUrlInput.classList.remove("valid", "invalid");
  if (url !== "") {
    websiteUrlInput.classList.add(isUrlValid ? "valid" : "invalid");
  }

  // Update project name input styling
  projectNameInput.classList.remove("valid", "invalid");
  if (projectName !== "") {
    projectNameInput.classList.add(isProjectNameValid ? "valid" : "invalid");
  }

  // Update button state
  const bothFilled = url !== "" && projectName !== "";
  const bothValid = isUrlValid && isProjectNameValid;
  validateUrlButton.disabled = !(bothFilled && bothValid);
}

// Test credentials function
const testUrls = [
  `https://github.com/rajatevencodes/MarioGame.git`,
  `https://github.com/MisterPrada/morph-particles`,
];
export function fillTestCredentials(urlInput, projectNameInput) {
  const testUrl = testUrls[Math.floor(Math.random() * testUrls.length)];

  // Generate random project name
  const randomProjectName = generate();

  // Fill the inputs
  urlInput.value = testUrl;
  projectNameInput.value = randomProjectName;

  // Trigger validation update
  const event = new Event("input", { bubbles: true });
  urlInput.dispatchEvent(event);
  projectNameInput.dispatchEvent(event);

  // Blur the URL input
  urlInput.blur();
}
