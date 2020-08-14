/**
 * Rocket Projectile Game Object Script
 * @author Connell Reffo
 */

import { Vec2, ROCKET_SPEED } from "../utils";

import Game from "../game";

/**
 * Represents a Server Side Instance of a Handrocket Projectile
 */
export default class Rocket {
    public pos: Vec2;
    public direction: Vec2;
    public instanceId: number;
    public game: Game;

    public lifetime: number;

    /**
     * @param pos Initial Position of Projectile
     * @param direction The Direction the Projectile will Move in
     * @param instanceId The Unique Identifier for the Current Projectile Instance
     */
    constructor(pos: Vec2, direction: Vec2, instanceId: number) {
        this.pos = pos;
        this.direction = direction;
        this.instanceId = instanceId;

        this.lifetime = 0;
    }

    /**
     * Moves the Projectile Based on it's Direction
     */
    public move() {
        this.pos = new Vec2(this.pos.x + (ROCKET_SPEED * this.direction.x), this.pos.y + (ROCKET_SPEED * this.direction.y * 0.75));
    }
}