import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../types';
import { verifyAgeWithApi } from '../services/ageVerificationService';
import {
  loginWithDatabase,
  logoutFromDatabase,
  registerWithDatabase,
  verifyUserAgeInDatabase,
} from '../services/authDbService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  identityStep: 'anonymous',
};

export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      if (isSupabaseConfigured) {
        return await loginWithDatabase(email, password);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (email && password.length >= 8) {
        const user: User = {
          id: 'demo-user',
          email,
          displayName: email.split('@')[0],
          ageVerified: false,
          xpScore: 4200,
          predictionAccuracy: 56,
          collectiblesCount: 12,
          teamAffinity: 'Arsenal',
          favoritePlayers: ['Bukayo Saka', 'Martin Odegaard'],
        };
        return user;
      }
      throw new Error('Invalid credentials');
    } catch (err) {
      const error = err as Error;
      return rejectWithValue(error.message);
    }
  }
);

export const registerWithEmail = createAsyncThunk(
  'auth/registerWithEmail',
  async ({ displayName, email, password }: { displayName: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      if (isSupabaseConfigured) {
        return await registerWithDatabase({ displayName, email, password });
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (displayName.trim().length >= 2 && email && password.length >= 8) {
        const user: User = {
          id: `user-${Date.now()}`,
          email,
          displayName: displayName.trim(),
          ageVerified: false,
          xpScore: 0,
          predictionAccuracy: 0,
          collectiblesCount: 0,
          teamAffinity: 'Arsenal',
          favoritePlayers: [],
        };
        return user;
      }
      throw new Error('Please enter valid registration details');
    } catch (err) {
      const error = err as Error;
      return rejectWithValue(error.message);
    }
  }
);

export const verifyAge = createAsyncThunk(
  'auth/verifyAge',
  async ({ day, month, year }: { day: number; month: number; year: number }, { rejectWithValue, getState }) => {
    try {
      const response = await verifyAgeWithApi({ day, month, year });
      if (!response.isVerified) {
        throw new Error(response.reason ?? 'Age verification failed');
      }

      const state = getState() as { auth: AuthState };
      const userId = state.auth.user?.id;

      // Only call Supabase if configured and userId is a valid UUID (not demo/mock)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (isSupabaseConfigured && userId && uuidRegex.test(userId)) {
        const dobIsoDate = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        await verifyUserAgeInDatabase(userId, dobIsoDate);
      }

      // For demo/mock users, just update local state
      return true;
    } catch (err) {
      const error = err as Error;
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { rejectWithValue }) => {
  try {
    if (isSupabaseConfigured) {
      await logoutFromDatabase();
    }
    return true;
  } catch (err) {
    const error = err as Error;
    return rejectWithValue(error.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.identityStep = 'logged-in';
      state.error = null;
      state.isLoading = false;
    },
    logout(state) {
      state.user = null;
      state.identityStep = 'anonymous';
      state.error = null;
    },
    setIdentityStep(state, action: PayloadAction<AuthState['identityStep']>) {
      state.identityStep = action.payload;
    },
    setAgeVerified(state) {
      if (state.user) {
        state.user.ageVerified = true;
        state.identityStep = 'age-verified';
      }
    },
    awardXp(state, action: PayloadAction<number>) {
      if (!state.user) return;

      state.user.xpScore += Math.max(0, action.payload);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.identityStep = 'logged-in';
        state.error = null;
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.identityStep = 'logged-in';
        state.error = null;
      })
      .addCase(registerWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyAge.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyAge.fulfilled, (state) => {
        state.isLoading = false;
        if (state.user) {
          state.user.ageVerified = true;
          state.identityStep = 'age-verified';
        }
      })
      .addCase(verifyAge.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.identityStep = 'anonymous';
        state.error = null;
        state.isLoading = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { loginSuccess, logout, setIdentityStep, setAgeVerified, awardXp, clearError } = authSlice.actions;
export default authSlice.reducer;
