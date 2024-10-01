import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const checkServer = asyncHandler(async (req, res) => {
    try {
        return res.status(200).json(new ApiResponse(200, {}, "Server is up and running."))
    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiResponse(500, error.message));
    }
})
