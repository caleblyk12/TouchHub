import axios from "axios";

// Replace with hosted link later
const baseURL = "https://touchhub.onrender.com" //"http://127.0.0.1:8000";

const api = axios.create({ baseURL });

// attach JWT from localStorage automatically (if present)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;