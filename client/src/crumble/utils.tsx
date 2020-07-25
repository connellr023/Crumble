/**
 * Crumble Client Main Ulitity File
 * @author Connell Reffo
 */

export const BG_COLOUR = "#121212";

export const ANIMATION_MS = 130;

export const PLAYER_SHADOW_OFFSET = 32;
export const PLAYER_NAMETAG_OFFSET = 53;

export const MIN_LAYER = -20;
export const MAX_LAYER = 20;

export const SEND_INPUT_MS = 100;

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

/**
 * Represents Object Data of Players Sent from the Socket Server
 */
export interface IPlayerData {
    socketId?: string
    name: string,
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
    players?: object
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
    PLAYER_MOVE = "playermove"
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