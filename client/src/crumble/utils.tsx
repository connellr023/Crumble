/**
 * Crumble Client Main Ulitity File
 * @author Connell Reffo
 */

import * as Phaser from "phaser";

export const BG_COLOUR = "#121212";
export const CRUMBLE_GAME = "CrumbleGame"

export const PLAYER_SPRITE = "Player";
export const SHADOW_SPRITE = "Shadow";

export const ANIMATION_TIME = 130; // Milliseconds

export const PLAYER_SHADOW_OFFSET = 26;
export const PLAYER_NAMETAG_OFFSET = 53;

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
    direction: number,
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

export class Player {
    public name: string;
    public sprite: Phaser.GameObjects.Sprite;
    public shadow: Phaser.GameObjects.Sprite;
    public nametag: Phaser.GameObjects.Text;
    public state: PlayerAnimationStates;
    public animationFrame: number;
    public speed: Vec2;
    public calculatingSpeed: boolean = false;
    public nametagOffsetX: number;

    /**
     * @param name Name of the Player
     * @param sprite Sprite used to Render the Player
     */
    constructor(name: string, sprite: Phaser.GameObjects.Sprite, nametag: Phaser.GameObjects.Text, shadow: Phaser.GameObjects.Sprite) {
        this.name = name;
        this.sprite = sprite;
        this.nametag = nametag;
        this.shadow = shadow;
        this.nametagOffsetX = 3.5;
        
        this.animationFrame = 0;
        this.speed = Vec2.zero;
        this.state = PlayerAnimationStates.IDLE;
    }

    /**
     * Updates the Speed Variable of this Player
     * @param socketId Socket ID of Player to Calculate Speed for
     */
    public async updateSpeed() {

        // Calculate Speed
        this.calculatingSpeed = true;

        const SPEED_POS_OLD = new Vec2(this.sprite.x, this.sprite.y);
        const RUN_ANIM_THRESHOLD = 0.5;

        setTimeout(() => {

            // Set Speed Variable
            this.speed = new Vec2(
                Math.abs(SPEED_POS_OLD.x - this.sprite.x),
                Math.abs(SPEED_POS_OLD.y - this.sprite.y)
            );

            // Flip Player
            if (SPEED_POS_OLD.x - this.sprite.x > 0) {
                this.sprite.setFlipX(false);
                this.nametagOffsetX = 5;
            }
            else {
                this.sprite.setFlipX(true);
                this.nametagOffsetX = 4.65;
            }

            this.calculatingSpeed = false;
        }, 150);

        // Set Animation State
        if (this.speed.x > RUN_ANIM_THRESHOLD || this.speed.y > RUN_ANIM_THRESHOLD) {
            this.state = PlayerAnimationStates.RUN;
        }
        else {
            this.state = PlayerAnimationStates.IDLE;
        }
    }
}