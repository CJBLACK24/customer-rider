// server/app/controller/auth.controller.ts
import { Request, Response } from "express";
import User from "../modals/User";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/token";
import { sendResetEmail } from "../utils/sendEmail";
import type { HydratedDocument } from "mongoose";
import type { UserProps as IUser } from "../types";


function make6DigitPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, password, name, avatar, phone } = req.body;

  // ensure phone is provided
  if (!phone) {
    res.status(400).json({ success: false, msg: "Phone number is required" });
    return;
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ success: false, msg: "User already exists" });
      return;
    }

    // Create new user
    user = new User({
      email,
      phone,
      password,
      name,
      avatar: avatar || "",
    });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user (with hashed password + OTP fields)
    await user.save();

    // Generate auth JWT
    const token = generateToken(user);

    // Respond with token (kept as-is)
    res.json({
      success: true,
      token,
      msg: "Registered successfully. OTP sent to phone.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: "Server Error" });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, phone, identifier, password } = req.body;

  const id = (identifier ?? email ?? phone ?? "").trim();
  if (!id || !password) {
    res
      .status(400)
      .json({ success: false, msg: "Email/phone and password are required" });
    return;
  }

  try {
    const query = id.includes("@")
      ? { email: id.toLowerCase() }
      : { phone: id };

    const user = await User.findOne(query);
    if (!user) {
      res.status(400).json({ success: false, msg: "Invalid Credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, msg: "Invalid Credentials" });
      return;
    }

    const token = generateToken(user.toObject ? user.toObject() : user);
    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: "Server Error" });
  }
};

/**
 * POST /auth/forgot-password
 */
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, msg: "No user with that email" });
      return;
    }

    // Generate 6-digit PIN and expiry (1 hour)
    const pin = make6DigitPin();
    user.resetPasswordToken = pin;
    user.resetPasswordExpires = new Date(Date.now() + 3600 * 1000);
    await user.save();

    // Send PIN via email
    await sendResetEmail(email, pin);

    // Return PIN in response
    res.json({ success: true, msg: "Password reset PIN sent", pin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: "Server Error" });
  }
};

/**
 * POST /auth/reset-password/:token
 * Now `token` is the 6-digit PIN.
 */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      res
        .status(400)
        .json({ success: false, msg: "PIN is invalid or expired" });
      return;
    }

    // Hash & save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Auto-login with new JWT
    const newJwt = generateToken(user);
    res.json({ success: true, token: newJwt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: "Server Error" });
  }
};

