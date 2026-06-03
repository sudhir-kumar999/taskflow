import "reflect-metadata";
import dotenv from "dotenv";
const env = process.env.NODE_ENV || "local";
console.log(env);
dotenv.config();
import { DataSource } from "typeorm";
import { Task } from "../entity/Tasks";
import { User } from "../entity/User";

console.log(process.env.DB_PASSWORD);

export const AppDataSource = new DataSource({
  type: "postgres",
  // ...(process.env.DATABASE_URL)?{
  //   url:process.env.DATABASE_URL,
  //   ssl:{
  //   rejectUnauthorized:false
  // },
  // }:
  // {
  // host: process.env.DB_HOST,
  // port: Number(process.env.DB_PORT),
  // username: process.env.DB_USERNAME,
  // password: process.env.DB_PASSWORD,
  url:process.env.DATABASE_URL,
  // database: process.env.DB_DATABASE,
  // synchronize: true,
  // logging: false,
  // ssl:{
  //   rejectUnauthorized:false
  // },
  // },
  entities: [User, Task],
    migrations: [__dirname + "/../migration/*.ts"],
});
