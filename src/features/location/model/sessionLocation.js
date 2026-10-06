// Visit-only coordinates stay in memory: never persisted in browser storage or User.
let current = null;
const listeners = new Set();
export const getSessionLocation = () => current;
export const subscribeLocation = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export function setSessionLocation(value) {
  current = value;
  listeners.forEach(listener => listener());
}