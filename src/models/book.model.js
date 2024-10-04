import mongoose, { Schema } from "mongoose";

const bookSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        author: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        coverImage: {
            type: String,
            required: true
        },
        descriptionTitle: {
            type: String,
        },
        description: {
            type: String
        },
        pageCount: {
            type: Number,
            default: 0
        },
        weight: {
            type: String
        },
        ISBN: {
            type: Number
        },
        language: {
            type: String,
            enum: ["English", "Nepali", "Hindi"],
            default: "English"
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

export const Book = mongoose.model("Book", bookSchema)