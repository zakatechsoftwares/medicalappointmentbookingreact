import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, errorMessage } from "../../api";
import { BookingType, NewBookingType } from "../DataType/DataType";

interface BookingState {
  bookings: BookingType[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
}

const initialState: BookingState = { bookings: [], status: "idle", error: null };

export const fetchAppointments = createAsyncThunk(
  "booking/fetch",
  async (_: void, { rejectWithValue }) => {
    try {
      return await api<BookingType[]>("/api/appointments");
    } catch (e) {
      return rejectWithValue(errorMessage(e));
    }
  }
);

export const bookAppointment = createAsyncThunk(
  "booking/book",
  async (data: NewBookingType, { rejectWithValue }) => {
    try {
      return await api<BookingType>("/api/appointments", { method: "POST", body: data });
    } catch (e) {
      return rejectWithValue(errorMessage(e));
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  "booking/cancel",
  async (id: string, { rejectWithValue }) => {
    try {
      return await api<BookingType>(`/api/appointments/${id}/cancel`, { method: "PATCH" });
    } catch (e) {
      return rejectWithValue(errorMessage(e));
    }
  }
);

const sortBookings = (list: BookingType[]) =>
  [...list].sort((a, b) => `${a.date} ${a.timeSlot}`.localeCompare(`${b.date} ${b.timeSlot}`));

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    clearBookings: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.status = "ready";
        state.bookings = sortBookings(action.payload);
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload as string;
      })
      .addCase(bookAppointment.fulfilled, (state, action) => {
        state.bookings = sortBookings([...state.bookings, action.payload]);
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.bookings = state.bookings.map((b) =>
          b.id === action.payload.id ? action.payload : b
        );
      });
  },
});

export const { clearBookings } = bookingSlice.actions;
export default bookingSlice.reducer;
