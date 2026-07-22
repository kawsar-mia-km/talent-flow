import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

/**
 * Opens one Socket.IO connection for the logged-in user and wires up
 * event listeners. Reconnects automatically (socket.io's default
 * behavior) if the connection drops. No-ops if there's no token yet.
 */
export function useSocket(handlers) {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const token = localStorage.getItem("tf_token");
    if (!token) return undefined;

    const socket = io("/", { auth: { token }, transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("notification:new", (payload) => handlersRef.current?.onNotification?.(payload));
    socket.on("message:new", (payload) => handlersRef.current?.onMessage?.(payload));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef;
}
