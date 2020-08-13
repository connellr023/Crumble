/**
 * Crumble Server Game Object File
 * @author Connell Reffo
 */

import { Vec2, FacingDirections, HandrocketAngles, Directions, PLAYER_SPEED, ROCKET_SPEED } from "./utils";

/**
 * Represents a Server Side Instance of a Player
 */
export class Player {
    public name: string; 
    public pos: Vec2;
    public direction: FacingDirections;
    public dead: boolean;

    public handrocketAngle: HandrocketAngles;
    public canShoot: boolean;

    /**
     * @param name Name of Player
     * @param position Position of Player
     */
    constructor (name: string, position: Vec2) {
        this.name = name;
        this.pos = position;
        this.direction = FacingDirections.LEFT;
        this.dead = false;

        this.handrocketAngle = HandrocketAngles.MIDDLE;
        this.canShoot = true;
    }

    /**
     * Moves the Current Player Instance in a Given Direction
     * @param movementDir Direction of to Move Player in
     */
    public move(movementDir: Directions) {
        switch (movementDir) {
            case Directions.UP:
                this.pos = new Vec2(this.pos.x, this.pos.y - PLAYER_SPEED);
                break;
            case Directions.DOWN:
                this.pos = new Vec2(this.pos.x, this.pos.y + PLAYER_SPEED);
                break;
            case Directions.LEFT:
                this.pos = new Vec2(this.pos.x - PLAYER_SPEED, this.pos.y);
                break;
            case Directions.RIGHT:
                this.pos = new Vec2(this.pos.x + PLAYER_SPEED, this.pos.y);
                break;
        }
    }

    /**
     * Applies Knockback to the Current Player Instance
     * @param force The Force of the Knockback
     */
    public knockback(force: number, knockbackVector: Vec2) {

        // Adjust Position
        this.pos = new Vec2(this.pos.x + (10 * force * knockbackVector.x), this.pos.y + (10 * force * knockbackVector.y));
    }
}

/**
 * Represents a Server Side Instance of a Handrocket Projectile
 */
export class RocketProjectile {
    public pos: Vec2;
    public direction: Vec2;
    public instanceId: number;

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