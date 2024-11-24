import { asyncHandler } from "../utils/asyncHandler.js"

export const checkServer = asyncHandler(async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: "Server is up and running.",
            error: null
        })
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Something went wrong while checking server.",
            error: "Internal server error"
        });
    }
})
