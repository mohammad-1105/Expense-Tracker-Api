import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import UserModel from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // Extract token from cookies or Authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Access token is missing");
    }

    // Verify token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decodedToken || !decodedToken._id) {
      throw new ApiError(
        401,
        "Unauthorized request, token may be invalid or expired"
      );
    }

    // Fetch user by ID from decoded token
    const user = await UserModel.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // Attach user to request object
    req.user = user;

    // Proceed to next middleware
    next();
  } catch (error) {
    console.error("Failed to verifyJWT :: ", error.message || error);
    throw new ApiError(401, "Unauthorized request, failed to verify token");
  }
});
