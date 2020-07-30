/**
 * Crumble Server Main Utility File
 * @author Connell Reffo
 */

/**
 * The Maximum Amount of Players that can be in a Single Game
 */
export const MAX_PLAYERS = 2;

/**
 * The Maximum Amount of Games that can be Concurrently Running
 */
export const MAX_ACTIVE_GAMES = 5;

/**
 * Movement Speed of Players
 */
export const PLAYER_SPEED = 10;

/**
 * Defines the Hitbox Size of a Map Chunk
 */
export const CHUNK_SIZE = 200;

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
    PLAYER_WON = "playerwon"
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
 * Represents Data Required for a Crumble Level
 */
export interface ILevelMap {
    chunks: Array<Vec2>
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
        new Vec2(0, -1)
    ]
};