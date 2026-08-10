import { io, Socket } from "socket.io-client";
import { API_URL } from "./api";

export const createSocket = (): Socket => io(API_URL);
