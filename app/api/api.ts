import axios, { AxiosError } from "axios";
import { API_BASE_URL, API_TIMEOUT_MS } from "@/lib/api/config";

export type ApiError = AxiosError<{ error: string }>;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: API_TIMEOUT_MS,
});
