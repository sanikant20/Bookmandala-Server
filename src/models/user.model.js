import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        fullname: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowarcase: true,
            trim: true
        },
        phoneNumber: {
            type: Number,
            length: 10
        },
        avatar: {
            type: String,
            required: true
        },
        dob: {
            type: Date,
            required: true
        },
        gender: {
            type: String,
            required: true,
            enum: ["Male", "Female", "Others"]
        },
        password: {
            type: String,
            required: true
        },
        shippingAddress: {
            type: String
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

// Apply middleware before saving password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    // 
    this.password = await bcrypt.hash(this.password, 10)
});

// Compare Password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
};

export const User = mongoose.model("User", userSchema)