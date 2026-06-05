import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import bcrypt from "bcrypt";
import { generateTokens } from "../../utils/generateToke";
import { Token } from "../entity/Token";
import { sendMail } from "../../utils/sendEmail";
import { In } from "typeorm";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/generateTokens";
import { sendGrid } from "../../utils/sendGrid";
interface decode {
  name: string;
  email: string;
  id: string;
  iat: number;
  exp: number;
}
export interface RequestWithUserRole extends Request {
  user?: decode;
}
const userRepo = AppDataSource.getRepository(User);
const tokenRepo = AppDataSource.getRepository(Token);
const stringRegex = /^[A-Za-z ]+$/;
const passRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const registerUser = async (req: RequestWithUserRole, res: Response) => {
  try {
    console.log("signup controller works");
    const bodyData = req.body;
    let { email, password, name } = bodyData;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "ever field is required for register",
      });
    }
    if (!passRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "password contains at least one digit a uppercase letter a lowercase letter and special character and min length 8",
      });
    }
    name = name?.trim();

    if (!stringRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: "only letter are allowed in names",
      });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "email is not valid enter valid email",
      });
    }
    email = email?.trim().toLowerCase();
    bodyData.email = email;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "name is required it cannot be empty",
      });
    }
    const strPassword = password.toString();
    const hashed = await bcrypt.hash(strPassword, 10);
    bodyData.password = hashed;
    const check = await userRepo.findOne({
      where: {
        email,
      },
    });
    if (check) {
      return res.status(409).json({
        success: false,
        message: "user already exists",
      });
    }
    let res2 = await userRepo.save(bodyData);
    let findId = await userRepo.findOne({
      where: {
        email,
      },
    });

    const token = generateTokens();
    const tokenData = {
      tokens: token,
      user_id: findId?.id,
      createdAt: new Date(Date.now()),
      expAt: new Date(Date.now() + 2 * 60 * 1000),
    };
    const email_link = process.env.EMAIL_LINK;
    console.log(email_link);
    const template = `Hello, ${findId?.name} Please verify your email by
                clicking this link :
                <a href="${email_link}/api/users/verify-email/${findId?.id}/${tokenData.tokens}">Click here to verify </a>`;

    // const mailInfo = await sendMail(email, template);
    // if (!mailInfo?.accepted[0]) {
    //   return res.status(502).json({
    //     success: false,
    //     message: "Failed when send Email",
    //   });
    // }
    const sendMail = await sendGrid(email, template);
    let res3 = await tokenRepo.save(tokenData);
    console.log("sendgrid", sendMail);
    // if (sendMail==undefined) {
    //   return res.status(502).json({
    //     success: false,
    //     message: "Failed when send Email",
    //   });
    // }

    return res.status(201).json({
      success: true,
      message: "Token send on your email verify to login",
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

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const reqId = req.params.id as string;
    console.log(reqId);
    console.log(token);
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Your verification link are expired",
      });
    }
    const testuser = await userRepo.findOne({
      where: {
        id: reqId,
      },
    });
    if (!testuser) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }
    if (testuser.isVerified) {
      return res.status(200).json({
        success: true,
        message: "you are already verified login plz",
      });
    }
    let tokenUser = await tokenRepo.findOne({
      where: {
        tokens: token,
        user_id: reqId,
      },
    });
    console.log("tokenuser", tokenUser);
    if (!tokenUser) {
      return res.status(404).json({
        success: false,
        message: "you are not valid user from token signup first",
      });
    }

    let checkUser = await userRepo.findOne({
      where: {
        id: reqId,
      },
    });
    console.log("checkuser", checkUser);
    if (!checkUser) {
      return res.status(404).json({
        success: false,
        message: "you are not valid user signup first",
      });
    }
    console.log(tokenUser.is_used);
    let currTime = new Date();
    let expTime = new Date(tokenUser.expAt.getTime());
    if (currTime > expTime) {
      await tokenRepo.delete(tokenUser.id);
      return res.status(401).json({
        success: false,
        message: "token is expired generate new",
      });
    }
    if (tokenUser.is_used) {
      await tokenRepo.delete(tokenUser.id);
      return res.status(401).json({
        success: false,
        message: "token is already used",
      });
    }
    tokenUser.is_used = true;
    await tokenRepo.save(tokenUser);
    checkUser.isVerified = true;
    await userRepo.save(checkUser);
    await tokenRepo.delete(tokenUser.id);
    return res.status(200).json({
      success: true,
      message: "email verified verified success",
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

export const resendLink = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log(email);
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "plz provide email to send link",
      });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "provide valid email",
      });
    }
    let checkUser = await userRepo.findOne({
      where: {
        email,
      },
    });
    console.log(checkUser);
    if (!checkUser) {
      return res.status(401).json({
        success: false,
        message: "you are not registered. Sign up first",
      });
    }
    if (checkUser.isVerified) {
      return res.status(401).json({
        success: false,
        message: "you are already verified Proceed to login",
      });
    }
    const userId = checkUser.id;
    let otpData = await tokenRepo.findOne({
      where: {
        user_id: userId,
      },
    });
    console.log("otpData", otpData);
    if (otpData) {
      let currTime = new Date();
      let expTime = new Date(otpData!.expAt.getTime());
      console.log(currTime, expTime);
      if (!(expTime < currTime)) {
        return res.status(401).json({
          success: false,
          message: "you can send reset link after 10 min",
        });
      }
      await tokenRepo.delete(otpData?.id);
    }

    console.log("test");
    const token = generateTokens();
    const tokenData = {
      tokens: token,
      user_id: checkUser?.id,
      createdAt: new Date(Date.now()),
      expAt: new Date(Date.now() + 20 * 60 * 1000),
    };
    // const email_link = process.env.EMAIL_LINK;
    // console.log(email_link);
    // const template = `Hello, ${checkUser?.name} Please verify your email by
    //                   clicking this link :
    //                   <a href="${email_link}/api/users/verify-email/${checkUser?.id}/${tokenData.tokens}">Click here to verify </a>`;

    // const mailInfo = await sendMail(email, template);
    // if (!mailInfo?.accepted[0]) {
    //   return res.status(502).json({
    //     success: false,
    //     message: "Failed when send Email",
    //   });
    // }
    const email_link = process.env.EMAIL_LINK;
    console.log(email_link);
    const template = `Hello, ${checkUser?.name} Please verify your email by
                clicking this link :
                <a href="${email_link}/api/users/verify-email/${checkUser?.id}/${tokenData.tokens}">Click here to verify </a>`;

    const sendMail = await sendGrid(email, template);
    console.log("sendgrid", sendMail);
    let res3 = await tokenRepo.save(tokenData);
    console.log(res3);

    return res.status(201).json({
      success: true,
      message: "Token send on your email verify to login",
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

export const loginUser = async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;
    console.log(email, password);
    if (!email || !password) {
      return res.status(401).json({
        success: false,
        message: "email and password is required for login",
      });
    }
    email = email.trim().toLowerCase();
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "email is not valid enter valid email",
      });
    }
    password = password.trim();
    let userExist = await userRepo.findOne({
      where: {
        email,
      },
    });
    if (!userExist) {
      return res.json({
        success: false,
        message: "user not register sign up first",
      });
    }

    if (!userExist.isVerified) {
      return res.status(401).json({
        success: false,
        message: "you are not verified. verify your email first",
      });
    }

    const verifyPass = await bcrypt.compare(password, userExist.password);
    if (!verifyPass) {
      return res.json({
        success: false,
        message: "wrong password entered",
      });
    }

    const payload = {
      name: userExist.name,
      email: userExist.email,
      id: userExist.id,
    };

    const accessToken = generateAccessToken(
      payload,
      process.env.ACCESS_KEY as string,
    );

    const refreshPayload = {
      id: userExist.id,
    };

    const refreshToken = generateRefreshToken(
      refreshPayload,
      process.env.REFRESH_KEY as string,
    );

    const production = process.env.NODE_ENv === "production";

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: production,
      sameSite: production ? "strict" : "lax",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: production,
      sameSite: production ? "strict" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "login successfully",
      data: {
        id:userExist.id,
        email:userExist.email,
        name:userExist.name
      },
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

export const logoutUser = (req: Request, res: Response) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successfully",
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


export const getMe=async(req:RequestWithUserRole,res:Response)=>{
try {
  const {id}=req.user as decode
  if(!id){
    return res.status(401).json({
      success:false,
      message:"Not logged in"
    })
  }
  let user=await userRepo.findOne({
    where:{
      id:id
    }
  })
  if(!user){
    return res.status(401).json({
      success:false,
      message:"Not logged in"
    })
  }

  return res.status(200).json({
    success:true,
    message:"user fetched",
    data:{
      id:user.id,
      name:user.name,
      email:user.email
    }
  })
} catch (error) {
  
}
}