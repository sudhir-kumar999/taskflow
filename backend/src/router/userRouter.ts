import express, { Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import {
  getMe,
  loginUser,
  logoutUser,
  newToken,
  registerUser,
  RequestWithUserRole,
  resendLink,
  verifyEmail,
} from "../controller/userController";
import { checkLogin } from "../middleware/checkLogin";
const router = express.Router();

router.post("/data", registerUser);
router.get("/verify-email/:id/:token", verifyEmail);
router.post("/link", resendLink);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/me", checkLogin, getMe);
router.post("/new-token",newToken)

export default router;
