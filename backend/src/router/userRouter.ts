import express from "express"
import { AppDataSource } from "../config/data-source"
import { User } from "../entity/User"
const router=express.Router()
const userRepo=AppDataSource.getRepository(User)

router.get("/data",async(req,res)=>{
    const userData=await userRepo.findOne({
        where:{
            email:"sk@gmail.com"
        }
    })
    return res.status(200).json({
        success:true,
        message:"data fetched successfully",
        data:userData
    })
})




export default router