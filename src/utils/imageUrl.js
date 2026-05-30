// utils/imageUrl.js
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const imageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url; // URL absolue (anciens Cloudinary)
  return `${BASE_URL}${url}`;
};