import crypto from "crypto"

export const generateTokens=()=>{
    const token = crypto.randomBytes(32).toString('hex');
    console.log(token)
    return token
}