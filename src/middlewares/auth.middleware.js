import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"

export const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookie?.accessToken || req.headers["Authorization"]?.replace("Bearer ", "")
        if (!token) {
            res.status(401).json({ message: "Unauthorized" });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken._id).select("-password -accessToken")
        if (!user) {
            throw new ApiError(404, "Invalid ! user not found")
        }

        req.user = user
        next()
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
}
