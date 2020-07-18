/**
 * Crumble Client Socket Connection
 * @author Connell Reffo
 */

import io from "socket.io-client";

/**
 * Enumeration of Events that Will Take Place on the Socket Client
 */
export enum SocketEvents {
    CONNECTED = "connect",
    REGISTER = "register",
    PLAYER_LEAVE = "leave",
    RECV_GAME_DATA = "gamedata"
}

/**
 * Registers the Crumble Client with the Socket Server
 * @param name Name of the Player
 */
export function handleClientSocket(name: string, lobbyId: string) {
    const socket = io(`/lobbies/${lobbyId}`);

    // Connection Event
    socket.on(SocketEvents.CONNECTED, () => {
        console.log(`Connected to Lobby: ${lobbyId}`);
        
        socket.emit(SocketEvents.REGISTER, name);
    });

    // Register Event
    socket.on(SocketEvents.REGISTER, (start: boolean) => {
        console.log(`Start: ${start}`);
    });

    socket.on(SocketEvents.PLAYER_LEAVE, (socketId: string) => {
        socket.disconnect();
        console.log(`Player of Socket ID "${socketId}" has Left`);
    });
}