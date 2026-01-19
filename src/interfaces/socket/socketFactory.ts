import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";

type ClientOptions = Partial<ManagerOptions & SocketOptions>;

export async function createSocket(
  url: string,
  options: ClientOptions = {},
): Promise<Socket> {
  const config: ClientOptions = {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 10000,
    autoConnect: false,
    ...options,
  };

  const socket = io(url, config);

  return new Promise((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      console.log(`[Socket] Connected to ${url}`);
      resolve(socket);
    };

    const onError = (error: Error) => {
      console.warn(`[Socket] Connection error on ${url}: ${error.message}`);
      if (config.reconnection === false) {
        cleanup();
        socket.disconnect();
        reject(error);
      }
    };

    const cleanup = () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
    };

    socket.once("connect", onConnect);
    socket.on("connect_error", onError);

    socket.connect();
  });
}
