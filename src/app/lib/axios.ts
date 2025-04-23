import axios from 'axios';

const api_url = (import.meta as ImportMeta & { env: { VITE_API_URL: string } }).env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: api_url,
  withCredentials: true,
});

export default axiosInstance;