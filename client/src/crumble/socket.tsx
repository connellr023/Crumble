/**
 * Crumble Client Socket Connection
 * @author Connell Reffo
 */

import { setEnteredQueue } from "./interface";

import $ from "jquery";
import io from "socket.io-client";

/**
 * Enumeration of Events that Will Take Place on the Socket Client
 */
export enum SocketEvents {
    CONNECTED = "connect",
    REGISTER = "register",
    PLAYER_LEAVE = "leave",
    START_GAME = "startgame"
}

/**
 * Registers the Crumble Client with the Socket Server
 * @param name Name of the Player
 * @param lobbyId The Lobby ID to Connect to
 */
export function handleClientSocket(name: string, lobbyId: string) {
    const socket = io(`/lobbies/${lobbyId}`);

    // Connection Event
    socket.on(SocketEvents.CONNECTED, () => {
        console.log(`Connected to Lobby: ${lobbyId}`);
        
        socket.emit(SocketEvents.REGISTER, name);
    });

    // Register Event
    socket.on(SocketEvents.START_GAME, (start: boolean) => {
        if (start) {
            $("#name-choose-menu").css("display", "none");
            $("#match-wait-menu").css("display", "none");

            $("canvas").css("display", "block");
        }
        else {
            $("#name-choose-menu").css("display", "none");
            $("#match-wait-menu").css("display", "block");
        }
    });

    // Player Leave Event
    socket.on(SocketEvents.PLAYER_LEAVE, (socketId: string) => {
        socket.disconnect();
        console.log(`Player of Socket ID "${socketId}" has Left`);

        $("#name-choose-menu").css("display", "block");
        $("#match-wait-menu").css("display", "none");
        $("#name-input").val("");

        setEnteredQueue(false);
    });
}