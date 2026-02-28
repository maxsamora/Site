import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ctf_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me")
};

// Writeup APIs
export const writeupAPI = {
  getAll: (params) => api.get("/writeups", { params }),
  getFeatured: () => api.get("/writeups/featured"),
  getOne: (id) => api.get(`/writeups/${id}`),
  create: (data) => api.post("/writeups", data),
  update: (id, data) => api.put(`/writeups/${id}`, data),
  delete: (id) => api.delete(`/writeups/${id}`),
  vote: (id, vote) => api.post(`/writeups/${id}/vote?vote=${vote}`),
  getUserVote: (id) => api.get(`/writeups/${id}/user-vote`)
};

// Comment APIs
export const commentAPI = {
  getByWriteup: (writeupId) => api.get(`/comments/${writeupId}`),
  create: (data) => api.post("/comments", data),
  delete: (id) => api.delete(`/comments/${id}`)
};

// Resource APIs
export const resourceAPI = {
  getAll: (category) => api.get("/resources", { params: { category } }),
  create: (data) => api.post("/resources", data),
  delete: (id) => api.delete(`/resources/${id}`)
};

// Contact API
export const contactAPI = {
  submit: (data) => api.post("/contact", data)
};

// Stats API
export const statsAPI = {
  get: () => api.get("/stats")
};

export default api;
