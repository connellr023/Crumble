/**
 * Player Game Object Script
 * @author Connell Reffo
 */

import { Vec2, FacingDirections, HandrocketAngles, Directions, GameEvents, SocketEvents, IPlayerObstructionData, PLAYER_SPEED, PLAYER_HITBOX, HANDROCKET_KNOCKBACK_FORCE, SHOOT_COOLDOWN_MS, TOTAL_CHUNK_SIZE, CHUNK_HEIGHT_OFFSET } from "../utils";

import Collider, { CollisionSources } from "../collision";
import Game, { activeGames } from "../game";
import Rocket from "./rocket";

/**
 * Represents a Server Side Instance of a Player
 */
export default class Player {
    public name: string; 
    public pos: Vec2;
    public socketId: string;
    public game: Game;

    public direction: FacingDirections;
    public dead: boolean;

    public handrocketAngle: HandrocketAngles;
    public canShoot: boolean;

    public collider: Collider;

    public lastChunkCollider: Collider;

    /**
     * @param name Name of Player
     * @param pos Position of Player
     * @param socketId of The Player
     * @param game Is Game Instance this Player is Running in
     */
    constructor (name: string, pos: Vec2, socketId: string, game: Game) {
        this.name = name;
        this.pos = pos;
        this.socketId = socketId;
        this.game = game;

        this.direction = FacingDirections.LEFT;
        this.dead = false;

        this.handrocketAngle = HandrocketAngles.MIDDLE;
        this.canShoot = true;

        // Set Collider
        this.collider = new Collider(this.pos, PLAYER_HITBOX.width, PLAYER_HITBOX.height, CollisionSources.PLAYER, this.game.lobbyId);
        this.collider.parentObject = this;
    }

    /**
     * Checks if this Player is Within the Map Boundries
     */
    public isWithinMap(): IPlayerObstructionData {

        // Initialize Obstruction Data Variable
        let obstructionData: IPlayerObstructionData = {
            withinMap: false,
            onFront: false
        };

        // Get Active Collisions
        const COLLISIONS = this.collider.getCollisions();

        // Check if Player is Touching a Chunk
        for (let key in COLLISIONS) {
            if (COLLISIONS[key].source === CollisionSources.CHUNK) {
                obstructionData = {
                    withinMap: true,
                    onFront: null
                };

                this.lastChunkCollider = COLLISIONS[key];
                break;
            }
        }

        // Check if Game is Still Active
        if (activeGames[this.game.lobbyId] !== undefined) {

            // Check if Player Was on the Front or Back of the Chunk
            obstructionData.onFront = (this.pos.y > this.lastChunkCollider.pos.y + PLAYER_HITBOX.height);
        }

        // Check if Player is Touching a Destroyed Tile
        for (let key in COLLISIONS) {
            if (COLLISIONS[key].source === CollisionSources.DESTROYED_TILE) {
                obstructionData = {
                    withinMap: true,
                    onFront: false
                };

                // Off of Map Conditions Based on the Players Relative Position to the Destroyed Tile
                const PLAYER_BELOW = (COLLISIONS[key].pos.y < this.pos.y - (PLAYER_HITBOX.height * 1.2));
                const PLAYER_ABOVE = (COLLISIONS[key].pos.y > this.pos.y + (PLAYER_HITBOX.height * 0.3));
                const PLAYER_LEFT = (COLLISIONS[key].pos.x < this.pos.x - (PLAYER_HITBOX.width * 2));
                const PLAYER_RIGHT = (COLLISIONS[key].pos.x > this.pos.x + (PLAYER_HITBOX.width * 1.7));

                if (PLAYER_RIGHT || PLAYER_LEFT || PLAYER_ABOVE || PLAYER_BELOW) {
                    obstructionData.withinMap = false;
                }

                break;
            }
        }

        // Return Final Result
        return obstructionData;
    }

    /**
     * Kills the Current Player Instance
     * @param fellOffFront If the Player Fell Off the Front of the Map
     */
    public die(fellOffFront: boolean) {
        this.dead = true;

        // Sync Death with Clients
        this.game.namespace.emit(GameEvents.PLAYER_DIED, {
            socketId: this.socketId,
            fellOffFront: fellOffFront
        });

        // Check if Game Should End
        if (this.game.getAlivePlayersSocketId().length < 2) {
            this.game.checkWinner();
        }
    }

    /**
     * Checks if the Current Player Instance Should be Dead
     */
    public checkDeath() {
        const WITHIN_MAP = this.isWithinMap();

        if (!WITHIN_MAP.withinMap) {
            this.die(WITHIN_MAP.onFront);
        }
    }

    /**
     * Disconnects the Current Player
     */
    public disconnect() {

        // Tell All Clients a Player has Left
        this.game.namespace.emit(SocketEvents.PLAYER_LEAVE, this.socketId);
        this.dead = true;

        // Check if there Should be Winner
        this.game.checkWinner();

        console.log(`[x] "${this.name}" Has Left`);
    }

    /**
     * Fires a Rocket Projectile and Applies Knockback
     */
    public fireRocket() {

        // Check if Player Can Shoot
        if (this.canShoot) {
            this.canShoot = false;
            
            let horKnockbackDir: Directions;
            let vertKnockbackDir: Directions;

            let knockbackVector = Vec2.zero;

            // Set Horizontal Player Knockback
            switch(this.direction) {
                case FacingDirections.LEFT:
                    knockbackVector.x = 1;
                    horKnockbackDir = Directions.RIGHT;

                    break;
                
                case FacingDirections.RIGHT:
                    knockbackVector.x = -1;
                    horKnockbackDir = Directions.LEFT;

                    break;
            }

            // Set Vertical Player Knockback
            switch(this.handrocketAngle) {
                case HandrocketAngles.UP:
                    knockbackVector.y = 1;
                    vertKnockbackDir = Directions.DOWN;

                    break;
                
                case HandrocketAngles.DOWN:
                    knockbackVector.y = -1;
                    vertKnockbackDir = Directions.UP;

                    break;

                default:
                    knockbackVector.y = 0;
                    vertKnockbackDir = null;

                    break;
            }

            // Instantiate Rocket Projectile
            const ROCKET_SPAWN_OFFSET = 6;
            const INSTANCE_ID = Object.keys(this.game.players).length;
            const DIRECTION = new Vec2(knockbackVector.x * -1, knockbackVector.y * -1);

            this.game.rockets[INSTANCE_ID] = new Rocket(new Vec2(this.pos.x + (DIRECTION.x * ROCKET_SPAWN_OFFSET), this.pos.y + (DIRECTION.y * ROCKET_SPAWN_OFFSET)), DIRECTION, INSTANCE_ID, this.game);

            // Apply Knockback if Not Colliding
            this.knockback(HANDROCKET_KNOCKBACK_FORCE, horKnockbackDir, vertKnockbackDir);

            // Server Side Shoot Cooldown
            setTimeout(() => {
                this.canShoot = true;
            }, SHOOT_COOLDOWN_MS);

            // Initialize Rocket With Connected Clients
            this.game.namespace.emit(GameEvents.ROCKET_SHOT, {
                ownerSocketId: this.socketId,
                direction: DIRECTION,
                pos: this.game.rockets[INSTANCE_ID].pos,
                instanceId: INSTANCE_ID
            });
        }
    }

    /**
     * Determines if it is Possible for the Current Player Instance to Move in the Given Direction
     * @param movementDir 
     */
    private processPossibleMovementDirection(movementDir: Directions): Directions {
        this.collider.getCollisions().forEach((collider) => {
            if (collider.source === CollisionSources.PLAYER) {

                // Determine Direction Player Can Move in
                if (movementDir === Directions.RIGHT || movementDir === Directions.LEFT) {
                    const ON_TOP = (Math.abs(this.collider.pos.y - collider.pos.y) - 10 <= PLAYER_HITBOX.height / 2);

                    if (this.collider.pos.x >= collider.pos.x && ON_TOP) {
                        movementDir = Directions.RIGHT
                    }
                    else if (ON_TOP) {
                        movementDir = Directions.LEFT
                    }
                }
                else {
                    const ON_SIDE = (Math.abs(this.collider.pos.x - collider.pos.x) <= PLAYER_HITBOX.width / 2);

                    if (this.collider.pos.y >= collider.pos.y && ON_SIDE) {
                        movementDir = Directions.DOWN
                    }
                    else if (ON_SIDE) {
                        movementDir = Directions.UP
                    }
                }

                return;
            } 
        });

        // Return Final Movement Direction Value
        return movementDir;
    }

    /**
     * Moves the Current Player Instance in a Given Direction
     * @param movementDir Direction of to Move Player in
     */
    public move(movementDir: Directions) {

        // Check if Player Can Move in Wanted Direction
        if (movementDir === this.processPossibleMovementDirection(movementDir)) {

            // Adjust Position
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

            // Adjust Position of Collider
            this.collider.pos = new Vec2(this.pos.x, this.pos.y - PLAYER_HITBOX.vertOffset);

            // Sync Position with Clients
            this.game.namespace.emit(GameEvents.PLAYER_MOVE, {
                socketId: this.socketId,
                pos: this.pos
            });

            // Check if Current Player Should be Dead
            this.checkDeath();
        }
    }

    /**
     * Applies Knockback to the Current Player Instance
     * @param force The Force of the Knockback
     * @param horKnockbackDir Horizontal Knockback Direction
     * @param vertKnockbackDir Vertical Knockback Direction
     */
    public knockback(force: number, horKnockbackDir: Directions, vertKnockbackDir: Directions) {

        // Parse Knockback Directions into a Vector
        let knockbackVector = Vec2.zero;

        // Horizontal
        if (horKnockbackDir === this.processPossibleMovementDirection(horKnockbackDir)) { 
            if (horKnockbackDir === Directions.LEFT) {
                knockbackVector.x = -1;
            }
            else {
                knockbackVector.x = 1;
            }

            // Adjust Player X Position
            this.pos.x = this.pos.x + (10 * force * knockbackVector.x);
        }

        // Vertical
        if (vertKnockbackDir === this.processPossibleMovementDirection(vertKnockbackDir) && vertKnockbackDir !== null) {
            if (vertKnockbackDir === Directions.DOWN) {
                knockbackVector.y = 1;
            }
            else {
                knockbackVector.y = -1
            }

            // Adjust Player Y Position
            this.pos.y = this.pos.y + (10 * force * knockbackVector.y * 0.65);
        }

        // Adjust Position of Collider
        this.collider.pos = new Vec2(this.pos.x, this.pos.y - PLAYER_HITBOX.vertOffset);

        // Sync Position with Clients
        this.game.namespace.emit(GameEvents.PLAYER_MOVE, {
            socketId: this.socketId,
            pos: this.pos
        });

        // Check if Player Boosted Off of the Map
        setTimeout(() => {
            this.checkDeath();
        }, 35);
    }
}