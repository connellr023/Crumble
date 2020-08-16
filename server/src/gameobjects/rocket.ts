/**
 * Rocket Projectile Game Object Script
 * @author Connell Reffo
 */

import { Vec2, GameEvents, ROCKET_SPEED, MAX_ROCKET_LIFETIME, ROCKET_HITBOX, TILE_SIZE, Directions, ROCKET_HIT_KNOCKBACK_FORCE } from "../utils";

import Collider, { CollisionSources } from "../collision";
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

    private collider: Collider;

    /**
     * @param pos Initial Position of Projectile
     * @param direction The Direction the Projectile will Move in
     * @param instanceId The Unique Identifier for the Current Projectile Instance
     * @param game The Game Instance this Rocket is Part of
     */
    constructor(pos: Vec2, direction: Vec2, instanceId: number, game: Game) {
        this.pos = pos;
        this.direction = direction;
        this.instanceId = instanceId;

        this.game = game;

        this.collider = new Collider(this.pos, ROCKET_HITBOX.width, ROCKET_HITBOX.height, CollisionSources.ROCKET, this.game.lobbyId);

        this.lifetime = 0;
    }

    /**
     * Moves the Projectile Based on it's Direction
     */
    public move() {

        // Move Rocket
        this.pos = new Vec2(this.pos.x + (ROCKET_SPEED * this.direction.x), this.pos.y + (ROCKET_SPEED * this.direction.y * 0.75));

        // Move Rocket Collider
        this.collider.pos = this.pos;

        // Check if Colliding With Any Players
        this.collider.getCollisions().forEach((collision) => {
            if (collision.source === CollisionSources.PLAYER) {
                let horKnockbackDir = Directions.LEFT;
                let vertKnockbackDir = Directions.DOWN;

                // Set Horizontal Knockback Direction
                if (this.direction.x > 0) {
                    horKnockbackDir = Directions.RIGHT;
                }

                // Set Vertical Knockback Direction
                if (this.direction.y < 0) {
                    vertKnockbackDir = Directions.UP;
                }
                else if (this.direction.y === 0) {
                    vertKnockbackDir = null;
                }

                collision.parentObject.knockback(ROCKET_HIT_KNOCKBACK_FORCE, horKnockbackDir, vertKnockbackDir);
                this.explode();

                return;
            }
        });
    }

    /**
     * Explodes the Current Rocket
     */
    public explode() {

        // Destroy Nearby Tiles
        this.game.availableTiles.forEach((tilePos) => {
            const DISTANCE = Vec2.distance(this.pos, new Vec2(tilePos.x * TILE_SIZE - (TILE_SIZE * 1.5), tilePos.y * TILE_SIZE - (TILE_SIZE * 1.5)));

            if (DISTANCE < 38) {
                this.game.destroyTile(tilePos, true);
            }
        });

        // Tell Clients Rocket is Destroyed
        this.game.namespace.emit(GameEvents.ROCKET_EXPLODE, this.instanceId);

        // Delete Server Side Rocket Instance
        delete this.game.rockets[this.instanceId];
    }

    /**
     * Executes Every Game Tick
     */
    public tick() {

        // Check Rocket Lifetime
        if (this.lifetime < MAX_ROCKET_LIFETIME) {
            this.lifetime++;
            this.move();
        }
        else {
            this.explode();
        }
    }
}