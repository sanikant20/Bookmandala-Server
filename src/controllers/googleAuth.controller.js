import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Auth Load 
const loadAuth = asyncHandler(async (req, res) => {
  try {
    res.redirect("/auth/google")
    return res.status(200).json(new ApiResponse(200, {}, "Google Auth loaded successfully."))
  } catch (error) {
    return res.status(error.statusCode || 500).json(new ApiError(500, error.message));
  }
})


// Auth Callback Success
const successGoogleLogin = asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      throw new ApiError(400, "User not found.")
    }

    // Get User Details
    const { displayName, email, picture } = req.user;
    if (!(email || picture || displayName)) {
      throw new ApiError(400, "email and picture are required.")
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      throw new ApiError(400, `User already existed with ${email}.`)
    }

    // Create User if not exists and save 
    const user = new User({
      fullname: displayName,
      email: email,
      avatar: picture,
      password: "123456" // Default Password 
    });
    user.save()
      .then(user => { console.log("User created: ", user); })
      .catch(err => { console.log("Error creating user: ", err); });

    // Send Response 
    return res.status(200).json(new ApiResponse(200, user, "User created successfully."))
  } catch (error) {
    return res.status(error.statusCode || 500).json(new ApiError(500, error.message));
  }
})


// Auth Callback Failure
const failureGoogleLogin = asyncHandler(async (req, res) => {
  try {
    return res.status(400).json(new ApiResponse(400, {}, "Failed to login. Please try again."))
  } catch (error) {
    return res.status(error.statusCode || 500).json(new ApiError(500, error.message));
  }
})


// Export Controllers
export {
  loadAuth,
  successGoogleLogin,
  failureGoogleLogin
}