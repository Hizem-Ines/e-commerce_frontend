import api from "./api";

// POST /api/reclamations/guest (formulaire public)
export const submitReclamation = (data) =>
  api.post("/reclamations/guest", data).then((res) => res.data);

// POST /api/reclamations (user connecté)
export const createReclamation = (data) =>
  api.post("/reclamations", data).then((res) => res.data);

// GET /api/reclamations/eligible-orders (user connecté)
export const getEligibleOrders = () =>
  api.get("/reclamations/eligible-orders").then((res) => res.data);

// GET /api/reclamations/my (user connecté)
export const getMyReclamations = () =>
  api.get("/reclamations/my").then((res) => res.data);


// GET /api/reclamations (admin)
export const getAllReclamations = (params = {}) =>
  api.get("/reclamations", { params }).then((res) => res.data);

// PATCH /api/reclamations/:id/respond (admin)
export const respondToReclamation = (id, data) =>
  api.patch(`/reclamations/${id}/respond`, data).then((res) => res.data);

