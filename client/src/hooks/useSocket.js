import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getServerBaseUrl } from '../utils/api.utils';

let socketInstance = null;

const getSocket = () => {
  if (!socketInstance) {
    const token = localStorage.getItem('accessToken');
    socketInstance = io(getServerBaseUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });
  }
  return socketInstance;
};

export const destroySocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

/**
 * useSocket — subscribes to one or more Socket.IO events.
 *
 * @param {Record<string, Function>} handlers  Map of event → callback
 * @param {boolean} [enabled=true]  Set false to skip connecting (e.g. when logged out)
 *
 * Backend events emitted to 'dashboard' room (auto-joined on connect):
 *   dashboard:update  – any sensor reading or device status change
 *   alert:new         – new alert created   { alert }
 *   alert:acknowledged
 *   alert:resolved
 *   sensor:reading    – { deviceId, temperature, humidity, doorStatus, timestamp }
 *   device:status     – { deviceId, status }
 */
const useSocket = (handlers, enabled = true) => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const unsubscribe = useCallback(() => {
    if (!socketInstance) return;
    Object.keys(handlersRef.current).forEach((event) => {
      socketInstance.off(event);
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const socket = getSocket();

    const attach = () => {
      Object.entries(handlersRef.current).forEach(([event, cb]) => {
        socket.on(event, (...args) => handlersRef.current[event]?.(...args));
      });
    };

    attach();

    socket.on('connect', attach);
    socket.on('disconnect', () => {
      // handlers will be re-attached on reconnect
    });

    return () => {
      unsubscribe();
      socket.off('connect', attach);
    };
  }, [enabled, unsubscribe]);
};

export default useSocket;
