import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import sensorReducer from './slices/sensorSlice';
import emergencyReducer from './slices/emergencySlice';
import syncReducer from './slices/syncSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sensor: sensorReducer,
    emergency: emergencyReducer,
    sync: syncReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;