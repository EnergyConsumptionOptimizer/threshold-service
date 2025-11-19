import { io, Socket } from "socket.io-client";

export interface SocketConnectionOptions {
  timeout?: number;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export async function connectSocket(
  url: string,
  options: SocketConnectionOptions = {},
): Promise<Socket> {
  const {
    timeout = 5000,
    reconnection = false,
    reconnectionAttempts = Infinity,
    reconnectionDelay = 1000,
  } = options;

  const socket = io(url, {
    reconnection,
    reconnectionAttempts,
    reconnectionDelay,
    timeout,
  });

  return new Promise((resolve, reject) => {
    const onConnect = () => {
      socket.off("connect_error", onError);
      resolve(socket);
    };

    const onError = (error: Error) => {
      socket.off("connect", onConnect);
      socket.disconnect();
      reject(new Error(`Connection failed: ${error.message}`));
    };

    socket.once("connect", onConnect);
    socket.once("connect_error", onError);
  });
}
