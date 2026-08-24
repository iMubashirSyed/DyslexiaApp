import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  API_BASE_URL_ANDROID_EMULATOR,
  API_BASE_URL_ANDROID_DEVICE,
  API_BASE_URL_IOS_SIMULATOR,
} from '@env';

const USE_EMULATOR = true;

function getBaseUrl() {
  if (Platform.OS === 'android') {
    return USE_EMULATOR
      ? API_BASE_URL_ANDROID_EMULATOR
      : API_BASE_URL_ANDROID_DEVICE;
  }
  return API_BASE_URL_IOS_SIMULATOR;
}

/** Same host as mubashir client; paths live under `/umair/`. */
export function getUmairBaseUrl(): string {
  return getBaseUrl().replace(/mubashir\/?$/i, 'umair/');
}

/** Routes owned by the Developer 3 backend live under `/mateen/`. */
export function getMateenBaseUrl(): string {
  return getBaseUrl().replace(/mubashir\/?$/i, 'mateen/');
}

/** Animal Bingo API lives under `/mateen/bingo/`. */
export function getBingoGameBaseUrl(): string {
  return `${getMateenBaseUrl()}bingo/`;
}


const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** Dedupes concurrent 401/403 refresh attempts */
let refreshAccessPromise: Promise<string> | null = null;

async function fetchNewAccessToken(): Promise<string> {
  const refresh = await AsyncStorage.getItem('refresh_token');
  if (!refresh) {
    throw new Error('No refresh token');
  }
  const { data } = await axios.post<{ access: string }>(
    `${getBaseUrl()}token/refresh/`,
    { refresh },
    { headers: { 'Content-Type': 'application/json' } }
  );
  await AsyncStorage.setItem('access_token', data.access);
  return data.access;
}

function getRefreshedAccessToken(): Promise<string> {
  if (!refreshAccessPromise) {
    refreshAccessPromise = fetchNewAccessToken().finally(() => {
      refreshAccessPromise = null;
    });
  }
  return refreshAccessPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status;
    const url = originalRequest?.url ?? '';

    const isAuthPath =
      url.includes('login/') ||
      url.includes('register/') ||
      url.includes('token/refresh/');

    if (
      originalRequest &&
      (status === 401 || status === 403) &&
      !originalRequest._retry &&
      !isAuthPath
    ) {
      originalRequest._retry = true;
      try {
        const newAccess = await getRefreshedAccessToken();
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        }
        return apiClient(originalRequest);
      } catch {
        await AsyncStorage.multiRemove([
          'access_token',
          'refresh_token',
          'user_data',
        ]);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;