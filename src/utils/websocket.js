let ws            = null;
let shouldReconnect = false; // ← flag pour distinguer déco volontaire vs perte réseau
const listeners   = new Map();

export const connectWebSocket = (userId, role = "user") => {
   if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  shouldReconnect = true;
  const WS_URL    = process.env.REACT_APP_WS_URL || "ws://localhost:5000";
  ws = new WebSocket(`${WS_URL}?userId=${userId}&role=${role}`);

  ws.onopen = () => {
    console.log("✅ WebSocket connecté");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("[WS] Message reçu:", data); // ← garde ce log pour déboguer
      listeners.forEach((callback) => callback(data));
    } catch (e) {
      console.error("WS parse error:", e);
    }
  };

  ws.onerror = (err) => {
    console.error("❌ WS erreur:", err);
  };

  const thisWs = ws;
  ws.onclose = () => {
    if (ws === thisWs) ws = null; // only clear if no newer socket exists
    if (shouldReconnect) {
      console.log("🔌 WS fermé — reconnexion dans 5s...");
      setTimeout(() => { if (shouldReconnect) connectWebSocket(userId, role); }, 5000);
    }
  };
};

export const disconnectWebSocket = () => {
  shouldReconnect = false; // ← stoppe la reconnexion automatique
  ws?.close();
  ws = null;
};

export const addWSListener    = (key, callback) => listeners.set(key, callback);
export const removeWSListener = (key)            => listeners.delete(key);