import { Request, Response } from "express";

import { AppDataSource } from "../config/data-source";
import { priority, status, Task } from "../entity/Tasks";
import { User } from "../entity/User";
const taskRepo = AppDataSource.getRepository(Task);
const userRepo = AppDataSource.getRepository(User);

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

interface updateData {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: Date;
}
const contentrgx = /^[A-Za-z0-9 ]+$/;

export const getAllTodo = async (req: RequestWithUserRole, res: Response) => {
  try {
    const { id } = req.user as decode;
    if (!id) {
      return res.status(401).json({
        success: false,
        message: "you are not logged in",
      });
    }
    const data = await taskRepo.find({
      where: {
        user_id: id,
        isDelete: false,
      },
      order: {
        isPinned: "DESC",
        createdAt: "DESC",
      },
    });
    if (data.length == 0) {
      return res.status(200).json({
        success: true,
        message: "no data found",
      });
    }
    const currDate = new Date();
    data.forEach(async (todo) => {
      if (
        (todo.dueDate && new Date(todo.dueDate)) < currDate &&
        !todo.isOverdue
      ) {
        todo.isOverdue = true;
        await taskRepo.save(todo);
      }
    });
    return res.status(200).json({
      success: true,
      message: "data fetched successfully",
      data: data,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: error.message || "internal server error",
      });
    }
  }
};

export const postTodo = async (req: RequestWithUserRole, res: Response) => {
  try {
    const data = req.body;
    let { title,  priority, dueDate } = data;
    const {description}=data;
    const { id } = req.user as decode;
    if (!id) {
      return res.status(401).json({
        success: false,
        message: "you are not logged in",
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "title mandatory",
      });
    }
    title = title.trim();

    if (title.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "title must be of at least 5 letter",
      });
    }
    if (!priority) {
      return res.status(400).json({
        success: false,
        message: "priority are mandatory",
      });
    }
    priority = priority.trim();
    if (priority != "HIGH" && priority != "LOW" && priority != "MEDIUM") {
      return res.status(400).json({
        success: false,
        message: "Priority can only be HIGH,LOW. and MEDIUM",
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: "Provide date ",
      });
    }

    if (dueDate) {
      const parseDate = new Date(dueDate);
      if (isNaN(parseDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Provide date in format YYY-MM-DD",
        });
      }

      if (parseDate < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Due date cannot be previous date",
        });
      }
      dueDate = parseDate;
    }

    const taskData = {
      title,
      user_id: id,
      description,
      priority,
      dueDate,
    };
    await taskRepo.save(taskData);
    return res.status(201).json({
      success: true,
      message: "todo created successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: error.message || "internal server error",
      });
    }
  }
};

export const updateTodo = async (req: RequestWithUserRole, res: Response) => {
  try {
    const bodyData: updateData = req.body;
    let { title, description , dueDate } = bodyData;
    const { status,priority}=bodyData;
    const id = req.params.taskId;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "you are not login",
      });
    }
    const task = await taskRepo.findOne({
      where: {
        id: id as string,
      },
    });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "no task found with given id",
      });
    }
    const user = await userRepo.findOne({
      where: {
        id: userId,
      },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "no user found login",
      });
    }
    if (user.id != task.user_id) {
      return res.status(403).json({
        success: false,
        message: "you are not permission to update",
      });
    }
    const updatedTask: Partial<Task> = {};
    if (typeof title != "string") {
      return res.status(400).json({
        success: false,
        message: "title must be string",
      });
    }
    if (title) {
      title = title.trim();
      if (title.length <= 5) {
        return res.status(400).json({
          success: false,
          message: "title must be of at least 5 letter",
        });
      }
      if (!contentrgx.test(title)) {
        return res.status(400).json({
          success: false,
          message: "title must be mix of string and number",
        });
      }
      updatedTask.title = title;
    }
    if (description) {
      description = description?.trim();
      if (description.length <= 5) {
        return res.status(400).json({
          success: false,
          message: "description must be of at least 5 letter",
        });
      }
      updatedTask.description = description;
    }
    if (priority) {
      if (priority != "HIGH" && priority != "LOW" && priority != "MEDIUM") {
        return res.status(400).json({
          success: false,
          message: "Priority can only be HIGH,LOW and MEDIUM",
        });
      }
      updatedTask.priority = priority as priority;
    }
    if (status) {
      if (status != "COMPLETED" && status != "ACTIVE") {
        return res.status(400).json({
          success: false,
          message: "Status can only be ACTIVE and COMPLETED",
        });
      }
      updatedTask.status = status as status;
    }
    if (dueDate) {
      const parseDate = new Date(dueDate);
      if (isNaN(parseDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Provide date in format YYY-MM-DD",
        });
      }
      if (parseDate < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Due date cannot be previous date",
        });
      }
      dueDate = parseDate;
      updatedTask.dueDate = dueDate;
    }
    const finalTask = taskRepo.merge(task, updatedTask);
    const result = await taskRepo.save(finalTask);
    return res.status(200).json({
      success: true,
      message: "data updated success",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: error.message || "internal server error",
      });
    }
  }
};

export const deleteTodo = async (req: RequestWithUserRole, res: Response) => {
  try {
    const { id } = req.user as decode;
    if (!id) {
      return res.status(401).json({
        success: false,
        message: "ypu are not login",
      });
    }
    const todo_id = req.params.todoId;
    if (!todo_id) {
      return res.status(400).json({
        success: false,
        message: "No id found to delete",
      });
    }
    const todos = await taskRepo.findOne({
      where: {
        id: todo_id as string,
      },
    });
    if (!todos) {
      return res.status(200).json({
        success: true,
        message: "No todo found to delete",
      });
    }

    if (id !== todos.user_id) {
      return res.status(403).json({
        success: false,
        message: "you are not allowed to delete",
      });
    }
    todos.isDelete = true;
    await taskRepo.save(todos);
    return res.status(200).json({
      success: true,
      message: "todo deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: error.message || "internal server error",
      });
    }
  }
};

export const filterTodo = async (req: RequestWithUserRole, res: Response) => {
  try {
    const filter = req.params.filId;
    if (
      !filter ||
      (filter != "ACTIVE" && filter != "COMPLETED" && filter != "ALL")
    ) {
      return res.status(404).json({
        success: false,
        message: "wrong filter option",
      });
    }
    const { id } = req.user as decode;
    if (!id) {
      return res.status(403).json({
        success: false,
        message: "no id found login plz",
      });
    }
    if (filter == "ALL") {
      const todos = await taskRepo.find({
        where: {
          user_id: id,
        },
      });
      return res.status(200).json({
        success: true,
        message: "data fetched",
        data: todos,
      });
    }
    const todos = await taskRepo.find({
      where: {
        user_id: id,
        isDelete: false,
        status: filter as status,
      },
      order: {
        isPinned: "DESC",
        createdAt: "DESC",
      },
    });
    if (todos.length == 0) {
      return res.status(200).json({
        success: true,
        message: "No tasks find",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Todo fetched successfully",
      data: todos,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: error.message || "internal server error",
      });
    }
  }
};

export const filterPriority = async (
  req: RequestWithUserRole,
  res: Response,
) => {
  try {
    const filter = req.params.filId;
    if (
      !filter ||
      (filter != "LOW" && filter != "MEDIUM" && filter != "HIGH")
    ) {
      return res.status(404).json({
        success: false,
        message: "wrong filter option",
      });
    }
    const { id } = req.user as decode;
    if (!id) {
      return res.status(401).json({
        success: false,
        message: "ypu are not login",
      });
    }
    const todos = await taskRepo.find({
      where: {
        user_id: id,
        isDelete: false,
        priority: filter as priority,
      },
      order: {
        isPinned: "DESC",
        createdAt: "DESC",
      },
    });
    if (todos.length == 0) {
      return res.status(200).json({
        success: true,
        message: "No tasks find",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Todo fetched successfully",
      data: todos,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: error.message || "internal server error",
      });
    }
  }
};

export const pinMessage = async (req: RequestWithUserRole, res: Response) => {
  try {
    const { id } = req.user as decode;
    const userId = id;
    const todoId = req.params.todoId as string;
    if (!id) {
      return res.status(403).json({
        success: false,
        message: "no id found login plz",
      });
    }
    const todo = await taskRepo.findOne({
      where: {
        id: todoId as string,
        user_id: userId,
      },
    });
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "no to found",
      });
    }
    todo.isPinned = !todo.isPinned;
    await taskRepo.save(todo);
    return res.status(200).json({
      success: true,
      message: "toggle pin message",
      // data:todo
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: error.message || "internal server error",
      });
    }
  }
};
