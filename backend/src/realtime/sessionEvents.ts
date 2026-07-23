import { EventEmitter } from "node:events";

/**
 * Decouples session invalidation (triggered from the auth module on
 * login/register) from the Socket.IO server (which lives in a different
 * module and is only constructed once, in server.ts). Single-process only:
 * on a horizontally-scaled deployment this would need to be backed by a
 * shared pub/sub (e.g. Redis) instead so a kick issued on one instance
 * reaches sockets connected to another.
 */
export const sessionEvents = new EventEmitter();

export const SESSION_INVALIDATED_EVENT = "invalidated";
