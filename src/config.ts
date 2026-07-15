// Falls back to the current page's hostname so the app works when opened
// from another device on the local network via the dev host's LAN IP,
// without needing a hardcoded address.
export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3000`;
