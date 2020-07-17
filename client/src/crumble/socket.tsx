/**
 * Crumble Client Socket Connection
 * @author Connell Reffo
 */

import io from "socket.io-client";

export enum SocketEvents {
    CONNECTED = "connected",
    REGISTER = "register"
}

let socket = io("localhost:25565");

socket.on(SocketEvents.CONNECTED, ({success, serverId}: {success: boolean, serverId: number}) => {
    console.log(`Connected to server: "${serverId}"`);
});