import express from "express"
import { AppDataSource } from "./src/config/data-source";
import router from "./src/router/userRouter";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import todoRoute from "./src/router/todoUser";
dotenv.config()
const app=express()
app.use(express.json())
app.use(cookieParser())

app.use("/user",router)
app.use("/api/users",router)
app.use("/api/resend",router)
app.use("/api/auth",router)
app.use("/todo",todoRoute)


const PORT=process.env.PORT
AppDataSource.initialize()
  .then(() => {
    console.log("Database Connected");

    app.listen(PORT, () => {
      console.log(`server is running at ${process.env.NODE_ENV} on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("DB ERROR");
    console.log(err);
  });

