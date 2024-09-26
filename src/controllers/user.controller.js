import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


// Generate RefreshToken
const generateRefreshTokens = async (userId) => {
    const user = await User.findById(userId)

    const refreshToken = await user.generateRefreshToken()

    // Save Refresh Token
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { refreshToken }
}

// 
const options = {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expires in 7 days,
    path: "/",
    domain: process.env.CORS_ORIGIN,
}

// Register User Controller
const register = asyncHandler(async (req, res) => {
    // take data from body
    // validate data
    // Check existing user
    // upload avatar
    // validate avatar
    // create new user
    // validate new user
    // return respose

    const { fullname, email, phoneNumber, dob, gender, password } = req.body

    if (
        [fullname, email, phoneNumber, dob, gender, password].some((field) => field?.trim === "")
    ) {
        throw new ApiError(404, "All fields are required.")
    }

    const existedUser = await User.findOne(
        {
            $or: [{ email }]
        }
    )
    if (existedUser) {
        throw new ApiError(409, `User already exist with ${email}. Please enter another email.`)
    }

    const avatarFiles = req.files?.avatar;
    if (!avatarFiles || avatarFiles.length === 0) {
        throw new ApiError(400, "Avatar is missing");
    }

    const avatarLocalFilePath = avatarFiles[0].path;
    if (!avatarLocalFilePath) {
        throw new ApiError(400, "Avatar file path is missing");
    }

    const cloudAvatar = await uploadOnCloudinary(avatarLocalFilePath)
    if (!cloudAvatar) {
        throw new ApiError(400, "Failed to upload avatar on cloudinary.")
    }

    const user = await User.create(
        {
            fullname,
            email: email.toLowerCase(),
            phoneNumber,
            dob,
            gender,
            password,
            avatar: cloudAvatar.url

        }
    )
    const userRegister = await User.findById(user._id).select("-password -refreshToken")
    if (!userRegister) {
        throw new ApiError(500, "Something went wrong while user register")
    }

    return res.status(200).json(new ApiResponse(200, userRegister, "User register successfully."))

})

// Login User Controller
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!(email || password)) {
        throw new ApiError(400, "email and password are required.")
    }

    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(404, "Invalid Email")
    }

    const isValidPassword = await user.isPasswordCorrect(password)
    if (!isValidPassword) {
        throw new ApiError(404, "Invalid Password")
    }

    // Generate refresh token for the user
    const { refreshToken } = await generateRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, "refreshToken": refreshToken }, "Login successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const { _id: userId } = req.user
    if (!userId) {
        throw new ApiError(400, "User is not logged in.")
    }

    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found.")
    }

    return res.status(200).json(new ApiResponse(200, user, "User retrieved successfully."))

})

export {
    register,
    login,
    getCurrentUser
}