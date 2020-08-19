/**
 * Crumble Client Socket Connection
 * @author Connell Reffo
 */

import { displayWinner, displayConnectionError, setEnteredQueue } from "./interface";
import { mousePos } from "./renderer";
import { startGame } from "./game";
import { IGameData, IPlayerData, IPlayerDeathData, SocketEvents, GameEvents, Directions, Vec2, SEND_INPUT_MS, TILE_DESTROY_WARNING_MS, generateChunkEdges, CURSOR_MIDDLE_DEADSPACE, HandrocketAngles, IAngleChangeData, FacingDirections, SHOOT_COOLDOWN_MS, IConnectedPlayer, IProjectile, IRocketData, ITileDestroyedData } from "./utils";

import Camera from "./gameobjects/camera";
import Player from "./gameobjects/player";
import Rocket from "./gameobjects/rocket";
import RenderController from "./gameobjects/controller";

import { Chunk } from "./gameobjects/chunk";

import $ from "jquery";
import io from "socket.io-client";

/**
 * Client Socket Connection
 */
let socket: SocketIOClient.Socket;

/**
 * Event Listener That Handles Mouse Movement
 */
let mouseMovementTracker: () => void;

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
export let connectedPlayers: IConnectedPlayer = {};

/**
 * Tracks Active Handrocket Projectiles from the Server
 */
export let rocketProjectiles: IProjectile = {};

/**
 * Handles Crumble Keyboard and Mouse Input
 * @param socket Socket Connection to Send Input Updates to
 */
function handleInput() {
    let keysPressed: any = {};
    let mousePressed: any = {};

    // Keyboard Input
    document.addEventListener("keydown", (key) => {
        keysPressed[key.key] = true;
    });

    document.addEventListener("keyup", (key) => {
        keysPressed[key.key] = false;
    });

    // Mouse Input
    document.addEventListener("mousedown", (mouse) => {
        mousePressed[mouse.button] = true;
    });

    document.addEventListener("mouseup", (mouse) => {
        mousePressed[mouse.button] = false;
    });

    // On Mouse Move
    let lastHandrocketAngle: HandrocketAngles;
    let lastFacingDir: FacingDirections;

    let canShoot = true;

    mouseMovementTracker = () => {
        const PLAYER_REND_POS = Camera.convertToCameraSpace(connectedPlayers[clientSocketId].pos);

        let handrocketAngle: HandrocketAngles;
        let facingDir: FacingDirections;

        // Determine Angle Based on Mouse Position
        if (mousePos.y < PLAYER_REND_POS.y - CURSOR_MIDDLE_DEADSPACE) {
            handrocketAngle = HandrocketAngles.UP;
        }
        else if (mousePos.y > PLAYER_REND_POS.y + CURSOR_MIDDLE_DEADSPACE) {
            handrocketAngle = HandrocketAngles.DOWN;
        }
        else {
            handrocketAngle = HandrocketAngles.MIDDLE;
        }

        // Determine Facing Direction
        if (mousePos.x < PLAYER_REND_POS.x) {
            facingDir = FacingDirections.LEFT;
        }
        else {
            facingDir = FacingDirections.RIGHT;
        }

        // Send Handrocket Angle to Server
        if (handrocketAngle !== lastHandrocketAngle || facingDir !== lastFacingDir) {
            socket.emit(GameEvents.ANGLE_CHANGE, {
                angle: handrocketAngle,
                direction: facingDir
            });
        }

        lastHandrocketAngle = handrocketAngle;
        lastFacingDir = facingDir;
    }

    document.addEventListener("mousemove", mouseMovementTracker);

    inputUpdateInterval = setInterval(() => {

        // Up and Down Movement
        if (keysPressed["w"]) {
            socket.emit(GameEvents.PLAYER_MOVE, Directions.UP);
            connectedPlayers[socket.id].calcCurrentChunk();
        }
        else if (keysPressed["s"]) {
            socket.emit(GameEvents.PLAYER_MOVE, Directions.DOWN);
            connectedPlayers[socket.id].calcCurrentChunk();
        }

        // Left and Right Movement
        if (keysPressed["a"]) {
            socket.emit(GameEvents.PLAYER_MOVE, Directions.LEFT);
            connectedPlayers[socket.id].calcCurrentChunk();
        }
        else if (keysPressed["d"]) {
            socket.emit(GameEvents.PLAYER_MOVE, Directions.RIGHT);
            connectedPlayers[socket.id].calcCurrentChunk();
        }

        // Handrocket Shoot Input
        if (mousePressed[0]) {
            if (canShoot) {
                canShoot = false;
                socket.emit(GameEvents.ROCKET_SHOT);  

                // Client Side Shoot Cooldown
                setTimeout(() => {
                    canShoot = true;
                }, SHOOT_COOLDOWN_MS);
            }
        }

    }, SEND_INPUT_MS);
}

/**
 * Registers the Crumble Client with the Socket Server
 * @param name Name of the Player
 * @param lobbyId The Lobby ID to Connect to
 */
export function handleClientSocket(name: string, lobbyId: string) {
    socket = io(`ws://${window.location.hostname}/lobbies/${lobbyId}`, {onlyBinaryUpgrades: true, transports: ["websocket"], upgrade: false});

    // Connection Event
    socket.on(SocketEvents.CONNECTED, () => {
        console.log(`Connected to Lobby: ${lobbyId}`);
        
        socket.emit(SocketEvents.REGISTER, name);
    });

    // Disconnect Event
    socket.on(SocketEvents.DISCONNECT, () => {
        clearInterval(inputUpdateInterval);
        document.removeEventListener("mousemove", mouseMovementTracker);

        displayConnectionError("Lost Connection to Server");
    });

    // Recieve Socket ID Event
    socket.on(SocketEvents.RECV_ID, (socketId: string) => {
        clientSocketId = socketId;
    });

    // Register Event
    socket.on(SocketEvents.START_GAME, (gameData: IGameData) => {
        if (gameData.start) {
            setEnteredQueue(false);

            $("#name-choose-menu").css("display", "none");
            $("#match-wait-menu").css("display", "none");

            // Initialize Render Layers
            RenderController.initLayers();

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

            loadedChunks = generateChunkEdges(loadedChunks);

            // Start Game
            handleInput();
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

        connectedPlayers[socketId].destroy();
    });

    // Game Events

    // Player Move Event
    socket.on(GameEvents.PLAYER_MOVE, (player: IPlayerData) => {

        // Set Player Position
        connectedPlayers[player.socketId as string].serverPos = new Vec2(player.pos.x, player.pos.y);
    });

    // Player Death Event
    socket.on(GameEvents.PLAYER_DIED, (deathInfo: IPlayerDeathData) => {
        if (connectedPlayers[clientSocketId].socketId === deathInfo.socketId) {
            clearInterval(inputUpdateInterval);
            document.removeEventListener("mousemove", mouseMovementTracker);
        }

        // Trigger On Death Event
        connectedPlayers[deathInfo.socketId].onDeath(deathInfo.fellOffFront);
    });

    // Create Rocket Event
    socket.on(GameEvents.ROCKET_SHOT, (rocket: IRocketData) => {
        rocketProjectiles[rocket.instanceId] = new Rocket(rocket.pos, rocket.direction as Vec2);

        // Create Muzzle Blast Particles
        connectedPlayers[rocket.ownerSocketId as string].createMuzzleBlast();
    });

    // Rocket Explode Event
    socket.on(GameEvents.ROCKET_EXPLODE, (instanceId: number) => {
        rocketProjectiles[instanceId].explode();
    });

    // Tile Destroy Event
    socket.on(GameEvents.TILE_DESTROYED, (res: ITileDestroyedData) => {
        let destroyTime = 0;

        if (!res.instant) {
            destroyTime = TILE_DESTROY_WARNING_MS;
        }

        // Loop Through All Chunks to Find Tile
        for (let chunkKey in loadedChunks) {
            const CHUNK = loadedChunks[chunkKey];

            // Loop Through Each Tile in Chunk
            for (let tileKey in CHUNK.tiles) {
                const TILE = CHUNK.tiles[tileKey];

                if (TILE.tilePos.x === res.pos.x && TILE.tilePos.y === res.pos.y) {

                    // Destroy Correct Tile
                    loadedChunks[chunkKey].tiles[tileKey].destroy(destroyTime);
                    break;
                }
            }
        }
    });

    // On Player Win Event
    socket.on(GameEvents.PLAYER_WON, (socketId: string) => {
        clearInterval(inputUpdateInterval);
        document.removeEventListener("mousemove", mouseMovementTracker);
    
        setTimeout(() => {
            displayWinner(connectedPlayers[socketId].name, clientSocketId === socketId);
        }, 1000);
    });

    // On Handrocket Angle Change Event
    socket.on(GameEvents.ANGLE_CHANGE, (res: IAngleChangeData) => {
        connectedPlayers[res.socketId].setHandrocketAngle(res.angle);
        connectedPlayers[res.socketId].direction = res.direction;
    });
}