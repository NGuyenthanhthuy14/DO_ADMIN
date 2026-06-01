import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AdminUser } from '../../services/types';

const TOKEN_STORAGE_KEY = 'da_admin_access_token';
const USER_STORAGE_KEY = 'da_admin_user';

type AuthState = {
  accessToken: string | null;
  user: AdminUser | null;
};

function getStoredToken() {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

function getStoredUser() {
  const value = window.localStorage.getItem(USER_STORAGE_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AdminUser;
  } catch {
    return null;
  }
}

const initialState: AuthState = {
  accessToken: getStoredToken(),
  user: getStoredUser(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ accessToken: string; user: AdminUser }>
    ) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      window.localStorage.setItem(TOKEN_STORAGE_KEY, action.payload.accessToken);
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.accessToken = null;
      state.user = null;
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(USER_STORAGE_KEY);
    },
  },
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
