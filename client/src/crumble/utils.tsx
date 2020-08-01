/**
 * Crumble Client Main Ulitity File
 * @author Connell Reffo
 */

import { Chunk, ChunkEdge } from "./game";

/**
 * Colour of the Canvas Background
 */
export const BG_COLOUR = "#121212";

/**
 * Colour of Chunk Ground
 */
export const CHUNK_GROUND_COLOUR = "#c2c2c2";

/**
 * Colour of Chunk Edge
 */
export const CHUNK_EDGE_COLOUR = "#9c9c9c";

/**
 * Colour of Tile Destruction Particles
 */
export const TILE_DESTROY_PARTICLE_COLOUR = "#ff6d57";

/**
 * Nametag Colour for the Client Player
 */
export const NAMETAG_SELF_COLOUR = "#33b862";

/**
 * Nametag Colour for the Opposing Player(s)
 */
export const NAMETAG_ENEMY_COLOUR = "#f71e42";

/**
 * Vertical Offset of Shadow from the Player
 */
export const PLAYER_SHADOW_OFFSET = 32;

/**
 * Vertical Offset of Nametag from the Player
 */
export const PLAYER_NAMETAG_OFFSET = 53;

/**
 * Lowest Render Layer (Bottom)
 */
export const MIN_LAYER = 0;

/**
 * Highest Render Layer (Top)
 */
export const MAX_LAYER = 10;

/**
 * Height of a Chunk's Edge
 */
export const CHUNK_EDGE_HEIGHT = 45;

/**
 * Size of Tiles
 */
export const TILE_SIZE = 60;

/**
 * Size of Chunks in Tiles
 */
export const CHUNK_SIZE = 4;

/**
 * Total Size of a Chunk
 */
export const TOTAL_CHUNK_SIZE = TILE_SIZE * CHUNK_SIZE;

/**
 * Solves Pixel Gap Between Chunks
 */
export const CHUNK_SIZE_PADDING = 2;

/**
 * Delay Between Input Updates Sent to the Server
 */
export const SEND_INPUT_MS = 100;

/**
 * Warning Time Before a Tile Destroys
 */
export const TILE_DESTROY_WARNING_MS = 1500;

/**
 * Dimensions of Player Sprite
 */
export const PLAYER_DIMENSIONS = {
    scale: 7.5,
    width: 5,
    height: 9,
    frames: 8
}

/**
 * Represents Animation Possible States a Player can be in
 */
export enum PlayerAnimationStates {
    IDLE = "idle",
    RUN = "run"
}

export interface IParticle {
    pos: Vec2,
    size: number,
    maxLifetimeFrames: number, 
    lifetimeFrames: number,
    direction: {
        rise: number,
        run: number
    }
}

/**
 * Represents Object Data of Players Sent from the Socket Server
 */
export interface IPlayerData {
    socketId?: string
    name: string,
    direction: FacingDirections,
    pos: {
        x: number,
        y: number
    }
}

/**
 * Represents Game Data Sent to Client When Match Starts
 */
export interface IGameData {
    start: boolean,
    level?: ILevelMap,
    players?: object
}

/**
 * Represents Data about Player Death
 */
export interface IPlayerDeathData {
    socketId: string,
    fellOffFront: boolean
}

/**
 * Represents Level Data From the Server
 */
export interface ILevelMap {
    chunks: Array<Vec2>
}

/**
 * Enumeration of Events that Will Take Place on the Socket Client
 */
export enum SocketEvents {
    CONNECTED = "connect",
    REGISTER = "register",
    PLAYER_LEAVE = "leave",
    START_GAME = "startgame",
    RECV_ID = "id"
}

/**
 * Enumeration of Events that Will Take Place in Game
 */
export enum GameEvents {
    PLAYER_MOVE = "playermove",
    PLAYER_DIED = "playerdied",
    PLAYER_WON = "playerwon",
    TILE_DESTROYED = "tiledestroyed"
}

/**
 * Enumeration of Directions the Player can Face
 */
export enum FacingDirections {
    LEFT = "left",
    RIGHT = "right"
}

/**
 * Enumeration of Possible Directions a Player can Move
 */
export enum Directions {
    UP = "up",
    DOWN = "down",
    LEFT = "left",
    RIGHT = "right"
}

/**
 * Generates Edges on a Given Map
 * @param chunks The Chunks to Generate Edges for
 */
export function generateChunkEdges(chunks: Array<Chunk>): Array<Chunk> {
    let finalChunks: Array<Chunk> = [];

    chunks.forEach((chunk) => {
        let isBottom = true;

        for (let chunkKey in chunks) {
            const CHUNK = chunks[chunkKey];

            if (CHUNK.chunkPos.y === chunk.chunkPos.y + 1 && CHUNK.chunkPos.x === chunk.chunkPos.x) {
                isBottom = false;
                break;
            }
        }

        if (isBottom) {
            chunk.chunkEdge = new ChunkEdge(chunk.chunkPos);
        }
        
        finalChunks.push(chunk);
    });

    return finalChunks;
}

/**
 * Generates a Random Integer in a Range
 * @param min Minimum Value of Output
 * @param max Maximum Value of Output
 */
export function randomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class Vec2 {
    public x: number;
    public y: number;

    public static zero: Vec2 = new Vec2(0, 0);

    /**
     * @param x X Position
     * @param y Y Position
     */
    constructor (x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Lerps Between 2 Different Vectors
     * @param start Start Vector
     * @param end End Vector
     * @param amount Lerp Amount
     */
    public static lerp(start: Vec2, end: Vec2, amount: number): Vec2 {
        return new Vec2((1 - amount) * start.x + amount * end.x, (1 - amount) * start.y + amount * end.y);
    }
}