let ws = null;

// Callbacks enregistrés par les composants
const listeners = new Map();

export const connectWebSocket = (userId, role = "user") => {
  if (ws && ws.readyState === WebSocket.OPEN) return; // déjà connecté

  const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:5000";
  ws = new WebSocket(`${WS_URL}?userId=${userId}&role=${role}`);

  ws.onopen = () => {
    console.log("✅ WebSocket connecté");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Déclencher tous les listeners enregistrés
      listeners.forEach((callback) => callback(data));
    } catch (e) {
      console.error("WS parse error:", e);
    }
  };

  ws.onerror = (err) => {
    console.error("❌ WS erreur:", err);
  };

  ws.onclose = () => {
    console.log("🔌 WS fermé — reconnexion dans 5s...");
    ws = null;
    setTimeout(() => connectWebSocket(userId, role), 5000);
  };
};

export const disconnectWebSocket = () => {
  ws?.close();
  ws = null;
};

// Pour s'abonner aux messages dans un composant
export const addWSListener = (key, callback) => {
  listeners.set(key, callback);
};

export const removeWSListener = (key) => {
  listeners.delete(key);
};