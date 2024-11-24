import mongoose, { Schema } from "mongoose";

const currencySchema = new Schema({
    bookId: {
        type: Schema.Types.ObjectId,
        ref: "Book",
        required: true
    },
    currencyType: {
        type: String,
        required: true,
        enum: ["NPR", "USD"],
        default: "NPR"
    },
    priceNPR: {
        type: Number,
        required: true
    },
    priceUSD: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

export const Currency = mongoose.model('Currency', currencySchema);
