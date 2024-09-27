import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const checkServer = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {}, "Server is up and running."))
})
