/**
 * Crumble Main Server File
 * @author Connell Reffo
 */

import { Game, Player, Vec2, activeGames, maxPlayers } from "./game";

import * as cors from "cors";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as socketIo from "socket.io";

const app = require("express")();
export const router = express.Router({ caseSensitive: true });

app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Enumeration of Events that Will Take Place on a Socket Server
 */
export enum SocketEvents {
    CONNECTION = "connection",
    DISCONNECT = "disconnect",
    PLAYER_LEAVE = "leave",
    REGISTER = "register",
    START_GAME = "startgame"
}

/**
 * Represents Lobby Data to be Sent to the Client
 */
interface IGameStart {
    start: boolean;
    lobby: string;
}

/**
 * The Maximum Amount of Games that can be Concurrently Running
 */
const maxActiveGames = 1;

/**
 * The TPS the Server Should have when Running in Good Conditions
 */
const optimalTicksPerSecond = 20;

/**
 * Port that the Main Crumble Server will Run on
 */
const port = 8000;

app.use(router);
app.use(cors());

/**
 * Server Variable
 */
export const server = app.listen(port, () => {
    console.log("Started Main Crumble Server");
});

/**
 * Manage Socket Server Input/Output
 */
export const io = socketIo.listen(server);

/**
 * Finds an Availabl Lobby or Creates One and Returns the Lobby ID
 */
function getAvailableLobby(): string {

    function openGame(): string {

        // Check if the Limit of Concurrently Running Games is Reached
        if (activeGames.length < maxActiveGames) {

            // Create a New Match
            const gameInstance = new Game();
            gameInstance.registerActiveGame();

            return gameInstance.lobbyId;
        }
        else {
            console.log("[!] Maximum Amount of Active Games Reached");
            return null;
        }
    }

    // Check if there are no Current Matches
    if (activeGames.length > 0) {

        // Check if Match is Waiting for Player
        for (let activeGame in activeGames) {
            let game = activeGames[activeGame];

            if (game.players.length < maxPlayers) {
                return game.lobbyId;
            }
        }

        // Create a New Match
        return openGame();
    }
    else {

        // Create a New Match
        return openGame();
    }
};

/**
 * Hooks a Client up with a Lobby ID
 */
router.post("/api/find-lobby", (req, res) => {
    const lobbyId = getAvailableLobby();

    res.send({
        lobby: lobbyId
    });
});