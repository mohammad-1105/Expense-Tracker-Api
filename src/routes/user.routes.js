import { Router } from "express";
import {
    changePassword,
    deleteUserAccount,
  getUserProfile,
  loginUser,
  logoutUser,
  refreshTokens,
  registerUser,
  updateUserFullName,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

export const router = Router();

// create users endpoints
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-tokens").post(verifyJWT, refreshTokens);
router.route("/profile").get(verifyJWT, getUserProfile);
router.route("/profile").patch(verifyJWT, updateUserFullName);
router.route("/delete").delete(verifyJWT, deleteUserAccount);
router.route("/change-password").patch(verifyJWT, changePassword);