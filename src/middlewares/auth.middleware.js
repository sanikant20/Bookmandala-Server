import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"

export const verifyToken = async (req, res, next) => {
    try {
        const token = req?.cookies.refreshToken || req.headers("Authorization").replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, "Unauthorized")
        }

        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
        if (!decoded) {
            throw new ApiError(401, "Unauthorized token")
        }
        const user = await User.findById(decoded._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(404, "User not found")
        }

        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid token")
    }
}