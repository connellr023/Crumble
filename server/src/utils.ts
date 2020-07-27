/**
 * Crumble Server Main Utility File
 * @author Connell Reffo
 */

/**
 * The Maximum Amount of Players that can be in a Single Game
 */
export const MAX_PLAYERS = 2;

/**
 * Movement Speed of Players
 */
export const PLAYER_SPEED = 10;

/**
 * The Maximum Amount of Games that can be Concurrently Running
 */
export const MAX_ACTIVE_GAMES = 5;

/**
 * Defines the Size of a Map Chunk (In Tiles)
 */
export const CHUNK_SIZE = 8;

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
    PLAYER_MOVE = "playermove"
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
 * Checks if 2 Different Objects are Touching
 * @param pos The Position to Check if Inside
 * @param width The Width of the Initial Object
 * @param height The Height of the Initial Object
 * @param objPos The Target Position to Check
 * @param objWidth The Width of the Target
 * @param objHeight The Height of the Target
 */
export function isColliding(pos: Vec2, width: number, height: number, objPos: Vec2, objWidth: number, objHeight: number): boolean {

    // X Boundries
    const X1 = objPos.x - objWidth / 2;
    const X2 = objPos.x + objWidth / 2;

    // Y Boundreis
    const Y1 = objPos.y - objHeight / 2;
    const Y2 = objPos.y + objHeight / 2;

    // Check if Colliding
    if (pos.x + (width / 2) >= X1 && pos.x - (width / 2) <= X2) {
        if (pos.y - (height / 2) <= Y2 && pos.y + (height / 2) >= Y1) {
            return true;
        }
        else {
            return false;
        }
    }
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

export const TEST_MAP: ILevelMap = {
    chunks: [
        Vec2.zero
    ]
};