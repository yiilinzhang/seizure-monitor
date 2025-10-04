import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface SyncState {
  isOnline: boolean;
  queuedRequests: number;
  lastSync: number | null;
  syncInProgress: boolean;
}

const initialState: SyncState = {
  isOnline: true,
  queuedRequests: 0,
  lastSync: null,
  syncInProgress: false,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnline: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setQueuedRequests: (state, action: PayloadAction<number>) => {
      state.queuedRequests = action.payload;
    },
    incrementQueue: state => {
      state.queuedRequests += 1;
    },
    decrementQueue: state => {
      state.queuedRequests = Math.max(0, state.queuedRequests - 1);
    },
    setSyncInProgress: (state, action: PayloadAction<boolean>) => {
      state.syncInProgress = action.payload;
    },
    syncCompleted: state => {
      state.lastSync = Date.now();
      state.syncInProgress = false;
    },
  },
});

export const {
  setOnline,
  setQueuedRequests,
  incrementQueue,
  decrementQueue,
  setSyncInProgress,
  syncCompleted,
} = syncSlice.actions;

export default syncSlice.reducer;
