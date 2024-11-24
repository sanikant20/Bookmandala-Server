import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


// Generate AccessToken
const generateAccessTokens = async (userId) => {
    const user = await User.findById(userId)

    const accessToken = await user.generateAccessToken()

    // Save Access Token
    user.accessToken = accessToken
    await user.save({ validateBeforeSave: false })

    return { accessToken }
}

// 
const options = {
    httpOnly: true,
    secure: true,
    // sameSite: "Strict",
    // maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expires in 7 days,
    // path: "/",
    // domain: process.env.CORS_ORIGIN,
}

// Register User Controller
const register = asyncHandler(async (req, res) => {
    const { fullname, email, phoneNumber, dob, gender, password } = req.body

    if (
        [fullname, email, phoneNumber, dob, gender, password].some((field) => field?.trim === "")
    ) {
        return res.status(400).json({
            success: false,
            message: "All fields are required.",
            error: "Bad request"
        })
    }

    const existedUser = await User.findOne(
        {
            $or: [{ email }]
        }
    )
    if (existedUser) {
        return res.status(409).json({
            success: false,
            message: "User already exists.",
            error: "Conflict"
        })
    }

    const avatarFiles = req.files?.avatar;
    if (!avatarFiles || avatarFiles.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Avatar is required for registering.",
            error: "Bad request"
        })
    }

    const avatarLocalFilePath = avatarFiles[0].path;
    if (!avatarLocalFilePath) {
        return res.status(400).json({
            success: false,
            message: "Avatar file path is required for registering.",
            error: "Bad request"
        })
    }

    const cloudAvatar = await uploadOnCloudinary(avatarLocalFilePath)
    if (!cloudAvatar) {
        return res.status(400).json({
            success: false,
            message: "Failed to upload avatar on cloudinary.",
            error: "Bad request"
        })
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
        return res.status(500).json({
            success: false,
            message: "Something went wrong while registering.",
            error: "Internal server error"
        })
    }

    return res.status(200).json(new ApiResponse(200, userRegister, "User register successfully."))

})

// Login User Controller
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!(email || password)) {
        return res.status(400).json({
            success: false,
            message: "All fields are required.",
            error: "Bad request"
        })
    }

    const user = await User.findOne({ email })
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found.",
            error: "Not found"
        })
    }

    const isValidPassword = await user.isPasswordCorrect(password)
    if (!isValidPassword) {
        return res.status(404).json({
            success: false,
            message: "Invalid password.",
            error: "Not found"
        })
    }

    // Generate refresh token for the user
    const { accessToken } = await generateAccessTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -accessToken")

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, "accessToken": accessToken }, "Login successfully"))
})

// logout Controller
const logout = asyncHandler(async (req, res) => {
    try {
        const { _id: userId } = req.user
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User is not logged in.",
                error: "Bad request"
            })
        }

        const user = await User.findByIdAndUpdate(userId,
            {
                $unset: {
                    accessToken: 1
                }
            },
            {
                new: true
            }
        )
        if (!user) {
            return res.status(500).json({
                success: false,
                message: "Something went wrong while logging out.",
                error: "Internal server error"
            })
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .json(new ApiResponse(200, {}, "Logout successfully"))

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while logging out.",
            error: "Internal server error"
        })
    }
})

// Get Current User Controller
const getCurrentUser = asyncHandler(async (req, res) => {
    try {
        const { _id: userId } = req.user
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User is not logged in.",
                error: "Bad request"
            })
        }

        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
                error: "Not found"
            })
        }

        return res.status(200).json(new ApiResponse(200, user, "User retrieved successfully."))

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Something went wrong while retrieving user.",
            error: "Internal server error"
        });
    }
})

// Edit User Data Controller
const editUserData = asyncHandler(async (req, res) => {
    try {
        const { _id: userId } = req.user
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User is not logged in.",
                error: "Bad request"
            })
        }

        const { fullname, phoneNumber, dob, gender, shippingAddress } = req.body

        const user = await User.findByIdAndUpdate(userId,
            {
                $set: {
                    fullname: fullname,
                    phoneNumber: phoneNumber,
                    dob: dob,
                    gender: gender,
                    shippingAddress: shippingAddress
                }
            },
            {
                new: true
            }
        ).select("-password -email")
        if (!user) {
            return res.status(500).json({
                success: false,
                message: "Something went wrong while updating user data.",
                error: "Internal server error"
            })
        }

        return res.status(200).json(new ApiResponse(200, user, "User data updated successfully."))
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Something went wrong while updating user data.",
            error: "Internal server error"});
    }
})

// Update Avatar Controller
const updateAvatar = asyncHandler(async (req, res) => {
    try {
        const { _id: userId } = req.user
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User is not logged in.",
                error: "Bad request"
            })
        }

        const avatarLocalFilepath = await req.file?.path
        if (!avatarLocalFilepath) {
            return res.status(400).json({
                success: false,
                message: "Avatar is required.",
                error: "Bad request"
            })
        }

        const cloudAvatar = await uploadOnCloudinary(avatarLocalFilepath)
        if (!cloudAvatar) {
            return res.status(400).json({
                success: false,
                message: "Something went wrong while uploading avatar.",
                error: "Bad request"
            })
        }

        const user = await User.findByIdAndUpdate(userId,
            {
                $set: {
                    avatar: cloudAvatar.url
                }
            },
            {
                new: true
            }
        )
        if (!user) {
            return res.status(500).json({
                success: false,
                message: "Something went wrong while updating avatar.",
                error: "Internal server error"
            })
        }

        return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully."))
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Something went wrong while updating avatar.",
            error: "Internal server error"
        });
    }
})

// Change Password Controller
const changePassword = asyncHandler(async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmNewPassword } = req.body
        if (!(oldPassword && newPassword && confirmNewPassword)) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
                error: "Bad request"
            })
        }
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match.",
                error: "Bad request"
            })
        }

        const { _id: userId } = req.user
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User is not logged in.",
                error: "Bad request"
            })
        }


        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
                error: "Not found"
            })
        }

        const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword)
        if (!isOldPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Old password is incorrect.",
                error: "Bad request"
            })
        }

        user.password = newPassword
        await user.save({ validateBeforeSave: false })

        return res.status(200).json(new ApiResponse(200, user, "Password updated successfully."))
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Something went wrong while changing password.",
            error: "Internal server error"
        });
    }
})


// Export Controllers
export {
    register,
    login,
    logout,
    getCurrentUser,
    editUserData,
    updateAvatar,
    changePassword
}