/**
 * Crumble Server Collision Handling
 * @author Connell Reffo
 */

import { Vec2 } from "./utils";

import Game from "./game";
import Player from "./gameobjects/player";

/**
 * Represents Possible Collision Sources
 */
export enum CollisionSources {
    PLAYER = "player",
    DESTROYED_TILE = "destroyedtile",
    CHUNK = "chunk",
    ROCKET = "rocket"
}

/**
 * Collision Manager
 */
export class CollisionManager {
    public colliders: Array<Collider> = [];

    /**
     * Checks if Two Different Colliders are Touching
     */
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

/**
 * Represents a Collider Instance
 */
export default class Collider {
    public pos: Vec2;
    public width: number;
    public height: number;
    public source: CollisionSources;

    public parentObject: Player;

    private lobbyId: string;

    /**
     * @param pos Position of Collider
     * @param width Width of Collider
     * @param height Height of Collider
     * @param source Is The Source of the Collider
     * @param lobbyId Is the Lobby ID of the Game That this Collider Belongs to
     * @param vertOffset Is the Vertical Offset for the Collider
     */
    constructor(pos: Vec2, width: number, height: number, source: CollisionSources, lobbyId: string) {
        this.pos = pos;
        this.width = width;
        this.height = height;
        this.source = source;

        this.lobbyId = lobbyId;

        // Check if Game is Still Active
        if (Game.activeGames[this.lobbyId] !== undefined) {

            // Register Collider With Collision Manager
            Game.activeGames[this.lobbyId].colliders.push(this);
        }
    } 

    /**
     * Returns All Colliders this Collider is Touching
     */
    public getCollisions(): Array<Collider> {
        let collisions: Array<Collider> = [];

        // Check if Game Has Ended
        if (Game.activeGames[this.lobbyId] !== undefined) {

            // Process Collisions
            Game.activeGames[this.lobbyId].colliders.forEach((collider) => {
                if (collider !== this && CollisionManager.isColliding(this, collider)) {
                    collisions.push(collider);
                }
            });
        }
        
        // Return Final Array of Collisions
        return collisions;
    }
}