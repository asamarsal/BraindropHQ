// lib/useSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

let socket;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket = io('http://localhost:3001');

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { socket, isConnected };
}