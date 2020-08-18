/**
 * Crumble Main Server File
 * @author Connell Reffo
 */

import { PORT, MAX_ACTIVE_GAMES } from "./utils";

import Game from "./game";

import * as cors from "cors";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as socketIo from "socket.io";

export const APP = require("express")();
export const ROUTER = express.Router({ caseSensitive: true });

// Initialize Express
APP.use(bodyParser.urlencoded({ extended: true }));
APP.use(ROUTER);
APP.use(cors());

// Initialize Server
export const SERVER = APP.listen(PORT, () => {
    console.log("Started Main Crumble Server");
});

/**
 * Manages Socket Server Input/Output
 */
export const IO = socketIo.listen(SERVER, { httpCompression: false, transports: ["websocket"] });

/**
 * Finds an Availabl Lobby or Creates One and Returns the Lobby ID
 */
function getAvailableLobby(): string {

    function openGame(): string {

        // Check if the Limit of Concurrently Running Games is Reached
        if (Object.keys(Game.activeGames).length < MAX_ACTIVE_GAMES) {

            // Create a New Match
            const GAME_INSTANCE = new Game();
            GAME_INSTANCE.registerActiveGame();

            return GAME_INSTANCE.lobbyId;
        }
        else {
            console.log("[!] Maximum Amount of Active Games Reached");
            return null;
        }
    }

    // Check if there are no Current Matches
    if (Object.keys(Game.activeGames).length > 0) {

        // Check if Match is Waiting for Player
        for (let activeGame in Game.activeGames) {
            let game = Game.activeGames[activeGame];

            if (Object.keys(game.players).length < game.maxPlayers) {
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
 * Hooks a Client With a Lobby ID
 */
ROUTER.post("/api/find-lobby", (req, res) => {
    const LOBBY_ID = getAvailableLobby();

    res.send({
        lobby: LOBBY_ID
    });
});