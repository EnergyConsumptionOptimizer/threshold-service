import { type NextFunction, type Request, type Response } from "express";
import axios from "axios";
import { InvalidTokenError } from "@domain/errors";

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    role: string;
  };
}

export class AuthMiddleware {
  private getAccessTokenFromCookies(request: Request): string {
    const token = request.cookies?.["accessToken"];
    if (!token) {
      throw new InvalidTokenError();
    }
    return token;
  }

  private async verifyToken(
    endpoint: string,
    request: AuthenticatedRequest,
    next: NextFunction,
  ) {
    try {
      const token = this.getAccessTokenFromCookies(request);
      const response = await axios.get(
        `${process.env.USER_SERVICE_URI}${endpoint}`,
        {
          headers: {
            Cookie: `accessToken=${token}`,
          },
          withCredentials: true,
        },
      );
      if (response.data) {
        request.user = response.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  authenticate = async (
    request: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await this.verifyToken("/auth/verify", request, next);
  };

  authenticateAdmin = async (
    request: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await this.verifyToken("/auth/verify-admin", request, next);
  };
}
