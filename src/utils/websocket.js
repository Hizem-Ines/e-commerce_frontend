let ws            = null;
let shouldReconnect = false; // ← flag pour distinguer déco volontaire vs perte réseau
let reconnectTimer  = null;  
const listeners   = new Map();

export const connectWebSocket = (userId) => {
   if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  shouldReconnect = true;
  const WS_URL    = process.env.REACT_APP_WS_URL || "ws://localhost:5000";
  ws = new WebSocket(`${WS_URL}?userId=${userId}`);

  ws.onopen = () => {
    
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      listeners.forEach((callback) => callback(data));
    } catch (e) {
      console.error("WS parse error:", e);
    }
  };

  ws.onerror = (err) => {
    if (process.env.NODE_ENV !== 'production') {
        console.error("❌ WS erreur:", err);
    }
};

  const thisWs = ws;
  ws.onclose = () => {
    if (ws === thisWs) ws = null;
    if (shouldReconnect) {
      reconnectTimer = setTimeout(() => {
        if (shouldReconnect) connectWebSocket(userId);
      }, 5000);
    }
  };
};

export const disconnectWebSocket = () => {
  shouldReconnect = false; // ← stoppe la reconnexion automatique
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  ws?.close();
  ws = null;
};

export const addWSListener    = (key, callback) => listeners.set(key, callback);
export const removeWSListener = (key)            => listeners.delete(key);