import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Public APIs (read-only, no auth required)
export const writeupAPI = {
  getAll: (params) => api.get("/writeups", { params }),
  getFeatured: () => api.get("/writeups/featured"),
  getOne: (id) => api.get(`/writeups/${id}`),
  vote: (id, vote) => api.post(`/writeups/${id}/vote?vote=${vote}`),
};

export const commentAPI = {
  getByWriteup: (writeupId) => api.get(`/comments/${writeupId}`),
  create: (writeupId, data) => api.post(`/comments?writeup_id=${writeupId}`, data),
};

export const resourceAPI = {
  getAll: (category) => api.get("/resources", { params: { category } }),
};

export const contactAPI = {
  submit: (data) => api.post("/contact", data)
};

export const statsAPI = {
  get: () => api.get("/stats")
};

// Admin APIs (require HTTP Basic Auth)
export const adminAPI = {
  verify: (authHeader) => 
    api.get("/admin/verify", { headers: authHeader }),
  
  // Writeups
  getAllWriteups: (authHeader) => 
    api.get("/admin/writeups", { headers: authHeader }),
  createWriteup: (data, authHeader) => 
    api.post("/admin/writeups", data, { headers: authHeader }),
  updateWriteup: (id, data, authHeader) => 
    api.put(`/admin/writeups/${id}`, data, { headers: authHeader }),
  deleteWriteup: (id, authHeader) => 
    api.delete(`/admin/writeups/${id}`, { headers: authHeader }),
  
  // Resources
  createResource: (data, authHeader) => 
    api.post("/admin/resources", data, { headers: authHeader }),
  deleteResource: (id, authHeader) => 
    api.delete(`/admin/resources/${id}`, { headers: authHeader }),
  
  // Comments
  deleteComment: (id, authHeader) => 
    api.delete(`/admin/comments/${id}`, { headers: authHeader }),
  
  // Image upload
  uploadImage: (file, authHeader) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/admin/upload", formData, {
      headers: {
        ...authHeader,
        "Content-Type": "multipart/form-data"
      }
    });
  }
};

// Skills and techniques constants
export const SKILLS = [
  "SQLi", "XSS", "SSTI", "SSRF", "LFI", "RFI", "RCE",
  "PrivEsc", "AD", "Kerberoasting", "Pass-the-Hash",
  "Buffer Overflow", "Deserialization", "XXE", "Command Injection"
];

export const TECHNIQUES = [
  "Enumeration", "Lateral Movement", "Persistence",
  "Credential Dumping", "Token Impersonation", "Pivoting",
  "Port Forwarding", "Tunneling"
];

export default api;
