//  join / leave ride rooms


import { Socket } from "socket.io"
import { AuthenticatedSocket, JoinRidePayload, LeaveRidePayload } from "../socketTypes.js"
import { SOCKET_EVENTS } from "../socketEvents.js"

export const registerRideHandlers = (socket: Socket) => {
    const authenticatedSocket = socket as AuthenticatedSocket;

    socket.on(SOCKET_EVENTS.RIDE.JOIN, async (payload: JoinRidePayload) => {
        try {
            const { rideId } = payload;
            if (!rideId) {
                return socket.emit(SOCKET_EVENTS.RIDE.ERROR, {
                    message: "Ride ID is required",
                });
            }

            const room = `ride: ${rideId}`;
            await socket.join(room);

            console.log(`${authenticatedSocket.user.role} ${authenticatedSocket.user.id} joined ${room}`);

            socket.emit(SOCKET_EVENTS.RIDE.JOINED, {
                rideId,
                message: "Successfully joined ride",
            });

        } catch (err) {
            console.error("Join ride socket error: ", err);
            socket.emit(SOCKET_EVENTS.RIDE.ERROR, {
                message: "Unable to join ride"
            })
        }
    })


    socket.on(SOCKET_EVENTS.RIDE.LEAVE, async (payload: LeaveRidePayload) => {
        try {
            const { rideId } = payload;
            if (!rideId) {
                return socket.emit(SOCKET_EVENTS.RIDE.ERROR, {
                    message: "Ride ID is required",
                });
            }

            const room = `ride: ${rideId}`;
            if (!authenticatedSocket.rooms.has(room)) {
                return socket.emit(SOCKET_EVENTS.RIDE.ERROR, {
                    message: "You are not connected to this ride",
                });
            }

            await socket.leave(room);
            console.log(
                `${authenticatedSocket.user.role} ${authenticatedSocket.user.id} left ${room}`
            );

            socket.emit(SOCKET_EVENTS.RIDE.LEFT, {
                rideId,
                message: "Successfully left ride",
            });



        } catch (err) {
            console.error("Leave ride socket error:", err);

            socket.emit(SOCKET_EVENTS.RIDE.ERROR, {
                message: "Unable to leave ride",
            });
        }
    })
}