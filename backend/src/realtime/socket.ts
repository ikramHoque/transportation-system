import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { env } from "../config/env";
import { verifyToken } from "../utils/jwt";
import { locationUpdateSchema } from "../modules/location/location.schemas";
import * as locationService from "../modules/location/location.service";
import { isSessionActive } from "../modules/auth/auth.service";
import { sessionEvents, SESSION_INVALIDATED_EVENT } from "./sessionEvents";
import type { AuthenticatedUser } from "../types";

/** Drivers and admins get the waiting-riders roster; everyone gets the bus location. */
const DISPATCH_ROOM = "dispatch";

function userRoom(userId: string): string {
  return `user:${userId}`;
}

interface AuthenticatedSocket extends Socket {
  data: {
    user: AuthenticatedUser;
  };
}

async function authenticateSocket(socket: Socket, next: (err?: Error) => void): Promise<void> {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    next(new Error("Missing authentication token"));
    return;
  }

  try {
    const payload = verifyToken(token);

    const active = await isSessionActive(payload.sub, payload.sid);
    if (!active) {
      next(new Error("Session ended -- this account signed in on another device"));
      return;
    }

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

  // A newer login elsewhere rotates the DB session id (see auth.service);
  // this is how the previously-connected socket actually gets cut off in
  // real time, rather than lingering until it happens to reconnect.
  sessionEvents.on(SESSION_INVALIDATED_EVENT, (userId: string) => {
    const room = userRoom(userId);
    io.to(room).emit("session:invalidated", {
      message: "You were logged out because this account signed in on another device.",
    });
    io.in(room).disconnectSockets(true);
  });

  io.on("connection", (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const { user } = socket.data;

    socket.join(userRoom(user.id));

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
        const { record, rejectedOutOfRange, autoPickedUp } = await locationService.upsertLocation(
          user,
          parsed.data,
        );

        if (user.role === "driver") {
          io.emit("driver:location", record);
        } else {
          if (rejectedOutOfRange) {
            socket.emit("location:outOfRange", {
              message: "You're too far from the route to be counted as waiting.",
            });
          }
          if (autoPickedUp) {
            socket.emit("location:pickedUp", {
              message: "Looks like you're on the bus -- you're no longer marked as waiting.",
            });
          }
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
