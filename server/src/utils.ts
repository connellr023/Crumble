/**
 * Crumble Server Main Utility File
 * @author Connell Reffo
 */

import { Player } from "./gameobjects";

/**
 * Maximum Length for Player Name
 */
export const MAX_NAME_LENGTH = 16;

/**
 * The Maximum Amount of Games that can be Concurrently Running
 */
export const MAX_ACTIVE_GAMES = 5;

/**
 * Movement Speed of Players
 */
export const PLAYER_SPEED = 10;

/**
 * Size of a Chunk in Tiles
 */
export const CHUNK_SIZE = 4;

/**
 * Defines the Hitbox Size of a Map Chunk
 */
export const TOTAL_CHUNK_SIZE = 230;

/**
 * Warning Time Before a Tile Destroys
 */
export const TILE_DESTROY_WARNING_MS = 1500;

/**
 * Amount of Ticks Between Tile Destruction
 */
export const DESTROY_TILE_TICKS = 130;

/**
 * How Often Code in the Game Tick Function is Called
 */
export const TICK_MS = 100;

/**
 * Port that the Main Crumble Server will Run on
 */
export const PORT = 8000;

/**
 * Defines the Dimension of a Player on the Server Side
 */
export const PLAYER_DIMENSIONS = {
    width: 42,
    height: 70
}

/**
 * Enumeration of Events that Will Take Place on a Socket Server
 */
export enum SocketEvents {
    CONNECTION = "connection",
    DISCONNECT = "disconnect",
    PLAYER_LEAVE = "leave",
    REGISTER = "register",
    START_GAME = "startgame",
    SEND_ID = "id"
}

/**
 * Enumeration of Events that Will Take Place on the Game's Server
 */
export enum GameEvents {
    PLAYER_MOVE = "playermove",
    PLAYER_DIED = "playerdied",
    PLAYER_WON = "playerwon",
    TILE_DESTROYED = "tiledestroyed",
    ANGLE_CHANGE = "anglechange"
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
 * Enumeration of Directions the Player can Face
 */
export enum FacingDirections {
    LEFT = "left",
    RIGHT = "right"
}

/**
 * Enumeration of Possible Directions a Player can Move in
 */
export enum Directions {
    UP = "up",
    DOWN = "down",
    LEFT = "left",
    RIGHT = "right"
}

/**
 * Represents a Connected Player Object
 */
export interface IConnectedPlayer {
    [socketId: string]: Player
}

/**
 * Represents Data Required for a Crumble Level
 */
export interface ILevelMap {
    chunks: Array<Vec2>,
    destroyedTiles: Array<Vec2>
}

/**
 * Represents Player Angle and Directional Data from a Client
 */
export interface IAngleChangeData {
    angle: HandrocketAngles,
    direction: FacingDirections
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

export class Collider {
    public pos: Vec2;
    public width: number;
    public height: number;

    constructor(pos: Vec2, width: number, height: number) {
        this.pos = pos;
        this.width = width;
        this.height = height;
    }

    public static isColliding(col1: Collider, col2: Collider): boolean {

        // X Boundries
        const X1 = col1.pos.x - col1.width / 2;
        const X2 = col1.pos.x + col1.width / 2;

        // Y Boundreis
        const Y1 = col1.pos.y - col1.height / 2;
        const Y2 = col1.pos.y + col1.height / 2;

        // Check if Colliding
        if (col2.pos.x + (col2.width / 2) >= X1 && col2.pos.x - (col2.width / 2) <= X2) {
            if (col2.pos.y - (col2.height / 2) <= Y2 && col2.pos.y + (col2.height / 2) >= Y1) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
}

export class Vec2 {
    public x: number;
    public y: number;

    public static zero = new Vec2(0, 0);

    /**
     * @param x X Position
     * @param y Y Position
     */
    constructor (x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Generates a Random 2D Position
     */
    public static random(min: number, max: number): Vec2 {
        return new Vec2(randomInt(min, max), randomInt(min, max));
    }
}

/**
 * Test
 */
export const TEST_MAP: ILevelMap = {
    chunks: [
        new Vec2(0, 0),
        new Vec2(1, 0),
        new Vec2(2, -1),
        new Vec2(1, -1),
        new Vec2(0, -1),
        new Vec2(-1, -1)
    ],
    destroyedTiles: []
};