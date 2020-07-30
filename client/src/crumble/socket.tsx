/**
 * Crumble Client Socket Connection
 * @author Connell Reffo
 */

import { displayWinner } from "./interface";
import { initRenderLayers, deleteRenderController } from "./renderer";
import { startGame, Player, Chunk } from "./game";
import { IGameData, IPlayerData, IPlayerDeathData, SocketEvents, GameEvents, Directions, Vec2, SEND_INPUT_MS } from "./utils";

import $ from "jquery";
import io from "socket.io-client";

/**
 * Socket ID of the Current Client
 */
export let clientSocketId: string;

/**
 * Interval Responsible for Sending Input Updates to the Server
 */
export let inputUpdateInterval: NodeJS.Timeout;

/**
 * List of Chunk Render Controllers
 */
export let loadedChunks: Array<Chunk> = [];

/**
 * Tracks Players Connected with the Server
 */
let connectedPlayers: any = {};

/**
 * Handles Crumble Keyboard Input
 * @param socket Socket Connection to Send Input Updates to
 */
function handleKeyboardInput(socket: SocketIOClient.Socket) {
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

            // Instantiate Chunks
            gameData.level?.chunks.forEach((pos: any) => {
                const CHUNK_POS = new Vec2(pos.x, pos.y);

                loadedChunks.push(new Chunk(CHUNK_POS));
            });

            // Start Game
            handleKeyboardInput(socket);
            startGame();
        }
        else {
            $("#name-choose-menu").css("display", "none");
            $("#match-wait-menu").css("display", "block");
        }
    });

    // Player Leave Event
    socket.on(SocketEvents.PLAYER_LEAVE, (socketId: string) => {
        console.log(`Player of Socket ID "${socketId}" has Left`);

        deleteRenderController(connectedPlayers[socketId]);
        deleteRenderController(connectedPlayers[socketId].shadow);
        deleteRenderController(connectedPlayers[socketId].nametag);

        delete connectedPlayers[socketId];
    });

    // Game Events

    // Player Move Event
    socket.on(GameEvents.PLAYER_MOVE, (player: IPlayerData) => {

        // Move Player
        connectedPlayers[player.socketId as string].serverPos = new Vec2(player.pos.x, player.pos.y);
        connectedPlayers[player.socketId as string].direction = player.direction;
    });

    // Player Death Event
    socket.on(GameEvents.PLAYER_DIED, (deathInfo: IPlayerDeathData) => {
        if (connectedPlayers[clientSocketId].socketId === deathInfo.socketId) {
            clearInterval(inputUpdateInterval);
        }

        // Trigger On Death Event
        connectedPlayers[deathInfo.socketId].onDeath(deathInfo.fellOffFront);
    });

    // On Player Win Event
    socket.on(GameEvents.PLAYER_WON, (socketId: string) => {
        clearInterval(inputUpdateInterval);
        displayWinner(connectedPlayers[socketId].name, clientSocketId === socketId);
    });
}