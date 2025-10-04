// client/services/authService.ts
import { API_URL } from "@/constants";
import axios from "axios";

const api = axios.create({
  baseURL: API_URL,
  timeout: 6000, // ⏱️ fail fast so you don't wait ~30s
});

export const login = async (
  identifier: string,
  password: string
): Promise<{ token: string }> => {
  try {
    const id = identifier.trim();
    const body = id.includes("@")
      ? { email: id, password }
      : { phone: id, password };
    const { data } = await api.post("/auth/login", body);
    return data;
  } catch (error: any) {
    if (error.code === "ECONNABORTED" || error.message === "Network Error") {
      throw new Error(
        "Cannot reach the server on your Wi-Fi. Check API_URL / same LAN."
      );
    }
    const msg = error?.response?.data?.msg || "Login Failed";
    throw new Error(msg);
  }
};

export const register = async (
  email: string,
  password: string,
  name: string,
  avatar?: string | null,
  phone?: string
): Promise<{ token: string }> => {
  try {
    const { data } = await api.post("/auth/register", {
      email,
      phone,
      password,
      name,
      avatar,
    });
    return data;
  } catch (error: any) {
    if (error.code === "ECONNABORTED" || error.message === "Network Error") {
      throw new Error(
        "Cannot reach the server on your Wi-Fi. Check API_URL / same LAN."
      );
    }
    const msg = error?.response?.data?.msg || "Registration Failed";
    throw new Error(msg);
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  } catch (error: any) {
    if (error.code === "ECONNABORTED" || error.message === "Network Error") {
      throw new Error(
        "Cannot reach the server on your Wi-Fi. Check API_URL / same LAN."
      );
    }
    const msg = error?.response?.data?.msg || "Failed to send reset email";
    throw new Error(msg);
  }
};

export const resetPassword = async (token: string, password: string) => {
  try {
    const { data } = await api.post(`/auth/reset-password/${token}`, {
      password,
    });
    return data;
  } catch (error: any) {
    if (error.code === "ECONNABORTED" || error.message === "Network Error") {
      throw new Error(
        "Cannot reach the server on your Wi-Fi. Check API_URL / same LAN."
      );
    }
    const msg = error?.response?.data?.msg || "Failed to reset password";
    throw new Error(msg);
  }
};
