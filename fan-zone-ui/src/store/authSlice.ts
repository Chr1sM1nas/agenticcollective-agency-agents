import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../types';

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
      });
  },
});

export const { loginSuccess, logout, setIdentityStep, setAgeVerified, clearError } = authSlice.actions;
export default authSlice.reducer;
