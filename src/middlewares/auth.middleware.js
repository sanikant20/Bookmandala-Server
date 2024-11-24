import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken || req.headers["authorization"]?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "User is not logged in.",
        error: "Unauthorized"
      });
    }

    // Verify the token using the refresh token secret
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the user based on the decoded token's _id
    const user = await User.findById(decodedToken._id).select("-password -accessToken");

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
        error: "Unauthorized"
      })
    }

    // Attach user to request object for further use
    req.user = user;
    // Proceed to the next middleware
    next();
  } catch (error) {
    // Differentiate between token expiration and other errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired.",
        error: "Unauthorized"
      })
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
        error: "Unauthorized"
      })
    } else {
      return res.status(500).json({
        success: false,
        message: "Something went wrong while verifying token.",
        error: "Internal server error"
      })
    }
  }
};
