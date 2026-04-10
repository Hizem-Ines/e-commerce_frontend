import api from "./api";

// ── PUBLIC ────────────────────────────────────────────────

export const getAllFaqs = async () => {
  const { data } = await api.get("/faqs");
  return data;
};

export const searchFaqs = async (q) => {
  const { data } = await api.get("/faqs/search", { params: { q } });
  return data;
};

export const askQuestion = async (payload) => {
  // payload: { user_name, user_email, question }
  const { data } = await api.post("/faqs/ask", payload);
  return data;
};

// ── ADMIN — FAQs ─────────────────────────────────────────

export const adminGetAllFaqs = async () => {
  const { data } = await api.get("/faqs/admin/all");
  return data;
};

export const adminCreateFaq = async (payload) => {
  // payload: { category, question_fr, answer_fr, order_index }
  const { data } = await api.post("/faqs/admin", payload);
  return data;
};

export const adminUpdateFaq = async (id, payload) => {
  const { data } = await api.put(`/faqs/admin/${id}`, payload);
  return data;
};

export const adminToggleFaq = async (id) => {
  const { data } = await api.patch(`/faqs/admin/${id}/toggle`);
  return data;
};

export const adminDeleteFaq = async (id) => {
  const { data } = await api.delete(`/faqs/admin/${id}`);
  return data;
};

// ── ADMIN — Questions utilisateurs ───────────────────────

export const adminGetQuestions = async ({ status, page = 1 } = {}) => {
  const { data } = await api.get("/faqs/admin/questions", {
    params: { status, page },
  });
  return data;
};

export const adminAnswerQuestion = async (id, answer) => {
  const { data } = await api.patch(`/faqs/admin/questions/${id}/answer`, { answer });
  return data;
};

export const adminDeleteQuestion = async (id) => {
  const { data } = await api.delete(`/faqs/admin/questions/${id}`);
  return data;
};