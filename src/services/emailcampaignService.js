import api from "./api" ;

// ── Public ───────────────────────────────────────────────
export const subscribeNewsletter = (email, name) =>
  api.post("/email-campaigns/subscribe", { email, name });

export const unsubscribeNewsletter = (email) =>
  api.post("/email-campaigns/unsubscribe", { email });

// ── Admin ────────────────────────────────────────────────
export const getAllCampaigns = () =>
  api.get("/email-campaigns");

export const getAllSubscribers = () =>
  api.get("/email-campaigns/subscribers");

export const createCampaign = (data) =>
  api.post("/email-campaigns", data);

export const sendCampaign = (campaignId, promoCode) =>
  api.post(`/email-campaigns/${campaignId}/send`, { promoCode });