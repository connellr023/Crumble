/**
 * Crumble Client Socket Connection
 * @author Connell Reffo
 */

import { initRenderLayers } from "./renderer";
import { setEnteredQueue } from "./interface";
import { startGame, stopGame, Player } from "./game";
import { IGameData, IPlayerData, SocketEvents, GameEvents, Directions, Vec2, SEND_INPUT_MS } from "./utils";

import $ from "jquery";
import io from "socket.io-client";

export let clientSocketId: string;
export let inputUpdateInterval: NodeJS.Timeout;

let connectedPlayers: any = {};

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

    // Recieve Socket ID Event
    socket.on(SocketEvents.RECV_ID, (socketId: string) => {
        clientSocketId = socketId;
    });

    // Register Event
    socket.on(SocketEvents.START_GAME, (gameData: IGameData) => {
        if (gameData.start) {
            $("#name-choose-menu").css("display", "none");
            $("#match-wait-menu").css("display", "none");

            // Initialize Render Layers
            initRenderLayers();

            // Instantiate Players
            const PLAYERS: any = gameData.players;

            for (let socketId in PLAYERS) {
                const PLAYER = PLAYERS[socketId] as IPlayerData;
                connectedPlayers[socketId] = new Player(PLAYER.name, new Vec2(PLAYER.pos.x, PLAYER.pos.y), socketId);
            }

            // Start Game
            startGame();
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

        stopGame();
        setEnteredQueue(false);
    });

    // Game Events

    // Player Move Event
    socket.on(GameEvents.PLAYER_MOVE, (player: IPlayerData) => {
        const DATA: IPlayerData = {
            name: player.name,
            pos: {
                x: player.pos.x,
                y: player.pos.y
            }
        }

        // Move Player
        connectedPlayers[player.socketId as string].serverPos = new Vec2(DATA.pos.x, DATA.pos.y);
    });

    // Handle Keypresses
    let keysPressed: any = {};

    document.addEventListener("keydown", (key) => {
        keysPressed[key.key] = true;
    });

    document.addEventListener("keyup", (key) => {
        keysPressed[key.key] = false;
    })

    inputUpdateInterval = setInterval(() => {

        // Up and Down Movement
        if (keysPressed["w"]) {
            socket.emit(GameEvents.PLAYER_MOVE, Directions.UP);
        }
        else if (keysPressed["s"]) {
            socket.emit(GameEvents.PLAYER_MOVE, Directions.DOWN);
        }

        // Left and Right Movement
        if (keysPressed["a"]) {
            socket.emit(GameEvents.PLAYER_MOVE, Directions.LEFT);
        }
        else if (keysPressed["d"]) {
            socket.emit(GameEvents.PLAYER_MOVE, Directions.RIGHT);
        }
    }, SEND_INPUT_MS);
}