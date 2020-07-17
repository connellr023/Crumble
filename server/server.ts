/**
 * Crumble Main Server File
 * @author Connell Reffo
 */

import { Game, Player, Vec2, activeGames, maxPlayers } from "./game";

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
    REGISTER = "register"
}

/**
 * The Maximum Amount of Games that can be Concurrently Running
 */
const maxActiveGames = 5;

/**
 * The TPS the Server Should have when Running in Good Conditions
 */
const optimalTicksPerSecond = 20;

/**
 * Port that the Main Crumble Server will Run on
 */
const port = 8000;

// Routing
app.use(router);

export const server = app.listen(port, () => {
    console.log("Started Main Crumble Server");
});

/**
 * Route for Client to Find a Match
 */
router.post("/api/find-game", (req, res) => {
    const name: string = req.body.name;

    // Check if there are no Current Matches
    if (activeGames.length > 0) {

        // Check if Match is Waiting for Player
        for (let activeGame in activeGames) {
            let game = activeGames[activeGame];

            if (game.connectedPlayers < maxPlayers) {
                // Start Game
                activeGames[activeGame].start();

                res.send({
                    start: true,
                    lobby: game.lobbyId
                });

                return;
            }
        }

        // Create a New Match
        const gameInstance = new Game();

        res.send({
            start: false,
            lobby: gameInstance.lobbyId
        });
    }
    else {
        // Create a New Match
        const gameInstance = new Game();

        res.send({
            start: false,
            lobby: gameInstance.lobbyId
        });
    }

});