import mongoose, { Schema } from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, "username is required"],
    unique: [true, "usename must be unique"],
    trim: true, // Remove leading and trailing whitespace
    minlength: 3,
    maxlength: 20,
    match: [/^[a-zA-Z][a-zA-Z0-9_]{2,29}$/, "Username is invalid"],
    index: true, // Index the field for faster queries
  },

  fullName: {
    type: String,
    required: [true, "Full name is required"],
    minlength: 3,
    maxlength: 20,
    match: [/^[a-zA-Z][a-zA-Z ]{2,49}$/, "Full name is invalid"],
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "Email must be unique"],
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Email is invalid",
    ],
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 8,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },

  refreshAccessToken: String,
  forgetPasswordToken: String,
  forgetPasswordTokenExpiry: Date,
  emailVerificationToken: String,
  emailVerificationTokenExpiry: Date,

}, {timestamps: true});

// save password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcryptjs.hash(this.password, 10);
  next();
});

// method to check password
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// method to generate access and refresh access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_SECRET_EXPIRY,
  });
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_SECRET_EXPIRY,
  });
};

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
