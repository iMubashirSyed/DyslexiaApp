export interface User {
    id: number;
    email: string;
    username: string;
  }
  
  export interface AuthResponse {
    access: string;
    refresh: string;
    user: User;
  }
  
  export interface AuthState {
    user: User | null;
    userToken: string | null;
    isLoading: boolean;
    /** 1-based level; meaningful when logged in after hydration. */
    alphabetMatcherLevel: number;
    /** False while fetching saved level for a logged-in user. */
    alphabetMatcherLevelReady: boolean;
  }