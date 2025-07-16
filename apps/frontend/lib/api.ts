import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { supabase } from "@/app/providers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get the current session to retrieve the access token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, try to refresh
      try {
        const {
          data: { session },
          error: refreshError,
        } = await supabase.auth.getSession();

        if (refreshError || !session) {
          // Refresh failed, redirect to login
          window.location.href = "/signin";
          return Promise.reject(error);
        }

        // Retry the original request with the new token
        const originalRequest = error.config;
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = "/signin";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// AI Assistance interface
export interface AIAssistanceRequest {
  type: "enhance" | "summarize" | "generateTags" | "generateContent";
  content?: string;
  prompt?: string;
  context?: string;
}

export interface AIAssistanceResponse {
  result: string;
  suggestions?: string[];
}

// AI Assistance API methods
export const aiAssistance = {
  async getAssistance(
    request: AIAssistanceRequest
  ): Promise<AIAssistanceResponse> {
    const response = await apiClient.post("/ai/assistance", request);
    return response.data;
  },

  async enhanceContent(content: string): Promise<string> {
    const response = await this.getAssistance({
      type: "enhance",
      content,
    });
    return response.result;
  },

  async summarizeContent(content: string): Promise<string> {
    const response = await this.getAssistance({
      type: "summarize",
      content,
    });
    return response.result;
  },

  async generateTags(content: string): Promise<string[]> {
    const response = await this.getAssistance({
      type: "generateTags",
      content,
    });
    return response.suggestions || [];
  },

  async generateContent(prompt: string, context?: string): Promise<string> {
    const response = await this.getAssistance({
      type: "generateContent",
      prompt,
      context,
    });
    return response.result;
  },
};

export default apiClient;
