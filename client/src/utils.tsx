/**
 * Crumble Client Main Ulitity File
 * Colour Palette: ENDESGA 32 (https://lospec.com/palette-list/endesga-32)
 * @author Connell Reffo
 */

import Player from "./gameobjects/player";
import Rocket from "./gameobjects/rocket";

import { Chunk, ChunkEdge } from "./gameobjects/chunk";

/**
 * Represents an RGB Colour Code
 */
export class RGBColourCode {
    public r: number;
    public g: number;
    public b: number;

    /**
     * @param r Red Channel
     * @param g Green Channel
     * @param b Blue Channel
     */
    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    /**
     * Lerps Between 2 Different Colours
     */
    public static lerp(start: RGBColourCode, end: RGBColourCode, amount: number): RGBColourCode {
        amount /= 10;

        function lerpNum(s: number, e: number) {
            return (1 - amount) * s + amount * e;
        }

        return new RGBColourCode(Math.floor(lerpNum(start.r, end.r)), Math.floor(lerpNum(start.g, end.g)), Math.floor(lerpNum(start.b, end.b)));
    }
}

/**
 * Represents a 2D Position
 */
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

/**
 * Path Where Crumble Graphics Assets are Stored
 */
export let GRAPHICS_PATH = process.env.PUBLIC_URL + "/graphics/";

/**
 * Maximum Length for Player Name
 */
export const MAX_NAME_LENGTH = 16;

/**
 * Colour of the Canvas Background
 */
export const BG_COLOUR = "#181425";

/**
 * Colour of Chunk Ground
 */
export const TILE_NORMAL_COLOUR = new RGBColourCode(192, 203, 220);

/**
 * Colour of Chunk Ground When About to be Destroyed
 */
export const TILE_WEAK_COLOUR = new RGBColourCode(162, 38, 51);

/**
 * Colour of Chunk Edge
 */
export const CHUNK_EDGE_COLOUR = "#8b9bb4";

/**
 * Colour of Tile Destruction Particles
 */
export const TILE_DESTROY_PARTICLE_COLOUR = "#5a6988";

/**
 * Colour of Muzzle Blast Particles
 */
export const MUZZLE_BLAST_PARTICLE_COLOUR = "#feae34";

/**
 * Colour of Rocket Trail Smoke
 */
export const ROCKET_SMOKE_TRAIL_COLOUR = "#ffffff";

/**
 * Colour of Rocket Projectile
 */
export const ROCKET_PROJECTILE_COLOUR = "#ff0044";

/**
 * Nametag Colour for the Client Player
 */
export const NAMETAG_SELF_COLOUR = "#63c74d";

/**
 * Nametag Colour for the Opposing Player(s)
 */
export const NAMETAG_ENEMY_COLOUR = "#e43b44";

/**
 * Vertical Offset of Shadow from a Player
 */
export const PLAYER_SHADOW_OFFSET = 32;

/**
 * Vertical Offset of Nametag from a Player
 */
export const PLAYER_NAMETAG_OFFSET = 53;

/**
 * Vertical Offset of Held Handrock Weapon for a Player
 */
export const PLAYER_HANDROCKET_OFFSET = 22;

/**
 * Speed of Rocket on the Client Side
 */
export const CLIENT_ROCKET_SPEED = 4.7;

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
export const TILE_DESTROY_WARNING_MS = 2000;

/**
 * Cooldown Time Between Rockets being Fires by the Current Player
 */
export const SHOOT_COOLDOWN_MS = 600;

/**
 * The Middleground Between Cursor being Considered Above or Below Player
 */
export const CURSOR_MIDDLE_DEADSPACE = 35;

/**
 * Dimensions of Standing Player Sprites
 */
export const PLAYER_DIMENSIONS = {
    scale: 7.5,
    width: 5,
    height: 9,
    frames: 8
};

/**
 * Dimensions of Falling Player Sprites
 */
export const PLAYER_FALL_DIMENSIONS = {
    width: 9,
    height: 6,
    frames: 3
}

/**
 * Dimensions of a Player's Handrocket
 */
export const HANDROCKET_DIMENSIONS = {
    scale: 6,
    width: 11,
    height: 8,
    frames: 3,
    vertOffsetUp: -1,
    vertOffsetDown: 14,
    vertOffsetNormal: 8
};

/**
 * Data Attributed with an Individual Particle
 */
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
 * Represents a Connected Player Object
 */
export interface IConnectedPlayer {
    [socketId: string]: Player
}

/**
 * Represents a Rocket Projectile Object
 */
export interface IProjectile {
    [instanceId: string]: Rocket
}

/**
 * Represents Data from Server used to Initialize a New Rocket on the Client
 */
export interface IRocketData {
    ownerSocketId?: string
    direction?: Vec2
    pos: Vec2,
    instanceId: number
}

/**
 * Represents Object Data of Players Sent from the Socket Server
 */
export interface IPlayerData {
    socketId?: string
    name: string,
    pos: Vec2
}

/**
 * Represents Tile Destruction Data Sent from Server
 */
export interface ITileDestroyedData {
    pos: Vec2,
    instant: boolean
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
 * Represents Handrocket Angle Change Data from the Server
 */
export interface IAngleChangeData {
    socketId: string,
    angle: HandrocketAngles,
    direction: FacingDirections
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
    TILE_DESTROYED = "tiledestroyed",
    ANGLE_CHANGE = "anglechange",
    ROCKET_SHOT = "rocketshot",
    ROCKET_EXPLODE = "rocketexplode"
}

/**
 * Represents Animation Possible States a Player can be in
 */
export enum PlayerAnimationStates {
    IDLE = "idle",
    RUN = "run"
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
 * Represents Possible Angles the Handrocket Can be Pointed At
 */
export enum HandrocketAngles {
    UP = "up",
    MIDDLE = "middle",
    DOWN = "down"
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