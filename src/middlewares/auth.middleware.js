import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken || req.headers["authorization"]?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
    }

    // Verify the token using the refresh token secret
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the user based on the decoded token's _id
    const user = await User.findById(decodedToken._id).select("-password -accessToken");

    // Check if user exists
    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    // Attach user to request object for further use
    req.user = user;

    // Proceed to the next middleware
    next();
  } catch (error) {
    // Differentiate between token expiration and other errors
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token has expired.");
    } else if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "User is not logged in. ");
    } else {
      throw new ApiError(401, error.message || "Authentication failed.");
    }
  }
};
