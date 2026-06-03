import express from "express"
import { AppDataSource } from "../config/data-source"
import { User } from "../entity/User"
import { registerUser, verifyEmail } from "../controller/userController"
const router=express.Router()
const userRepo=AppDataSource.getRepository(User)

router.post("/data",registerUser)
router.get("/verify-email/:id/:token",verifyEmail)
    // async(req,res)=>{
    // const userData=await userRepo.findOne({
    //     where:{
    //         email:"sk@gmail.com"
    //     }
    // })
    // console.log(userData)
    // return res.status(200).json({
    //     success:true,
    //     message:"data fetched successfully",
    //     data:userData
    // })
// })




export default router