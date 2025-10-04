import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface Contact {
  id: string | number;
  name: string;
  phone: string;
}

interface EmergencyState {
  contacts: Contact[];
  autoCall: boolean;
  autoSMS: boolean;
  lastEmergency: number | null;
}

const initialState: EmergencyState = {
  contacts: [],
  autoCall: true,
  autoSMS: true,
  lastEmergency: null,
};

const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    setContacts: (state, action: PayloadAction<Contact[]>) => {
      state.contacts = action.payload;
    },
    addContact: (state, action: PayloadAction<Contact>) => {
      state.contacts.push(action.payload);
    },
    removeContact: (state, action: PayloadAction<string | number>) => {
      state.contacts = state.contacts.filter(c => c.id !== action.payload);
    },
    setAutoCall: (state, action: PayloadAction<boolean>) => {
      state.autoCall = action.payload;
    },
    setAutoSMS: (state, action: PayloadAction<boolean>) => {
      state.autoSMS = action.payload;
    },
    triggerEmergency: state => {
      state.lastEmergency = Date.now();
    },
  },
});

export const {
  setContacts,
  addContact,
  removeContact,
  setAutoCall,
  setAutoSMS,
  triggerEmergency,
} = emergencySlice.actions;

export default emergencySlice.reducer;
