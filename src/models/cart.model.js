import mongoose, {Schema} from "mongoose";

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    books: [
        {
            bookId: {
                type: Schema.Types.ObjectId,
                ref: "Book",
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }
    ],
    total: {
        type: Number
    }
});

export const Cart = mongoose.model("Cart", cartSchema);
