import axios from "axios";
import { vi } from "vitest";

export const mockAuthSuccess = () => {
  vi.spyOn(axios, "get").mockResolvedValue({
    status: 200,
    data: { valid: true },
  });
};

export const mockAuthFailure = () => {
  vi.spyOn(axios, "get").mockRejectedValue({
    isAxiosError: true,
    response: {
      status: 401,
      data: { error: "Unauthorized" },
    },
  });
};

export const mockAdminAuthSuccess = () => {
  vi.spyOn(axios, "get").mockImplementation((url) => {
    if (url.includes("verify-admin")) {
      return Promise.resolve({
        status: 200,
        data: { valid: true, isAdmin: true },
      });
    }
    return Promise.resolve({ status: 200, data: { valid: true } });
  });
};

export const mockAdminAuthFailure = () => {
  vi.spyOn(axios, "get").mockImplementation((url) => {
    if (url.includes("verify-admin")) {
      return Promise.reject({
        isAxiosError: true,
        response: { status: 403, data: { error: "Forbidden" } },
      });
    }
    return Promise.resolve({ status: 200, data: { valid: true } });
  });
};

export const clearAuthMocks = () => {
  vi.restoreAllMocks();
};
