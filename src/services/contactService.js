import api from "./api"; // ton instance axios configurée

export const submitReclamation = (data) =>
  api.post("/contact/reclamation", data).then((res) => res.data);

export const getAllReclamations = () =>
  api.get("/contact/reclamations").then((res) => res.data);

export const updateReclamationStatus = (id, status) =>
  api.patch(`/contact/reclamations/${id}/status`, { status }).then((res) => res.data);