import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import bcrypt from "bcrypt";
import { generateTokens } from "../../utils/generateToke";
import { Token } from "../entity/Token";
import { sendMail } from "../../utils/sendEmail";
import { In } from "typeorm";
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

    if (name == undefined || email == undefined || password == undefined) {
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
    name = name?.trim();
    email = email?.trim().toLowerCase();
    bodyData.email = email;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "name is required it acnnot be empty",
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
      expAt: new Date(Date.now() + 20 * 60 * 1000),
    };
    const template = `Hello, ${findId?.name} Please verify your email by
                clicking this link :
                <a href="http://localhost:5000/api/users/verify-email/${findId?.id}/${tokenData.tokens}">Click here to verify </a>`;

    const mailInfo = await sendMail(email, template);
    if (!mailInfo?.accepted[0]) {
      return res.status(502).json({
        success: false,
        message: "Failed when send Email",
      });
    }
    let res3 = await tokenRepo.save(tokenData);
    console.log(res3);

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
  const token = req.params.token;
  const reqId = req.params.id;
  console.log(reqId);
  console.log(token);
  if (!token) {
    return res.status(400).send({
      success: false,
      message: "Your verification link are expired",
    });
  }
  let tokenUser = await tokenRepo.findOne({
    where: {
      tokens: Array.isArray(token) ? In(token) : token,
      user_id: Array.isArray(reqId) ? In(reqId) : reqId,
    },
  });
  console.log(tokenUser);
  if (!tokenUser) {
    return res.status(401).json({
      success: false,
      message: "you are not valid user from token signup first",
    });
  }

  let checkUser = await userRepo.findOne({
    where: {
      id: Array.isArray(reqId) ? In(reqId) : reqId,
    },
  });
  // console.log(checkUser)
  if (!checkUser) {
    return res.status(401).json({
      success: false,
      message: "you are not valid user signup first",
    });
  }
  console.log(tokenUser.is_used);
  let currTime = new Date();
  let expTime = new Date(tokenUser.expAt.getTime());
  if (currTime > expTime) {
    return res.status(401).json({
      success: false,
      message: "token is expired generate new",
    });
  }
  if (tokenUser.is_used) {
    return res.status(401).json({
      success: false,
      message: "token is already used",
    });
  }
  tokenUser.is_used = true;
  await tokenRepo.save(tokenUser);
  checkUser.isVerified = true;
  await userRepo.save(checkUser);
  let checkUsedToken=await tokenRepo.findOne({
    where:{
      id: Array.isArray(reqId) ? In(reqId) : reqId,
    }
  })
  if(checkUsedToken?.is_used){
    await tokenRepo.remove(checkUsedToken)
  }
};
