import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client.ts';
import { fetchAlphabetMatcherLevel, updateAlphabetMatcherLevel } from '../api/services.ts';
import { User, AuthResponse, AuthState } from '../api/types.ts';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAlphabetMatcherLevel: () => Promise<void>;
  saveAlphabetMatcherLevel: (level: number) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    userToken: null,
    isLoading: true,
    alphabetMatcherLevel: 1,
    alphabetMatcherLevelReady: false,
  });

  const refreshAlphabetMatcherLevel = useCallback(async () => {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      setState(prev => ({
        ...prev,
        alphabetMatcherLevel: 1,
        alphabetMatcherLevelReady: true,
      }));
      return;
    }
    try {
      const level = await fetchAlphabetMatcherLevel();
      setState(prev => ({
        ...prev,
        alphabetMatcherLevel: level,
        alphabetMatcherLevelReady: true,
      }));
    } catch {
      setState(prev => ({
        ...prev,
        alphabetMatcherLevel: 1,
        alphabetMatcherLevelReady: true,
      }));
    }
  }, []);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const userData = await AsyncStorage.getItem('user_data');
        if (token && userData) {
          const user = JSON.parse(userData) as User;
          setState(prev => ({
            ...prev,
            userToken: token,
            user,
            isLoading: false,
            alphabetMatcherLevelReady: false,
          }));
          try {
            const level = await fetchAlphabetMatcherLevel();
            setState(prev => ({
              ...prev,
              alphabetMatcherLevel: level,
              alphabetMatcherLevelReady: true,
            }));
          } catch {
            setState(prev => ({
              ...prev,
              alphabetMatcherLevel: 1,
              alphabetMatcherLevelReady: true,
            }));
          }
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            alphabetMatcherLevel: 1,
            alphabetMatcherLevelReady: true,
          }));
        }
      } catch {
        setState(prev => ({
          ...prev,
          isLoading: false,
          alphabetMatcherLevel: 1,
          alphabetMatcherLevelReady: true,
        }));
      }
    };
    loadStorageData();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<AuthResponse>('login/', { email, password });
    const { access, refresh, user } = response.data;

    await AsyncStorage.setItem('access_token', access);
    await AsyncStorage.setItem('refresh_token', refresh);
    await AsyncStorage.setItem('user_data', JSON.stringify(user));

    setState(prev => ({
      ...prev,
      user,
      userToken: access,
      isLoading: false,
      alphabetMatcherLevelReady: false,
    }));

    try {
      const level = await fetchAlphabetMatcherLevel();
      setState(prev => ({
        ...prev,
        alphabetMatcherLevel: level,
        alphabetMatcherLevelReady: true,
      }));
    } catch {
      setState(prev => ({
        ...prev,
        alphabetMatcherLevel: 1,
        alphabetMatcherLevelReady: true,
      }));
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
    setState({
      user: null,
      userToken: null,
      isLoading: false,
      alphabetMatcherLevel: 1,
      alphabetMatcherLevelReady: true,
    });
  };

  const saveAlphabetMatcherLevel = async (level: number) => {
    setState(prev => ({ ...prev, alphabetMatcherLevel: level }));
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      return;
    }
    try {
      await updateAlphabetMatcherLevel(level);
    } catch {
      // Local state already updated; server sync can fail offline
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshAlphabetMatcherLevel,
        saveAlphabetMatcherLevel,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
