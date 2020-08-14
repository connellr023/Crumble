/**
 * Crumble Server Main Game Handler
 * @author Connell Reffo
 */

import { IO } from "./server";
import { Vec2, ILevelMap, IProjectile, randomInt, GameEvents, SocketEvents, Directions, TEST_MAP, TOTAL_CHUNK_SIZE, TICK_MS, DESTROY_TILE_TICKS, TILE_DESTROY_WARNING_MS, CHUNK_SIZE, IConnectedPlayer, IAngleChangeData, MAX_NAME_LENGTH, ROCKET_UPDATE_TICKS, MAX_ROCKET_LIFETIME, TILE_SIZE, TILE_DIMENSIONS, PLAYER_DIMENSIONS, CHUNK_HEIGHT_OFFSET, CHUNK_WIDTH_OFFSET } from "./utils";
import { Collider, CollisionSources } from "./collision";

import Player from "./gameobjects/player";

import * as socketIo from "socket.io";

/**
 * Tracks all active online games
 */
export let activeGames: Array<Game> = [];

/**
 * Represents an Instance of an Online Crumble Match
 */
export default class Game {
    public lobbyId: string;
    public maxPlayers = 2;

    public players: IConnectedPlayer = {};
    public rockets: IProjectile = {};

    public namespace: socketIo.Namespace;

    public loadedMap: ILevelMap;
    
    private ticker: NodeJS.Timeout;
    private ticks: number = 0;

    private availableTiles: Array<Vec2> = [];
    private destroyedTiles: Array<Vec2> = []; 

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
        
        this.namespace = IO.of(`/lobbies/${this.lobbyId}`);

        this.start();
    }

    /**
     * Pushes a New Player Instance to the Players Array
     * @param name Name of Player
     * @param socketId ID of Active Socket Connection
     */
    private addPlayer(name: string, socketId: string) {
        const PLAYER = new Player(name, Vec2.zero, socketId, this);
        this.players[socketId] = PLAYER;
    }

    /**
     * Initializes Player Spawn Points
     */
    private initPlayerSpawns() {
        for (let chunkKey = 0; chunkKey< this.loadedMap.chunks.length; chunkKey++) {
            if (chunkKey < Object.keys(this.players).length) {
                const CHUNK_POS = this.loadedMap.chunks[chunkKey];
                const SPAWN_POS = new Vec2(CHUNK_POS.x * TOTAL_CHUNK_SIZE, CHUNK_POS.y * TOTAL_CHUNK_SIZE);

                const PLAYER_KEY = Object.keys(this.players)[chunkKey];

                // Set Position
                this.players[PLAYER_KEY].pos = SPAWN_POS;
                this.players[PLAYER_KEY].collider.pos = SPAWN_POS;
            }
            else {
                break;
            }
        }
    }

    /**
     * Generates Positions for Tiles Based on Each Chunk
     */
    private registerChunkTiles() {
        this.loadedMap.chunks.forEach((chunk) => {

            // Register Chunk Colliders
            new Collider(new Vec2(chunk.x * TOTAL_CHUNK_SIZE, chunk.y * TOTAL_CHUNK_SIZE - CHUNK_HEIGHT_OFFSET), TOTAL_CHUNK_SIZE + CHUNK_WIDTH_OFFSET, TOTAL_CHUNK_SIZE - CHUNK_HEIGHT_OFFSET, CollisionSources.CHUNK);

            // Generate Tiles
            for (let y = 0; y < CHUNK_SIZE; y++) {
                for (let x = 0; x < CHUNK_SIZE; x++) {
                    const TILE_POS = new Vec2(x + (chunk.x * CHUNK_SIZE), y + (chunk.y * CHUNK_SIZE));

                    this.availableTiles.push(TILE_POS);
                }
            }
        });
    }

    /**
     * Returns the Amount of Alive Players
     */
    public getAlivePlayersSocketId(): Array<string> {
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
    public closeLobby() {

        // Delete Current Game
        delete IO.nsps[this.namespace.name];
        activeGames = activeGames.filter((game) => {
            return game.lobbyId !== this.lobbyId;
        });

        // Stop Game Ticker
        clearInterval(this.ticker);

        console.log(`[x] Closed Lobby "${this.lobbyId}"`);
    }

    /**
     * Destroys a Tile at a Given Position
     * @param tilePos Position of Tile to Destroy
     */
    private destroyTile(tilePos: Vec2) {
        this.loadedMap.destroyedTiles.push(tilePos);
        this.namespace.emit(GameEvents.TILE_DESTROYED, tilePos);

        this.availableTiles = this.availableTiles.filter((tile) => {
            return tile != tilePos;
        });

        setTimeout(() => {

            // Register Destroyed Tile
            this.destroyedTiles.push(tilePos);

            // Create Destroyed Tile Collider
            const TILE_COLLIDER_POS = new Vec2(tilePos.x * TILE_SIZE - (TILE_SIZE * 1.5), tilePos.y * TILE_SIZE - (TILE_SIZE * 2));

            new Collider(TILE_COLLIDER_POS, TILE_DIMENSIONS.width, TILE_DIMENSIONS.height, CollisionSources.DESTROYED_TILE);

            // Check if Player(s) Should be Dead
            for (let socketId in this.players) {
                this.players[socketId].checkDeath();
            }
        }, TILE_DESTROY_WARNING_MS);
    }
    
    /**
     * Checks if the Game is Over and a Winner Should be Decided
     */
    public checkWinner() {
        const ALIVE_PLAYERS = this.getAlivePlayersSocketId()

        if (ALIVE_PLAYERS.length < 2) {
            if (ALIVE_PLAYERS.length === 1) {
                this.namespace.emit(GameEvents.PLAYER_WON, ALIVE_PLAYERS[0]);
            }

            this.closeLobby();
        }
    }

    /**
     * Initializes the Game Ticker
     */
    private initTicker() {
        this.ticker = setInterval(() => {
            this.tick();
            this.ticks++;
        }, TICK_MS);
    }

    /**
     * Executes When the Game Starts
     */
    private start() {
        
        // Setup Namespace
        this.namespace.on(SocketEvents.CONNECTION, (socket) => {

            // Socket Player Register Event
            socket.on(SocketEvents.REGISTER, (name: string) => {

                // Make Sure Name is Not too Long
                name = name.trim().substr(0, MAX_NAME_LENGTH);

                // Add Player
                this.addPlayer(name, socket.id);
                console.log(`[+] Added Player "${name}" to "${this.namespace.name}"`);

                // Send Socket ID to the Client
                socket.emit(SocketEvents.SEND_ID, socket.id);

                // Verify if Game Should Start
                const START_GAME = (Object.keys(this.players).length === this.maxPlayers);

                if (START_GAME) {
                    this.initPlayerSpawns();
                    this.registerChunkTiles();

                    let playersObject = {};

                    // Parse Player Data into an Object
                    for (let socketId in this.players) {
                        const PLAYER = this.players[socketId] as Player;

                        playersObject[socketId] = {
                            name: PLAYER.name,
                            pos: {
                                x: PLAYER.pos.x,
                                y: PLAYER.pos.y
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

                    // Initialize Game Ticker
                    this.initTicker();
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
                this.players[socket.id].disconnect();
            });

            // Game Events

            // Player Movement Event
            socket.on(GameEvents.PLAYER_MOVE, (movementDir: Directions) => {
                this.players[socket.id].move(movementDir);
            });

            // Player Handrocket Angle Change Event
            socket.on(GameEvents.ANGLE_CHANGE, (res: IAngleChangeData) => {
                this.players[socket.id].handrocketAngle = res.angle;
                this.players[socket.id].direction = res.direction;

                this.namespace.emit(GameEvents.ANGLE_CHANGE, {
                    socketId: socket.id,
                    angle: res.angle,
                    direction: res.direction
                });
            });

            // Rocket Shoot Event
            socket.on(GameEvents.ROCKET_SHOT, () => {
                this.players[socket.id].fireRocket();
            });
        });
    }

    /**
     * Executes Continuously
     */
    private tick() { 
        if (this.ticks % DESTROY_TILE_TICKS === 0) { // Periodic Tile Destruction
            const RAND_TILE_INDEX = randomInt(0, this.availableTiles.length);
            const TILE_POS = this.availableTiles[RAND_TILE_INDEX];

            if (TILE_POS != null) {
                this.destroyTile(TILE_POS);
            }
        }
        else if (this.ticks % ROCKET_UPDATE_TICKS === 0) { // Rocket Projectile Movement
            for (let instanceId in this.rockets) {

                // Check Rocket Lifetime
                if (this.rockets[instanceId].lifetime < MAX_ROCKET_LIFETIME) {

                    // Increment Lifetime Counter
                    this.rockets[instanceId].lifetime++;

                    // Move Rocket on Server Side
                    this.rockets[instanceId].move();
                }
                else {

                    // Tell Clients Rocket is Destroyed
                    this.namespace.emit(GameEvents.ROCKET_EXPLODE, instanceId);

                    // Delete Server Side Rocket Instance
                    delete this.rockets[instanceId];
                }  
            }
        }
    }
}