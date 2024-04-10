import { configureStore } from "@reduxjs/toolkit";
//import notificationSliceReducer from "./slice/notification_slice.tsx";
import bookingSliceReducer from "./slice/bookingSlice.tsx";
import reviewSliceReducer from "./slice/reviews.tsx";

const store = configureStore({
  reducer: {
    // notifaction: notificationSliceReducer,
    booking: bookingSliceReducer,
    reviews: reviewSliceReducer,
  },
});

export default store;
