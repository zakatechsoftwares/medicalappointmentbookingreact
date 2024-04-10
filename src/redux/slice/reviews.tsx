// import { PayloadAction, createSlice } from "@reduxjs/toolkit";

// interface ReviewType {
//   id: string;
//   author: string;
//   comment: string;
//   doctorName: string;
// }

// interface DoctorReviewType {
//   name: string;
//   review: ReviewType[];
// }

// const review: DoctorReviewType[] = [];

// const reviewSlice = createSlice({
//   name: "booking",
//   initialState: {
//     reviews: review,
//   },
//   reducers: {
//     addReview: (state, action: PayloadAction<ReviewType>) => {
//       const doctor = state.reviews.find(
//         (item: DoctorReviewType) => item.name === action.payload.doctorName
//       );
//       const doctorReview = doctor?.review.push(action.payload)
//     const newDoctor = {...doctor, review: doctorReview}
//     state.reviews=[...state.reviews, newDoctor.review[0]];
//     },
//   },
// });

// export const { addReview } = reviewSlice.actions;
// export default reviewSlice.reducer;

import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ReviewType } from "../DataType/DataType";
import { DoctorReviewType } from "../DataType/DataType";

const review: DoctorReviewType[] = [];

const reviewSlice = createSlice({
  name: "booking",
  initialState: {
    reviews: review,
  },
  reducers: {
    addReview: (state, action: PayloadAction<ReviewType>) => {
      const { doctorName } = action.payload;
      const doctorIndex = state.reviews.findIndex(
        (item) => item.name === doctorName
      );

      if (doctorIndex !== -1) {
        state.reviews[doctorIndex].review.push(action.payload);
      } else {
        state.reviews.push({
          name: doctorName,
          review: [action.payload],
        });
      }
    },
  },
});

export const { addReview } = reviewSlice.actions;
export default reviewSlice.reducer;
