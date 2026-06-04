import express from "express"
import { getAllTodo, postTodo } from "../controller/todoController"
import { checkLogin } from "../middleware/checkLogin"
const todoRoute=express.Router()

todoRoute.get("/get-todos",checkLogin,getAllTodo)
todoRoute.post("/post-todo",checkLogin,postTodo)

export default todoRoute