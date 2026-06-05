import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    ManyToOne,
} from "typeorm"
import { User } from "./User"
export enum status {
    ALL="ALL",
    ACTIVE="ACTIVE",
    COMPLETED="COMPLETED"
}
export enum priority {
    LOW="LOW",
    MEDIUM="MEDIUM",
    HIGH="HIGH"
}

@Entity("tasks")
export class Task{
    @PrimaryGeneratedColumn("uuid")
    id!:string

    @Column()
    title!:string

    @Column({nullable:true})
    description!:string

     @Column({
        type: "enum",
        enum: priority,
        default: priority.MEDIUM,
    })
    priority!:priority

    @Column({
        type: "enum",
        enum: status,
        default: status.ACTIVE,
    })
    status!:status

    @Column({
        type:'timestamp',
        nullable:true
    })
    dueDate!:Date
    
    @CreateDateColumn()
    createdAt!: Date;

    @Column({default:false})
    isOverdue!:boolean

    @ManyToOne(() => User, (user) => user.tasks, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({name:"user_id"})
    user!:User

   @Column()
   user_id!:string


}