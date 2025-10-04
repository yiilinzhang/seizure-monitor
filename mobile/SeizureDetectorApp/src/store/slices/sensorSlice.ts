import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface SensorData {
  timestamp: number;
  value: number;
  delta: number;
}

interface SensorState {
  isConnected: boolean;
  currentValue: number | null;
  baseline: number | null;
  data: SensorData[];
  threshold: number;
  duration: number;
}

const initialState: SensorState = {
  isConnected: false,
  currentValue: null,
  baseline: null,
  data: [],
  threshold: 15,
  duration: 5,
};

const sensorSlice = createSlice({
  name: 'sensor',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setCurrentValue: (state, action: PayloadAction<number>) => {
      state.currentValue = action.payload;
    },
    setBaseline: (state, action: PayloadAction<number>) => {
      state.baseline = action.payload;
    },
    addSensorData: (state, action: PayloadAction<SensorData>) => {
      state.data.push(action.payload);
      // Keep only last 1000 data points
      if (state.data.length > 1000) {
        state.data.shift();
      }
    },
    setThreshold: (state, action: PayloadAction<number>) => {
      state.threshold = action.payload;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    clearData: state => {
      state.data = [];
    },
  },
});

export const {
  setConnected,
  setCurrentValue,
  setBaseline,
  addSensorData,
  setThreshold,
  setDuration,
  clearData,
} = sensorSlice.actions;

export default sensorSlice.reducer;
