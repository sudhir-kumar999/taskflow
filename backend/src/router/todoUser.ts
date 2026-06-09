import express from "express";
import {
  deleteTodo,
  filterPriority,
  filterTodo,
  getAllTodo,
  pinMessage,
  postTodo,
  updateTodo,
} from "../controller/todoController";
import { checkLogin } from "../middleware/checkLogin";
const todoRoute = express.Router();

todoRoute.get("/get-todo", checkLogin, getAllTodo);
todoRoute.post("/post-todo", checkLogin, postTodo);
todoRoute.patch("/update-todo/:taskId", checkLogin, updateTodo);
todoRoute.delete("/delete-todo/:todoId", checkLogin, deleteTodo);
todoRoute.get("/filter-todo/:filId", checkLogin, filterTodo);
todoRoute.get("/filter-prior/:filId", checkLogin, filterPriority);
todoRoute.patch("/toggle-pin/:todoId", checkLogin, pinMessage);

export default todoRoute;
