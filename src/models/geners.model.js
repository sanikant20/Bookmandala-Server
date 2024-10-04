import mongoose, { Schema } from "mongoose";

const genersSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    books: [
      {
        type: Schema.Types.ObjectId,
        ref: "Book",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    }
  },

  {
    timestamps: true,
  }
);

export const Geners = mongoose.model("Geners", genersSchema);
