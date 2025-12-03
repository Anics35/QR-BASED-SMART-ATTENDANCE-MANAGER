import axios from 'axios';

// CHANGE THIS to your backend URL
const API_URL = 'http://localhost:8080'; 

const api = axios.create({
  baseURL: API_URL,
});

// Automatically add Token to headers if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('teacherToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;