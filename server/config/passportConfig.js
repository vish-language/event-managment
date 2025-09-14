import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";

import dotenv from "dotenv";
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1️⃣ Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        // 2️⃣ If user doesn't exist, create a new user
        if (!user) {
          user = new User({
            email: profile.emails[0].value,
            name: profile.displayName,
            authProvider: "google",
            isVerified: true,
          });
          await user.save();
        }

        // 3️⃣ Generate JWT for our app
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });

        // 4️⃣ Return user info and token to route
        done(null, { user, token });
      } catch (error) {
        done(error, null);
      }
    }
  )
);


export default passport;
