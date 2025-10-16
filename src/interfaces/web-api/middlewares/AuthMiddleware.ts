import { type NextFunction, type Request, type Response } from "express";
import axios from "axios";

class InvalidTokenError extends Error {
  constructor() {
    super("Access token is required");
    this.name = "InvalidTokenError";
  }
}

const internalServerError = { error: "Internal server error" };

export class AuthMiddleware {
  private checkToken = (request: Request) => {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new InvalidTokenError();
    }

    return authHeader;
  };

  authenticate = async (
    request: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = this.checkToken(request);

      await axios.get(process.env.USER_SERVICE_URI + "/auth/verify", {
        headers: { Authorization: token },
      });

      next();
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        res.status(401).json({ error: error.message });
        return;
      }

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        res.status(error.response?.status).json(error.response?.data);
        return;
      }

      res.status(500).json(internalServerError);
    }
  };

  authenticateAdmin = async (
    request: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = this.checkToken(request);

      await axios.get(process.env.USER_SERVICE_URI + "/auth/verify-admin", {
        headers: { Authorization: token },
      });
      next();
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        res.status(401).json({ error: error.message });
        return;
      }

      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 403)
      ) {
        res.status(error.response?.status).json(error.response?.data);
        return;
      }

      res.status(500).json(internalServerError);
    }
  };
}
