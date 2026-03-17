import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FeedState } from '../types';
import { mockContent } from '../utils/mockData';

const initialState: FeedState = {
  items: [],
  isLoading: false,
  error: null,
  filter: 'all',
};

export const fetchContent = createAsyncThunk('feed/fetchContent', async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return mockContent;
});

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<string>) {
      state.filter = action.payload;
    },
    fetchContentStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    fetchContentSuccess(state, action: PayloadAction<FeedState['items']>) {
      state.isLoading = false;
      state.items = action.payload;
    },
    fetchContentFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchContent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to fetch content';
      });
  },
});

export const { setFilter, fetchContentStart, fetchContentSuccess, fetchContentFailure } = feedSlice.actions;
export default feedSlice.reducer;
