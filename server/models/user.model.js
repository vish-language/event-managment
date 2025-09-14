import mongoose, { Mongoose } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    }, 
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ["email", "google"],
      required: true,
    },
    googleId: {
      type: String,
      default: null, // google users get filled here
    },
    // verification fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    }, // store hashed token
    verificationTokenExpires: {
      type: Date,
      default: null,
    },
    verificationSentAt: { type: Date, default: null }, // simple throttling info
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    contests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contest",
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
  }
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
const User = mongoose.model("User", userSchema);
export default User;
