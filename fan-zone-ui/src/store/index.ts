import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import feedReducer from './feedSlice';

const AUTH_STORAGE_KEY = 'fanzone.auth.v1';

function loadPreloadedState() {
  if (typeof window === 'undefined') return undefined;

  try {
    const serialized = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!serialized) return undefined;

    const authState = JSON.parse(serialized);
    return { auth: authState };
  } catch {
    return undefined;
  }
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    feed: feedReducer,
  },
  preloadedState: loadPreloadedState(),
});

if (typeof window !== 'undefined') {
  store.subscribe(() => {
    try {
      const state = store.getState();
      const persistedAuth = {
        user: state.auth.user,
        identityStep: state.auth.identityStep,
        isLoading: false,
        error: null,
      };
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(persistedAuth));
    } catch {
      // Ignore storage failures in private browsing or quota exceeded scenarios.
    }
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
