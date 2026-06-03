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

@Entity("tokens")
export class Token{
    static findOne(arg0: { token: string | string[]; where: { id: string | string[] } }) {
      throw new Error("Method not implemented.")
    }
    @PrimaryGeneratedColumn('uuid')
    id!:string

    @Column()
    tokens!:string

    @Column({name:'user_id'})
    user_id!:string

    @ManyToOne(()=>User,(user)=>user.tokens,{
        onDelete:'CASCADE'
    })
    @JoinColumn({name:'user_id'})
    user!:User

    @Column()
    expAt!:Date

    @Column({default:false})
    is_used!:boolean

    @Column()
    createdAt!:Date

}