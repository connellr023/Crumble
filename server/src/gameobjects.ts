/**
 * Crumble Server Game Object File
 * @author Connell Reffo
 */

import { Vec2, FacingDirections } from "./utils";

/**
 * Represents a Server Side Instance of a Player
 */
export class Player {
    public name: string; 
    public position: Vec2;
    public direction: FacingDirections;
    public dead: boolean;

    /**
     * @param name Name of Player
     * @param position Position of Player
     * @param direction Direction Player is Facing
     * @param socketId The Socket ID of the Connected Player
     */
    constructor (name: string, position: Vec2) {
        this.name = name;
        this.position = position;
        this.direction = FacingDirections.LEFT;
        this.dead = false;
    }
}