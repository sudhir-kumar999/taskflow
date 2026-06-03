import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from "typeorm";

import { Task } from "./Tasks";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({
    unique: true,
  })
  email!: string;

  @Column()
  password!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ default: false })
  isVerified!: boolean;

  @OneToMany(() => Task, (task) => task.user)
  tasks!: Task[];


}
