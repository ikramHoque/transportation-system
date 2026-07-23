import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user, logout } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token || !user) {
      setSocket(null);
      return;
    }

    const instance = io({ auth: { token } });
    setSocket(instance);

    function handleSessionInvalidated(payload: { message: string }) {
      logout(payload.message);
    }
    instance.on("session:invalidated", handleSessionInvalidated);

    return () => {
      instance.off("session:invalidated", handleSessionInvalidated);
      instance.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}
