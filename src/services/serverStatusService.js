import net from "net";
import { config } from "../config.js";

export async function getServerStatus() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeoutMs = 1500;

    socket.setTimeout(timeoutMs);

    socket.once("connect", () => {
      socket.destroy();
      resolve({ online: true });
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve({ online: false });
    });

    socket.once("error", () => {
      socket.destroy();
      resolve({ online: false });
    });

    socket.connect(config.gameServer.port, config.gameServer.host);
  });
}