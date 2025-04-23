import axiosInstance from "../lib/axios";
import { LoginCredentials, LoginResponse } from "../types/strapi-entities";

export const login = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const response = await axiosInstance.post("/auth/local", credentials);
  return response.data;
};
