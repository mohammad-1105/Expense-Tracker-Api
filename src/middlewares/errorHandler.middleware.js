import { ApiError } from "../utils/ApiError.js";

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  // If the error is an instance of ApiError, use its properties
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
    });
  } else {
    // Log the unexpected error for debugging
    console.error(err);

    // For other errors, send a generic error response
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: [],
    });
  }
};

export default errorHandler;