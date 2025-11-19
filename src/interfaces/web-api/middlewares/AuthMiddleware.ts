import { type NextFunction, type Request, type Response } from "express";
import axios from "axios";
import { InvalidTokenError } from "@domain/errors";

export class AuthMiddleware {
  private checkToken(request: Request): string {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new InvalidTokenError();
    }

    return authHeader;
  }

  private async verifyToken(
    endpoint: string,
    request: Request,
    next: NextFunction,
  ) {
    try {
      const token = this.checkToken(request);
      await axios.get(`${process.env.USER_SERVICE_URI}${endpoint}`, {
        headers: { Authorization: token },
      });
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
