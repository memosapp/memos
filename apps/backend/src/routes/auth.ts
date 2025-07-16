import express, { Router } from "express";
import {
  signIn,
  signUp,
  signOut,
  getSession,
  getUser,
} from "../controllers/authController";

const router: Router = express.Router();

// Email authentication routes
router.post("/signin", signIn);
router.post("/signup", signUp);
router.post("/signout", signOut);
router.get("/session", getSession);
router.get("/user", getUser);

// TODO: Add phone authentication routes
// router.post('/signin-otp', signInWithOtp);
// router.post('/verify-otp', verifyOtp);

// TODO: Add OAuth routes for Google, etc.
// router.get('/oauth/:provider', handleOAuthSignIn);

export default router;
