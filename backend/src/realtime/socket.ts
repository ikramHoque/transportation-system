import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { env } from "../config/env";
import { verifyToken } from "../utils/jwt";
import { locationUpdateSchema } from "../modules/location/location.schemas";
import * as locationService from "../modules/location/location.service";
import type { AuthenticatedUser } from "../types";

/** Drivers and admins get the waiting-riders roster; everyone gets the bus location. */
const DISPATCH_ROOM = "dispatch";

interface AuthenticatedSocket extends Socket {
  data: {
    user: AuthenticatedUser;
  };
}

function authenticateSocket(socket: Socket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    next(new Error("Missing authentication token"));
    return;
  }

  try {
    const payload = verifyToken(token);
    (socket as AuthenticatedSocket).data.user = {
      id: payload.sub,
      employeeId: payload.employeeId,
      role: payload.role,
    };
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}

async function broadcastWaitingRiders(io: Server): Promise<void> {
  const riders = await locationService.getWaitingRiders();
  io.to(DISPATCH_ROOM).emit("waiting:update", { count: riders.length, riders });
}

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const { user } = socket.data;

    if (user.role === "driver" || user.role === "admin") {
      socket.join(DISPATCH_ROOM);
    }

    socket.on("location:update", async (payload: unknown) => {
      if (user.role === "admin") return; // admins are observers only

      const parsed = locationUpdateSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit("location:error", { error: "Invalid location payload" });
        return;
      }

      try {
        const record = await locationService.upsertLocation(user, parsed.data);

        if (user.role === "driver") {
          io.emit("driver:location", record);
        } else {
          await broadcastWaitingRiders(io);
        }
      } catch (err) {
        console.error("Failed to process location:update", err);
        socket.emit("location:error", { error: "Failed to update location" });
      }
    });
  });

  return io;
}
