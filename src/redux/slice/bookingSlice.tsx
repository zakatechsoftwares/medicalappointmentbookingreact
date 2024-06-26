import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { BookingType } from "../DataType/DataType";

const initialState: BookingType[] = [];

const notificationSlice = createSlice({
  name: "booking",
  initialState: {
    bookings: initialState,
  },
  reducers: {
    appointment: (state, action: PayloadAction<BookingType>) => {
      state.bookings = [...state.bookings, action.payload];
    },
    cancelAppointment: (state, action: PayloadAction<string>) => {
      const array = state.bookings.filter((item) => item.id !== action.payload);
      state.bookings = array;
    },
  },
});

export const { appointment, cancelAppointment } = notificationSlice.actions;
export default notificationSlice.reducer;
