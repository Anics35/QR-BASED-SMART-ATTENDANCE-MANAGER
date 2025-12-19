import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://10.142.6.218:8080'; 

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
});

// Add Token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('studentToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;