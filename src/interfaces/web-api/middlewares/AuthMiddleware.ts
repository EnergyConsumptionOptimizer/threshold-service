import { type NextFunction, type Request, type Response } from "express";
import axios from "axios";
import { InvalidTokenError } from "@interfaces/web-api/errors";

/** Request augmented with the authenticated user context. */
export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    role: string;
  };
}

/**
 * Express authentication middleware backed by the user service.
 *
 * Verifies the auth cookie by calling the user service internal verification endpoints.
 */
export class AuthMiddleware {
  constructor(private readonly userServiceUri: string) {}

  private getAuthTokenFromCookies(request: Request): string {
    const token = request.cookies?.["authToken"];
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
      const token = this.getAuthTokenFromCookies(request);
      const response = await axios.get(this.userServiceUri + `${endpoint}`, {
        headers: {
          Cookie: `authToken=${token}`,
        },
        withCredentials: true,
      });
      if (response.data) {
        request.user = response.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Authenticate a request.
   *
   * @returns A middleware callback that either sets `request.user` or forwards an error.
   */
  authenticate = async (
    request: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await this.verifyToken("/api/internal/auth/verify", request, next);
  };

  /**
   * Authenticate and require an admin role.
   *
   * @returns A middleware callback that either sets `request.user` or forwards an error.
   */
  authenticateAdmin = async (
    request: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await this.verifyToken("/api/internal/auth/verify-admin", request, next);
  };
}
