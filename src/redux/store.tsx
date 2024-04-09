import { configureStore } from "@reduxjs/toolkit";
//import notificationSliceReducer from "./slice/notification_slice.tsx";
import bookingSliceReducer from "./slice/bookingSlice.tsx";

const store = configureStore({
  reducer: {
    // notifaction: notificationSliceReducer,
    booking: bookingSliceReducer,
  },
});

export default store;
