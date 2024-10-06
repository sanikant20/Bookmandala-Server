import mongoose, { Schema } from "mongoose";

const rateAndReviewSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        rateAndReview: [
            {
                bookId: {
                    type: Schema.Types.ObjectId,
                    ref: "Book",
                    required: true
                },
                rate: {
                    type: Number,
                    min: 1,
                    max: 5
                },
                review: {
                    type: String,
                }
            }
        ],
    },
    {
        timestamps: true
    }
);

export const RateAndReview = mongoose.model("RateAndReview", rateAndReviewSchema);
