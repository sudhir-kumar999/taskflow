import { Request,Response } from "express"

import { AppDataSource } from "../config/data-source"
import { Task } from "../entity/Tasks"
const taskRepo=AppDataSource.getRepository(Task)

interface decode {
  name: string;
  email: string;
  id: string;
  iat: number;
  exp: number;
}
interface RequestWithUserRole extends Request {
  user?: decode;
}
interface bodyData{
    title:string
    description:string
    priority:'LOW'|'MEDIUM'|'HIGH'
}

export const getAllTodo=(req:Request,res:Response)=>{
    console.log("data")
}


export const postTodo=async(req:RequestWithUserRole,res:Response)=>{
    const data=req.body
    console.log(data)
    const {title,description,priority}=data
    const {id} =req.user as decode
    if(!id){
        return res.status(401).json({
            success:false,
            message:"you are not logged in"
        })
    }

    if(!title || !description ||!priority){
        return res.status(400).json({
            success:false,
            message:"All field are mandatory"
        })
    }

    if(priority!='HIGH' && priority!='LOW' && priority!='MEDIUM'){
        return res.status(400).json({
            success:false,
            message:"Priority can only be HIGH,LOW. and MEDIUM"
        })
    }

    const taskData={
        title,
        user_id:id,
        description,
        priority,
    }
    console.log(taskData)
    let result=await taskRepo.save(taskData)
    console.log(result)

}

