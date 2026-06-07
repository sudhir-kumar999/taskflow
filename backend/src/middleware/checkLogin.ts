import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../utils/generateTokens";
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

export const checkLogin = (
  req: RequestWithUserRole,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userToken = req.cookies.accessToken;
    if (!userToken) {
      return res.status(401).json({
        success: false,
        message: "no tokens found",
      });
    }
    const decoded = verifyToken(
      userToken,
      process.env.ACCESS_KEY as string,
    ) as decode;
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "wrong token or token expired",
      });
    }
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: "JWT expired login again",
      });
    }
  }
};
