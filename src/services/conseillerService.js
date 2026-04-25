// services/conseillerService.js
import api from './api';

export const getRecommandations = (demande) =>
  api.post('/ai/recommander', { demande });