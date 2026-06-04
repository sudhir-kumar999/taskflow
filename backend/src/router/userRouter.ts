import express from "express"
import { AppDataSource } from "../config/data-source"
import { User } from "../entity/User"
import { loginUser, logoutUser, registerUser, resendLink, verifyEmail } from "../controller/userController"
const router=express.Router()
const userRepo=AppDataSource.getRepository(User)

router.post("/data",registerUser)
router.get("/verify-email/:id/:token",verifyEmail)
router.post("/link",resendLink)
router.post("/login",loginUser)
router.get("/logout",logoutUser)




export default router