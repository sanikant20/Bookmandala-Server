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
  },
  {
    timestamps: true,
  }
);

export const Geners = mongoose.model("Geners", genersSchema);
