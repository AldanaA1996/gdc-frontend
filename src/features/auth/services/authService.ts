import axiosInstance from '../../../lib/axios';
import { LoginCredentials, LoginResponse } from '../types/auth';

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await axiosInstance.post('/auth/local', credentials);
  return response.data;
};
