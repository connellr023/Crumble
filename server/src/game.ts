/**
 * Crumble Server Main Game Handler
 * @author Connell Reffo
 */

import { io } from "./server";
import { Player } from "./gameobjects";
import { Vec2, ILevelMap, randomInt, Collider, GameEvents, SocketEvents, Directions, FacingDirections, PLAYER_SPEED, MAX_PLAYERS, PLAYER_DIMENSIONS, TEST_MAP, CHUNK_SIZE } from "./utils";

import * as socketIo from "socket.io";

/**
 * Tracks all active online games
 */
export let activeGames: Array<Game> = [];

/**
 * Represents an Instance of an Online Crumble Match
 */
export class Game {
    public lobbyId: string;
    public players: object = {};
    public namespace: socketIo.Namespace;

    private loadedMap: ILevelMap;

    constructor() {

        // Load Map
        this.loadedMap = TEST_MAP;
        
        // Generate Lobby ID
        this.lobbyId = activeGames.length + randomInt(0, 100).toString();
    }

    /**
     * Registers the Current Game Instance as Active
     */
    public registerActiveGame() {
        activeGames.push(this);
        console.log(`[+] Opened Game "${this.lobbyId}"`);

        this.namespace = io.of(`/lobbies/${this.lobbyId}`);

        this.start();
    }

    /**
     * Pushes a New Player Instance to the Players Array
     * @param name Name of Player
     * @param socketId ID of Active Socket Connection
     */
    private addPlayer(name: string, socketId: string) {
        const PLAYER = new Player(name, Vec2.zero);
        this.players[socketId] = PLAYER;
    }

    /**
     * Initializes Player Spawn Points
     */
    private initPlayerSpawns() {
        for (let chunkKey = 0; chunkKey< this.loadedMap.chunks.length; chunkKey++) {
            if (chunkKey < Object.keys(this.players).length) {
                const CHUNK_POS = this.loadedMap.chunks[chunkKey];
                const SPAWN_POS = new Vec2(CHUNK_POS.x * CHUNK_SIZE, CHUNK_POS.y * CHUNK_SIZE);

                const PLAYER_KEY = Object.keys(this.players)[chunkKey];

                console.log(this.players[PLAYER_KEY]);
                this.players[PLAYER_KEY].position = SPAWN_POS;
            }
            else {
                break;
            }
        }
    }

    /**
     * Returns the Amount of Alive Players
     */
    private getAlivePlayersSocketId(): Array<string> {
        let socketIds: Array<string> = [];

        for (let key in this.players) {
            if (!this.players[key].dead) {
                socketIds.push(key);
            }
        }

        return socketIds;
    }

    /**
     * Deletes the Current Instance of an Active Game
     */
    private closeLobby() {

        // Delete Current Game
        delete io.nsps[this.namespace.name];
        activeGames = activeGames.filter((game) => {
            return game.lobbyId !== this.lobbyId;
        });

        console.log(`[x] Closed Lobby "${this.lobbyId}"`);
    }

    /**
     * Updates a Connected Player With new Data Based on their Movement Input
     * @param socketId The Socket ID of the Player to Update
     * @param movementDir The Direction of the Player's Movement
     */
    private processInputUpdate(socketId: string, movementDir: Directions) {
        switch (movementDir) {
            case Directions.UP:
                this.players[socketId].position = new Vec2(this.players[socketId].position.x, this.players[socketId].position.y - PLAYER_SPEED);
                break;
            case Directions.DOWN:
                this.players[socketId].position = new Vec2(this.players[socketId].position.x, this.players[socketId].position.y + PLAYER_SPEED);
                break;
            case Directions.LEFT:
                this.players[socketId].position = new Vec2(this.players[socketId].position.x - PLAYER_SPEED, this.players[socketId].position.y);
                this.players[socketId].direction = FacingDirections.LEFT;
                break;
            case Directions.RIGHT:
                this.players[socketId].position = new Vec2(this.players[socketId].position.x + PLAYER_SPEED, this.players[socketId].position.y);
                this.players[socketId].direction = FacingDirections.RIGHT;
                break;
        }
    }

    /**
     * Handles Collisions Bewteen Players Asynchronously
     * @param colliderSocketId The Socket ID that Initiated the Collision
     * @param movementDir Direction the Player was Moving
     */
    private async processPlayerCollisions(colliderSocketId: string, movementDir: Directions): Promise<Directions> {
        return new Promise((resolve) => {
            let playerCollisionDir: Directions = null;

            // Loop Through All Connected Players
            for (let socketId in this.players) {
                if (socketId !== colliderSocketId && !this.players[socketId].dead) {

                    // Current Player
                    const COLLIDER_1 = new Collider(
                        this.players[colliderSocketId].position as Vec2,
                        PLAYER_DIMENSIONS.width,
                        PLAYER_DIMENSIONS.height
                    );

                    // Opponent Player
                    const COLLIDER_2 = new Collider(
                        this.players[socketId].position as Vec2,
                        PLAYER_DIMENSIONS.width,
                        PLAYER_DIMENSIONS.height
                    );

                    const COLLIDING = Collider.isColliding(COLLIDER_1, COLLIDER_2);

                    // Check Direction
                    if (COLLIDING) {
                        const ON_TOP = (Math.abs(COLLIDER_1.pos.y - COLLIDER_2.pos.y) - 10 <= PLAYER_DIMENSIONS.height / 2);

                        if (movementDir === Directions.RIGHT || movementDir === Directions.LEFT) {
                            if (COLLIDER_1.pos.x >= COLLIDER_2.pos.x && ON_TOP) {
                                playerCollisionDir = Directions.LEFT
                            }
                            else if (ON_TOP) {
                                playerCollisionDir = Directions.RIGHT
                            }
                        }
                        else {
                            const ON_SIDE = (Math.abs(COLLIDER_1.pos.x - COLLIDER_2.pos.x) <= PLAYER_DIMENSIONS.width / 2);

                            if (COLLIDER_1.pos.y >= COLLIDER_2.pos.y && ON_SIDE) {
                                playerCollisionDir = Directions.UP
                            }
                            else if (ON_SIDE) {
                                playerCollisionDir = Directions.DOWN
                            }
                        }
                    }
                }
            }

            // Resolve Player Collision Direction
            resolve(playerCollisionDir);
        });
    }

    /**
     * Checks if a Given Player is Within the Map Boundries
     * @param socketId Socket ID of Player to Check
     */
    private async playerWithinMap(socketId: string): Promise<{fellOffFront: boolean, withinMap: boolean}> {
        return new Promise((resolve) => {
            const PLAYER_POS = this.players[socketId].position as Vec2;
                
            let playerHitboxVertOffset = 50;
            let withinMap = false;
            let fellOffFront = false;

            for (let key in this.loadedMap.chunks) {
                let chunkPos = this.loadedMap.chunks[key];

                const PLAYER_HITBOX = PLAYER_DIMENSIONS.width;
                const CHUNK_WIDTH_PADDING = 15;

                // Check if Player is on the Front or the Back of the Chunk
                if (PLAYER_POS.y <= chunkPos.y * CHUNK_SIZE + PLAYER_DIMENSIONS.height) {
                    playerHitboxVertOffset = 4;           
                }
                else {
                    fellOffFront = true;
                }

                // Create Colliders
                const PLAYER_COLLIDER = new Collider(
                    new Vec2(PLAYER_POS.x, PLAYER_POS.y + playerHitboxVertOffset),
                    PLAYER_HITBOX,
                    PLAYER_HITBOX,
                );

                const CHUNK_COLLIDER = new Collider(
                    new Vec2(chunkPos.x * CHUNK_SIZE, chunkPos.y * CHUNK_SIZE),
                    CHUNK_SIZE + PLAYER_DIMENSIONS.width + CHUNK_WIDTH_PADDING,
                    CHUNK_SIZE + PLAYER_DIMENSIONS.height
                );

                // Check if Inside Chunk
                const INSIDE_CHUNK = Collider.isColliding(PLAYER_COLLIDER, CHUNK_COLLIDER);

                if (INSIDE_CHUNK) {
                    withinMap = true;
                    break;
                }
            }

            // Resolve Chunk Boundry Data
            resolve({
                fellOffFront: fellOffFront,
                withinMap: withinMap
            });
        });
    }

    /**
     * Executes When the Game Starts
     */
    public start() {
        
        // Setup Namespace
        this.namespace.on(SocketEvents.CONNECTION, (socket) => {

            // Socket Player Register Event
            socket.on(SocketEvents.REGISTER, (name: string) => {
                this.addPlayer(name, socket.id);
                console.log(`[+] Added Player "${name}" to "${this.namespace.name}"`);

                // Send Socket ID to the Client
                socket.emit(SocketEvents.SEND_ID, socket.id);

                // Verify if Game Should Start
                const START_GAME = (Object.keys(this.players).length === MAX_PLAYERS);

                if (START_GAME) {
                    this.initPlayerSpawns();
                    let playersObject = {};

                    // Parse Player Data into an Object
                    for (let socketId in this.players) {
                        const PLAYER = this.players[socketId] as Player;

                        playersObject[socketId] = {
                            name: PLAYER.name,
                            pos: {
                                x: PLAYER.position.x,
                                y: PLAYER.position.y
                            },
                            direction: PLAYER.direction
                        };
                    }

                    // Send Player Data to Clients
                    this.namespace.emit(SocketEvents.START_GAME, {
                        start: true,
                        level: this.loadedMap,
                        players: playersObject
                    });
                }
                else {

                    // Send Game Ready State to Clients
                    this.namespace.emit(SocketEvents.START_GAME, {
                        start: false
                    });
                }
            });

            // Socket Disconnect Event
            socket.on(SocketEvents.DISCONNECT, () => {

                // Tell All Clients a Player has Left
                this.namespace.emit(SocketEvents.PLAYER_LEAVE, socket.id);
                this.players[socket.id].dead = true;

                // Check if there Should be Winner
                const ALIVE_PLAYERS = this.getAlivePlayersSocketId()

                if (ALIVE_PLAYERS.length < 2) {
                    if (ALIVE_PLAYERS.length === 1) {
                        this.namespace.emit(GameEvents.PLAYER_WON, ALIVE_PLAYERS[0]);
                    }

                    this.closeLobby();
                }

                console.log(`[x] "${this.players[socket.id].name}" Has Left`);
            });

            // Game Events

            // Player Movement Event
            socket.on(GameEvents.PLAYER_MOVE, (movementDir: Directions) => {
                
                // Check for Player Collisions
                const PLAYER_COLLISION_DIR = this.processPlayerCollisions(socket.id, movementDir);

                // Check if Player is Within the Map Boundries
                const PLAYER_WITHIN_MAP = this.playerWithinMap(socket.id);

                // Process Promise Results
                PLAYER_COLLISION_DIR.then((playerCollisionDir) => {
                    PLAYER_WITHIN_MAP.then((playerBoundryData) => {

                        // Parse Boundry Data into Constants
                        const WITHIN_MAP = playerBoundryData.withinMap;
                        const FELL_OFF_FRONT = playerBoundryData.fellOffFront;

                        // Move Player on the Server Side
                        if (movementDir !== playerCollisionDir && WITHIN_MAP) {

                            // Update Player Positon and Facing Direction based on Client Movement Input
                            this.processInputUpdate(socket.id, movementDir);
                            
                            // Sync Player Position with all Clients
                            this.namespace.emit(GameEvents.PLAYER_MOVE, {
                                socketId: socket.id,
                                direction: this.players[socket.id].direction,
                                pos: {
                                    x: this.players[socket.id].position.x,
                                    y: this.players[socket.id].position.y
                                }
                            });
                        }
                        else if (!WITHIN_MAP) {

                            // Tell Clients that this Player is Dead
                            this.players[socket.id].dead = true;
                            this.namespace.emit(GameEvents.PLAYER_DIED, {
                                socketId: socket.id,
                                fellOffFront: FELL_OFF_FRONT
                            });

                            // Check if Game is Over
                            const ALIVE_PLAYERS = this.getAlivePlayersSocketId();

                            if (ALIVE_PLAYERS.length === 1) {
                                this.namespace.emit(GameEvents.PLAYER_WON, ALIVE_PLAYERS[0]);
                                this.closeLobby();
                            }
                        }
                    });
                });
            });
        });
    }
}