import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Auth Load 
const loadAuth = asyncHandler(async (req, res) => {
  res.redirect("/auth/google")
})


// Auth Callback Success
const successGoogleLogin = asyncHandler(async (req, res) => {
  // Get User Details from Google
  const { displayName, email, picture } = req.user;

  // Check if user already exists
  let user = await User.findOne({ email: email });
  if (!user) {
    // Create new user if not exists
    user = new User({
      fullname: displayName,
      email: email,
      avatar: picture,
      password: null 
    });

    try {
      await user.save();
      console.log("User created: ", user);
    } catch (err) {
      console.error("Error creating user: ", err);
      return res.status(500).json({
        success: false,
        message: "Failed to create user. Please try again.",
        error: "Internal server error",
      });
    }
  }

  // Send Response
  return res.status(200).json(new ApiResponse(200, user, "User logged in successfully"));
});



// Auth Callback Failure
const failureGoogleLogin = asyncHandler(async (req, res) => {
  return res.status(400).json(new ApiResponse(400, {}, "Failed to login. Please try again."))
})


// Logout Controller
const logout = asyncHandler(async (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json(new ApiResponse(500, {}, "Failed to logout"));
    }
    res
      .status(200)
      .clearCookie("accessToken", { httpOnly: true, secure: true }) // define options if necessary
      .json(new ApiResponse(200, {}, "Logout successfully"));
  });
});


// Export Controllers
export {
  loadAuth,
  successGoogleLogin,
  failureGoogleLogin,
  logout
}