import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import UserModel from "../models/user.model.js";
import predefinedCategories from "../models/category.model.js";

const getCategories = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user?._id);
  if (!user) {
    throw new ApiError(403, "unauthorized access, Login first");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Fetched categories successfully",
        predefinedCategories
      )
    );
});

export { getCategories };
