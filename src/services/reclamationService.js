import api from "./api";

// POST /api/reclamations/guest (formulaire public)
export const submitReclamation = (data) =>
  api.post("/reclamations/guest", data).then((res) => res.data);

// GET /api/reclamations (admin)
export const getAllReclamations = (params = {}) =>
  api.get("/reclamations", { params }).then((res) => res.data);

// PATCH /api/reclamations/:id/respond (admin)
export const respondToReclamation = (id, data) =>
  api.patch(`/reclamations/${id}/respond`, data).then((res) => res.data);