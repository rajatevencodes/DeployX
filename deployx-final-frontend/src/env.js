// Environment configuration using Vite environment variables
export const env = {
  apiURL: import.meta.env.VITE_API_URL,
  socketURL: import.meta.env.VITE_SOCKET_URL,
  currentDomain: import.meta.env.VITE_CURRENT_DOMAIN,
};

console.log(`🔗 API URL: ${env.apiURL}`);
console.log(`🔌 Socket URL: ${env.socketURL}`);
console.log(`🔗 Current Domain: ${env.currentDomain}`);
