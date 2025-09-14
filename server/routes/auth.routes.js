import express from "express";
import { changePassword, forgotPassword, loginUser, logoutUser, registerUser, resetPassword, verifyEmail } from "../controllers/auth.controller.js";
import isAuth from "../middleware/auth.middleware.js";
import passport from "passport";
 

const router = express.Router();

// verify email
router.get("/verify-email", verifyEmail);

//login
router.post("/login", loginUser);
 
//register
router.post("/register", registerUser);

//logout
router.get("/logout", logoutUser);

//forgot password
router.post("/forgot-password", forgotPassword);

//reset password
router.post("/reset-password", resetPassword);

//change password only when authenticated
router.post("/change-password", isAuth, changePassword);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Here we receive the user object and token from GoogleStrategy callback
    // Example: send JWT back in cookie or as JSON
    res.cookie("token", req.user.token, { httpOnly: true });
    res.redirect("http://localhost:3001"); // redirect frontend after login
  }
);



export default router;