import express from "express"
import type { Request, Response } from "express";
import { AppDataSource } from "./src/config/data-source";
import router from "./src/router/userRouter";
import dotenv from "dotenv";
dotenv.config()
const app=express()
app.use(express.json())
// app.use("/",(req:Request,res:Response)=>{
//     res.send("hello from node")
// })
app.use("/user",router)


const PORT=process.env.PORT
AppDataSource.initialize()
  .then(() => {
    console.log("Database Connected");

    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("DB ERROR");
    console.log(err);
  });

