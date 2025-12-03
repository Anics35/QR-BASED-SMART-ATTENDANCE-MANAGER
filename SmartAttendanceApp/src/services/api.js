import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️ IMPORTANT: Replace with your PC's Local IP address (e.g., 192.168.1.5)
// Do NOT use 'localhost' because your phone cannot see 'localhost' on your laptop.
const API_URL = 'http://10.135.134.218:8080'; 

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