import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendResetEmail, sendVerificationEmail } from "../utility/mailer.js";
import bcrypt from 'bcrypt'

export const verifyEmail = async (req, res) => {
  const { token } = req.query; // Step 1: Get token from URL query

  try {
    // Step 2: Find user by token and check expiration
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }, // Ensure token hasn’t expired
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification link." });
    }

    // Step 3: Mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined; // Remove token from DB
    user.verificationTokenExpires = undefined;

    await user.save(); // Step 4: Save changes

    // Step 5: Send success response (can be JSON or redirect to login page)
    res
      .status(200)
      .json({ message: "Email verified successfully. Please log in now." });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  const { uid, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ username: uid }, { email: uid }],
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: "Email not verified. Please verify your email." });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, { httpOnly: true });
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const registerUser = async (req, res) => {
  const { email, password, name, username } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }
    // Step 2: Generate a verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Step 3: Create user record in DB, but not verified yet
    const user = new User({
      email,
      username,
      password, // Will be hashed automatically by User model's pre-save hook
      name,
      authProvider: "email",
      isVerified: false,
      verificationToken: verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24-hour expiry
      verificationSentAt: Date.now(),
    });

    // Step 4: Save the user in database
    await user.save();

    // Step 5: Send a verification email
    await sendVerificationEmail(email, verificationToken);
    res
      .status(201)
      .json({
        message:
          "Registration successful. Check your email to verify your account.",
      });

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message || "Server error" });
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
 try {
   const {email} =  req.body;
   const user = await User.findOne({email});
   if (!user) {
     return res.status(404).json({ message: "User not found" });
   }
  
   const rawToken = crypto.randomBytes(32).toString("hex");
   const hashedToken = crypto
     .createHash("sha256")
     .update(rawToken)
     .digest("hex");
   user.resetPasswordToken = hashedToken;
   user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
   await user.save();
   // Send email with reset link (not implemented)

   const resetUrl = `http://localhost:3000/api/auth/reset-password?token=${rawToken}`;
   
   await sendResetEmail(user.email, resetUrl);
   
   res.status(200).json({ message: "Password reset link sent to email." });
 } catch (error) {
   console.error("Password reset error:", error);
   res.status(500).json({ message: error.message });
 }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired token" });

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successful. Please log in." });
};

export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password changed successfully" });
};
