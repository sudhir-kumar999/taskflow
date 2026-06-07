import "reflect-metadata";
import dotenv from "dotenv";
const env = process.env.NODE_ENV || "local";
console.log(env);
dotenv.config();
import { DataSource } from "typeorm";
import { Task } from "../entity/Tasks";
import { User } from "../entity/User";
import { Token } from "../entity/Token";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [User, Task, Token],
  migrations: [__dirname + "/../migration/*.ts"],
});
