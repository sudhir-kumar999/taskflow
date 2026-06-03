import { AppDataSource } from "../src/config/data-source"
import { Token } from "../src/entity/Token"

const tokenRepo=AppDataSource.getRepository(Token)


// export const verifyTokens=(email,token)=>{

//   const tokenData=
    
// }