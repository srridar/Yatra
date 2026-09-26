//  this file creates or configures socket.io server


import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { socketAuth } from './socketAuth.js';
import { handleSocketConnection } from "./handlers/connectionHandler.js";

export const initializeSocket = (HttpServer: HttpServer) => {
       const io= new Server(HttpServer, {
         cors:{
            origin: process.env.FRONTEND_URL,
            credentials: true
         },
         transports: ["websocket","polling"]

       });

       io.use(socketAuth);

       io.on("connection",(socket)=>{
        handleSocketConnection(io,socket);
       })

       console.log("Socket.Io initialized");
       return io;
}