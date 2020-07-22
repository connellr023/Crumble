/**
 * Crumble Server Main Game Handler
 * @author Connell Reffo
 */

import { io } from "./server";
import { Vec2, randomInt, isColliding, GameEvents, SocketEvents, Directions, PLAYER_SPEED, MAX_PLAYERS, PLAYER_DIMENSIONS } from "./utils";

import * as socketIo from "socket.io";

/**
 * Tracks all active online games
 */
export let activeGames: Array<Game> = [];

export class Player {
    public name: string; 
    public position: Vec2;
    public direction: number;

    /**
     * @param name Name of Player
     * @param position Position of Player
     * @param direction Direction Player is Facing
     * @param socketId The Socket ID of the Connected Player
     */
    constructor (name: string, position: Vec2, direction: number) {
        this.name = name;
        this.position = position;
        this.direction = direction;
    }
}

export class Game {
    public lobbyId: string;
    public players: object = {};
    public namespace: socketIo.Namespace;

    constructor() {
        
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

        this.setup();
    }

    /**
     * Pushes a New Player Instance to the Players Array
     * @param name Name of Player
     * @param socketId ID of Active Socket Connection
     */
    public addPlayer(name: string, socketId: string) {
        const PLAYER = new Player(name, Vec2.random(0, 160), 0);
        this.players[socketId] = PLAYER;
    }

    /**
     * Removes Player by Socket from Players Array
     * @param socketId Socket ID of Player to Remove
     */
    public removePlayer(socketId: string) {
        delete this.players[socketId];
    }

    /**
     * Executes When the Game Starts
     */
    public setup() {
        
        // Setup Namespace
        this.namespace.on(SocketEvents.CONNECTION, (socket) => {

            // Socket Player Register Event
            socket.on(SocketEvents.REGISTER, (name: string) => {
                this.addPlayer(name, socket.id);
                console.log(`[+] Added Player "${name}" to "${this.namespace.name}"`);

                const START_GAME = (Object.keys(this.players).length === MAX_PLAYERS);

                if (START_GAME) {
                    let playersObject = {};

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

                    this.namespace.emit(SocketEvents.START_GAME, {
                        start: true,
                        players: playersObject
                    });
                }
                else {
                    this.namespace.emit(SocketEvents.START_GAME, {
                        start: false
                    });
                }

                // Send Socket ID to the Client
                socket.emit(SocketEvents.SEND_ID, socket.id);
            });

            // Socket Disconnect Event
            socket.on(SocketEvents.DISCONNECT, () => {
                this.namespace.emit(SocketEvents.PLAYER_LEAVE, socket.id);

                delete io.nsps[this.namespace.name];
                activeGames = activeGames.filter((game) => {
                    return game.lobbyId !== this.lobbyId;
                });

                console.log(`[x] Closed Game "${this.lobbyId}" Due to Socket ID "${socket.id}"`);
            });

            // Game Events

            // Player Movement Event
            socket.on(GameEvents.PLAYER_MOVE, (direction: Directions) => {
                
                // Check for Collisions
                let collisionDir: Directions;

                for (let socketId in this.players) {
                    if (socketId !== socket.id) {
                        const POS1 = this.players[socket.id].position as Vec2; // Current Player
                        const POS2 = this.players[socketId].position as Vec2; // Opponent Player

                        const COLLIDING = isColliding(
                            POS1,
                            PLAYER_DIMENSIONS.width,
                            PLAYER_DIMENSIONS.height,
                            POS2,
                            PLAYER_DIMENSIONS.width,
                            PLAYER_DIMENSIONS.height
                        );

                        // Check Direction
                        if (COLLIDING) {
                            const ON_TOP = (Math.abs(POS1.y - POS2.y) - 10 <= PLAYER_DIMENSIONS.height / 2);

                            if (direction === Directions.RIGHT || direction === Directions.LEFT) {
                                if (POS1.x >= POS2.x && ON_TOP) {
                                    collisionDir = Directions.LEFT
                                }
                                else if (ON_TOP) {
                                    collisionDir = Directions.RIGHT
                                }
                            }
                            else {
                                const ON_SIDE = (Math.abs(POS1.x - POS2.x) <= PLAYER_DIMENSIONS.width / 2);

                                if (POS1.y >= POS2.y && ON_SIDE) {
                                    collisionDir = Directions.UP
                                }
                                else if (ON_SIDE) {
                                    collisionDir = Directions.DOWN
                                }
                            }
                        }
                        else {
                            collisionDir = null;
                        }
                    }
                }

                // Move Player on the Server Side
                if (direction !== collisionDir) {
                    switch (direction) {
                        case Directions.UP:
                            this.players[socket.id].position = new Vec2(this.players[socket.id].position.x, this.players[socket.id].position.y - PLAYER_SPEED);
                            break;
                        case Directions.DOWN:
                            this.players[socket.id].position = new Vec2(this.players[socket.id].position.x, this.players[socket.id].position.y + PLAYER_SPEED);
                            break;
                        case Directions.LEFT:
                            this.players[socket.id].position = new Vec2(this.players[socket.id].position.x - PLAYER_SPEED, this.players[socket.id].position.y);
                            break;
                        case Directions.RIGHT:
                            this.players[socket.id].position = new Vec2(this.players[socket.id].position.x + PLAYER_SPEED, this.players[socket.id].position.y);
                            break;
                    }
    
                    // Sync Player Position with all Clients
                    this.namespace.emit(GameEvents.PLAYER_MOVE, {
                        socketId: socket.id,
                        direction: 0,
                        name: this.players[socket.id].name,
                        pos: {
                            x: this.players[socket.id].position.x,
                            y: this.players[socket.id].position.y
                        }
                    });
                }
            });
        });
    }

    /**
     * Executes Once Every Game Tick
     */
    public tick() {

    }
}