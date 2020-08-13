/**
 * Crumble Server Main Game Handler
 * @author Connell Reffo
 */

import { IO } from "./server";
import { Player, RocketProjectile } from "./gameobjects";
import { Vec2, ILevelMap, IProjectile, randomInt, Collider, GameEvents, SocketEvents, Directions, FacingDirections, PLAYER_DIMENSIONS, TEST_MAP, TOTAL_CHUNK_SIZE, TICK_MS, DESTROY_TILE_TICKS, TILE_DESTROY_WARNING_MS, CHUNK_SIZE, IConnectedPlayer, IAngleChangeData, MAX_NAME_LENGTH, SHOOT_COOLDOWN_MS, IPlayerObstructionData, HandrocketAngles, HANDROCKET_KNOCKBACK_FORCE, ROCKET_UPDATE_TICKS, MAX_ROCKET_LIFETIME } from "./utils";

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
    public maxPlayers = 2;

    public players: IConnectedPlayer = {};
    public rockets: IProjectile = {};

    private namespace: socketIo.Namespace;

    private loadedMap: ILevelMap;
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
                const SPAWN_POS = new Vec2(CHUNK_POS.x * TOTAL_CHUNK_SIZE, CHUNK_POS.y * TOTAL_CHUNK_SIZE);

                const PLAYER_KEY = Object.keys(this.players)[chunkKey];

                this.players[PLAYER_KEY].pos = SPAWN_POS;
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
        delete IO.nsps[this.namespace.name];
        activeGames = activeGames.filter((game) => {
            return game.lobbyId !== this.lobbyId;
        });

        // Stop Game Ticker
        clearInterval(this.ticker);

        console.log(`[x] Closed Lobby "${this.lobbyId}"`);
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
                        this.players[colliderSocketId].pos as Vec2,
                        PLAYER_DIMENSIONS.width,
                        PLAYER_DIMENSIONS.height
                    );

                    // Opponent Player
                    const COLLIDER_2 = new Collider(
                        this.players[socketId].pos as Vec2,
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
            const PLAYER_POS = this.players[socketId].pos as Vec2;
                
            let playerHitboxVertOffset = 50;
            let withinMap = false;
            let fellOffFront = false;

            const PLAYER_HITBOX = 20;
            const CHUNK_WIDTH_PADDING = 25;  

            // Check if Inside any Chunk
            for (let key in this.loadedMap.chunks) {
                let chunkPos = this.loadedMap.chunks[key];

                // Check if Player is on the Front or the Back of the Chunk
                if (PLAYER_POS.y <= chunkPos.y * TOTAL_CHUNK_SIZE + PLAYER_DIMENSIONS.height) {
                    playerHitboxVertOffset = 4;           
                }
                else {
                    fellOffFront = true;
                }

                // Initialize Colliders
                const PLAYER_COLLIDER = new Collider(
                    new Vec2(PLAYER_POS.x, PLAYER_POS.y + playerHitboxVertOffset),
                    PLAYER_HITBOX,
                    PLAYER_HITBOX,
                );

                const CHUNK_COLLIDER = new Collider(
                    new Vec2(chunkPos.x * TOTAL_CHUNK_SIZE, chunkPos.y * TOTAL_CHUNK_SIZE),
                    TOTAL_CHUNK_SIZE + PLAYER_DIMENSIONS.width + CHUNK_WIDTH_PADDING,
                    TOTAL_CHUNK_SIZE + PLAYER_DIMENSIONS.height
                );

                // Check if Inside Chunk
                const INSIDE_CHUNK = Collider.isColliding(PLAYER_COLLIDER, CHUNK_COLLIDER);

                if (INSIDE_CHUNK) {
                    withinMap = true;
                    break;
                }
            }

            // Check if On Destroyed Tile
            if (withinMap) {
                const TILE_SIZE = TOTAL_CHUNK_SIZE / CHUNK_SIZE;

                const TILE_HITBOX_DIMENSIONS = {
                    width: 15,
                    height: 15,
                    vertOffset: 4
                }

                for (let key in this.destroyedTiles) {
                    const TILE_POS = this.destroyedTiles[key];

                    // Initialize Colliders
                    const TILE_COLLIDER = new Collider(
                        new Vec2(TILE_POS.x * TILE_SIZE - (TILE_SIZE * 1.5), TILE_POS.y * TILE_SIZE - (TILE_SIZE * 1.5) + TILE_HITBOX_DIMENSIONS.vertOffset),
                        TILE_HITBOX_DIMENSIONS.width,
                        TILE_HITBOX_DIMENSIONS.height
                    );

                    const PLAYER_COLLIDER = new Collider(
                        new Vec2(PLAYER_POS.x, PLAYER_POS.y + 40),
                        PLAYER_HITBOX,
                        PLAYER_HITBOX,
                    );

                    const ON_DESTROYED_TILE = Collider.isColliding(PLAYER_COLLIDER, TILE_COLLIDER);
                    
                    if (ON_DESTROYED_TILE) {
                        withinMap = false;
                        fellOffFront = false;
                    }
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
     * Returns Level Obstruction Data
     * @param socketId The Socket ID of the Player to Check
     * @param movementDir The Direction to Check
     */
    private playerObstructed(socketId: string, movementDir: Directions): Promise<IPlayerObstructionData> {

        // Return Promise
        return new Promise((resolve) => {

            // Check for Player Collisions
            const PLAYER_COLLISION_DIR = this.processPlayerCollisions(socketId, movementDir);

            // Check if Player is Within the Map Boundries
            const PLAYER_WITHIN_MAP = this.playerWithinMap(socketId);

            // Process Promise Results
            PLAYER_COLLISION_DIR.then((playerCollisionDir) => {
                PLAYER_WITHIN_MAP.then((playerBoundryData) => {

                    // Return Data
                    resolve({
                        withinMap: playerBoundryData.withinMap,
                        fellOffFront: playerBoundryData.fellOffFront,
                        playerCollisionDir: playerCollisionDir
                    });
                });
            });
        });
    }

    /**
     * Syncs a Given Player's Position with All Clients
     * @param socketId The Socket ID of the Player to Sync
     * @param movementDir The Direction the Player will Move in
     * @param movementFunc Callback that Moves the Player in Any Way on the Server Side
     */
    private syncPlayerPositions(socketId: string, movementDir: Directions, movementFunc?: () => void) {

        // Generate Obstruction Data
        this.playerObstructed(socketId, movementDir).then((obstructionData: IPlayerObstructionData) => {

            // Move Player on the Server Side
            if (movementDir !== obstructionData.playerCollisionDir && obstructionData.withinMap) {

                // Update Player Positon and Facing Direction based on Client Movement Input
                if (movementFunc !== undefined) {
                    movementFunc();
                }
                
                // Sync Player Position with all Clients
                this.namespace.emit(GameEvents.PLAYER_MOVE, {
                    socketId: socketId,
                    pos: this.players[socketId].pos
                });
            }
            else if (!obstructionData.withinMap) {

                // Tell Clients that this Player is Dead
                this.players[socketId].dead = true;
                this.namespace.emit(GameEvents.PLAYER_DIED, {
                    socketId: socketId,
                    fellOffFront: obstructionData.fellOffFront
                });

                // Check if Game is Over
                const ALIVE_PLAYERS = this.getAlivePlayersSocketId();

                if (ALIVE_PLAYERS.length === 1) {
                    this.namespace.emit(GameEvents.PLAYER_WON, ALIVE_PLAYERS[0]);
                    this.closeLobby();
                }
            }
        });
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
            this.destroyedTiles.push(tilePos);

            // Check if Players are on Newly Destroyed Tile
            for (let socketId in this.players) {
                this.syncPlayerPositions(socketId, Directions.DOWN);
            }
        }, TILE_DESTROY_WARNING_MS);
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
                this.syncPlayerPositions(socket.id, movementDir, () => {
                    this.players[socket.id].move(movementDir);
                });
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

                // Check if Player Can Shoot
                if (this.players[socket.id].canShoot) {
                    this.players[socket.id].canShoot = false;

                    let horKnockbackDir: Directions;
                    let vertKnockbackDir: Directions;

                    let knockbackVector = Vec2.zero;

                    // Set Horizontal Player Knockback
                    switch(this.players[socket.id].direction) {
                        case FacingDirections.LEFT:
                            knockbackVector.x = 1;
                            horKnockbackDir = Directions.RIGHT;

                            break;
                        
                        case FacingDirections.RIGHT:
                            knockbackVector.x = -1;
                            horKnockbackDir = Directions.LEFT;

                            break;
                    }

                    // Set Vertical Player Knockback
                    switch(this.players[socket.id].handrocketAngle) {
                        case HandrocketAngles.UP:
                            knockbackVector.y = 1;
                            vertKnockbackDir = Directions.DOWN;

                            break;
                        
                        case HandrocketAngles.DOWN:
                            knockbackVector.y = -1;
                            vertKnockbackDir = Directions.UP;

                            break;

                        default:
                            knockbackVector.y = 0;
                            vertKnockbackDir = null;

                            break;
                    }

                    // Instantiate Rocket Projectile
                    const INSTANCE_ID = Object.keys(this.players).length;
                    const DIRECTION = new Vec2(knockbackVector.x * -1, knockbackVector.y * -1);

                    this.rockets[INSTANCE_ID] = new RocketProjectile(this.players[socket.id].pos, DIRECTION, INSTANCE_ID);

                    // Apply Knockback if Not Colliding
                    this.syncPlayerPositions(socket.id, horKnockbackDir, () => {
                        const CALLBACK = () => {
                            this.players[socket.id].knockback(HANDROCKET_KNOCKBACK_FORCE, knockbackVector);

                            // Check if Player Boosted off of the Map
                            setTimeout(() => {
                                this.syncPlayerPositions(socket.id, horKnockbackDir);
                            }, 35);
                        }

                        if (vertKnockbackDir != null) {

                            // Check for Vertical Collisions
                            this.syncPlayerPositions(socket.id, vertKnockbackDir, () => {
                                CALLBACK();
                            });
                        }
                        else {
                            CALLBACK();
                        }
                    });

                    // Server Side Shoot Cooldown
                    setTimeout(() => {
                        this.players[socket.id].canShoot = true;
                    }, SHOOT_COOLDOWN_MS);

                    // Initialize Rocket with Clients
                    this.namespace.emit(GameEvents.ROCKET_SHOT, {
                        ownerSocketId: socket.id,
                        direction: DIRECTION,
                        pos: this.rockets[INSTANCE_ID].pos,
                        instanceId: INSTANCE_ID
                    });
                }
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