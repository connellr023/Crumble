/**
 * Crumble Client Main Game File
 * @author Connell Reffo
 */

import {
    Vec2, PlayerAnimationStates, FacingDirections, randomInt,
    PLAYER_NAMETAG_OFFSET, PLAYER_SHADOW_OFFSET, PLAYER_DIMENSIONS, NAMETAG_ENEMY_COLOUR, NAMETAG_SELF_COLOUR, TOTAL_CHUNK_SIZE, CHUNK_SIZE_PADDING, CHUNK_GROUND_COLOUR, CHUNK_EDGE_COLOUR, CHUNK_EDGE_HEIGHT, TILE_SIZE, TILE_DESTROY_PARTICLE_COLOUR, IParticle, CHUNK_SIZE, HANDROCKET_DIMENSIONS, HandrocketAngles
} from "./utils";

import { clientSocketId, inputUpdateInterval } from "./socket";
import { game, assets, RenderController, cameraPos, deleteRenderController } from "./renderer";

import $ from "jquery";
import p5 from "p5";

/**
 * Current Instance of P5 Renderer
 */
let gameInstance: p5;

/**
 * Level Chunk Renderer
 */
export class Chunk extends RenderController {
    public chunkPos: Vec2;
    public tiles: Array<{pos: Vec2, destroyed: boolean}>;

    public chunkEdge: ChunkEdge | undefined;

    /**
     * @param chunkPos Position to Render Chunk at
     */
    constructor(chunkPos: Vec2) {
        super();

        this.chunkPos = chunkPos;
        this.tiles = [];
        this.chunkEdge = undefined;

        this.setRenderLayer(3);
        this.initTiles();
    }

    /**
     * Populates Tiles Array with Tiles Inside this Chunk
     */
    private initTiles() {
        for (let y = 0; y < CHUNK_SIZE; y++) {
            for (let x = 0; x < CHUNK_SIZE; x++) {
                const TILE_POS = new Vec2(x + (this.chunkPos.x * CHUNK_SIZE), y + (this.chunkPos.y * CHUNK_SIZE));

                this.tiles.push({
                    pos: TILE_POS,
                    destroyed: false
                });
            }
        }
    }

    public render() {
        const REND = gameInstance;
        
        // Render Chunk Ground
        this.tiles.forEach((tile) => {
            if (!tile.destroyed) {
                const REND_POS = convertToCameraSpace(new Vec2(tile.pos.x * TILE_SIZE - (TILE_SIZE * 1.5), tile.pos.y * TILE_SIZE - (TILE_SIZE * 1.5)));

                REND.noStroke();
                REND.fill(CHUNK_GROUND_COLOUR);
                REND.rectMode(REND.CENTER);
                REND.rect(REND_POS.x, REND_POS.y, TILE_SIZE + CHUNK_SIZE_PADDING, TILE_SIZE + CHUNK_SIZE_PADDING);
            }
        });
    }
}

/**
 * Chunk Edge Renderer
 */
export class ChunkEdge extends RenderController {
    public chunkPos: Vec2;

    private particles: Array<{pos: Vec2, size: number, speed: number, direction: number}>;

    /**
     * @param chunkPos Position of Chunk to Place Edge At
     */
    constructor(chunkPos: Vec2) {
        super();

        this.chunkPos = chunkPos;
        this.particles = [];

        this.setRenderLayer(2);
        this.initParticles();
    }

    /**
     * Initializes Chunk Edge Particle Effect
     */
    private initParticles() {
        const PARTICLE_COUNT = randomInt(7, 12);

        for (let pc = 0; pc < PARTICLE_COUNT; pc++) {
            const RAND_SIZE = randomInt(8, 12);
            const RAND_POS = new Vec2(randomInt(0, TOTAL_CHUNK_SIZE + CHUNK_SIZE_PADDING) + 6, randomInt(0, CHUNK_EDGE_HEIGHT) + RAND_SIZE + 6 * 1.8);

            let particleDir = randomInt(-1, 1);

            if (particleDir === 0) {
                particleDir = 1;
            }

            this.particles.push({
                pos: RAND_POS,
                size: RAND_SIZE,
                speed: randomInt(1, 6) * 0.015,
                direction: particleDir
            });
        }
    }

    public render() {
        const REND = gameInstance;

        const REND_POS = convertToCameraSpace(new Vec2(this.chunkPos.x * TOTAL_CHUNK_SIZE, this.chunkPos.y * TOTAL_CHUNK_SIZE + (TOTAL_CHUNK_SIZE / 2) + (CHUNK_EDGE_HEIGHT / 2)));

        // Render Chunk Edge
        REND.noStroke();
        REND.fill(CHUNK_EDGE_COLOUR);
        REND.rectMode(REND.CENTER);
        REND.rect(REND_POS.x, REND_POS.y, TOTAL_CHUNK_SIZE + CHUNK_SIZE_PADDING, CHUNK_EDGE_HEIGHT);

        // Render Particles
        this.particles.forEach((particle) => {
            particle.pos = new Vec2(particle.pos.x, particle.pos.y + REND.sin(REND.frameCount * 0.03) * particle.speed * particle.direction);

            const PARTICLE_REND_POS = new Vec2(REND_POS.x + particle.pos.x - (TOTAL_CHUNK_SIZE / 2), REND_POS.y + particle.pos.y);

            REND.noStroke();
            REND.fill(CHUNK_EDGE_COLOUR);
            REND.rectMode(REND.CENTER);
            REND.rect(PARTICLE_REND_POS.x, PARTICLE_REND_POS.y, particle.size, particle.size);
        });
    }
}

/**
 * Tile Destroy Particles Renderer
 */
export class TileDestroyParticles extends RenderController {
    public tilePos: Vec2;
    public stopParticles: boolean;

    private particles: Array<IParticle> = [];
    private particleSpeedMultiplier: number;

    /**
     * @param tilePos Position of Destroyed Tile
     */
    constructor(tilePos: Vec2) {
        super();

        this.tilePos = tilePos;
        this.stopParticles = false;
        this.particleSpeedMultiplier = 1;

        this.setRenderLayer(4);
        this.initParticles();
    }

    /**
     * Initializes Tile Destroy Particles
     */
    private initParticles() {
        const PARTICLE_COUNT = 13;

        for (let pc = 0; pc < PARTICLE_COUNT; pc++) {
            this.particles.push({
                pos: this.tilePos,
                size: randomInt(8, 12),
                maxLifetimeFrames: randomInt(30, 80),
                lifetimeFrames: 0,
                direction: {
                    rise: randomInt(-300, 300) / 10,
                    run: randomInt(-300, 300) / 10
                }
            });
        }
    }

    public render() {
        const REND = gameInstance;

        const REND_POS = convertToCameraSpace(new Vec2(this.tilePos.x * TILE_SIZE - (TILE_SIZE * 1.5), this.tilePos.y * TILE_SIZE - (TILE_SIZE * 1.5)));

        // Render Particles
        this.particles.forEach((particle) => {
            REND.noStroke();
            REND.fill(TILE_DESTROY_PARTICLE_COLOUR);
            REND.rectMode(REND.CENTER);
            REND.rect(REND_POS.x + particle.pos.x + (particle.direction.run * 0.4), REND_POS.y + particle.pos.y + (particle.direction.rise * 0.4), particle.size, particle.size);

            if (particle.lifetimeFrames >= particle.maxLifetimeFrames) {
                if (!this.stopParticles) {
                    particle.pos = this.tilePos;
                    particle.size = randomInt(6, 10);
                    particle.maxLifetimeFrames = randomInt(30, 80);
                    particle.lifetimeFrames = 0;
                    particle.direction = {
                        rise: randomInt(-300, 300) / 10,
                        run: randomInt(-300, 300) / 10
                    }
                }
                else {
                    this.particleSpeedMultiplier = 4;

                    if (this.particles.length > 0) {
                        this.particles = this.particles.filter((part) => {
                            return part !== particle;
                        });
                    }
                }
            }
            else if (particle.lifetimeFrames >= particle.maxLifetimeFrames - particle.size) {
                particle.size--;
            }

            particle.pos = new Vec2(particle.pos.x + (particle.direction.run * 0.02 * this.particleSpeedMultiplier), particle.pos.y + (particle.direction.rise * 0.02 * this.particleSpeedMultiplier));
            particle.lifetimeFrames++;
        });

        // Delete Current Render Controller
        if (this.particles.length === 0) {
            deleteRenderController(this);
        }
    }
}

/**
 * Player Renderer
 */
export class Player extends RenderController {
    public name: string;
    public pos: Vec2;
    public direction: FacingDirections;
    public serverPos: Vec2;
    public socketId: string;

    public currentChunk: Vec2;
    public dead: boolean;

    public handrocket: PlayerHandrocket;
    public shadow: PlayerShadow;
    public nametag: Nametag;

    private speed: Vec2;
    private calculatingSpeed: boolean;
    private state: PlayerAnimationStates;
    private frame: number;

    private handrocketVertOffset: number;

    private deathFallVelocity: number;

    /**
     * @param name Name of the Player
     * @param pos Position of the Player
     * @param socketId Socket ID of the Player
     * @param renderLayer Layer to Render the Player on
     */
    constructor(name: string, pos: Vec2, socketId: string) {
        super();

        this.name = name;
        this.pos = pos;
        this.serverPos = pos;
        this.socketId = socketId;
        this.direction = FacingDirections.LEFT;
        this.currentChunk = Vec2.zero;

        this.calculatingSpeed = false;
        this.speed = Vec2.zero;
        this.state = PlayerAnimationStates.IDLE;
        this.frame = 0;

        this.dead = false;

        this.handrocketVertOffset = HANDROCKET_DIMENSIONS.vertOffsetNormal;

        this.deathFallVelocity = 5;

        // Set Namtag Colour
        let nametagColour = NAMETAG_ENEMY_COLOUR;

        if (clientSocketId === this.socketId) {
            nametagColour = NAMETAG_SELF_COLOUR;
        }

        // Instantiate Other Render Controllers
        this.handrocket = new PlayerHandrocket(this.pos);
        this.shadow = new PlayerShadow(this.pos);
        this.nametag = new Nametag(this.name, nametagColour, this.pos);

        // Calculate Current Chunk
        this.calcCurrentChunk();

        // Set Render Layer
        this.setRenderLayer(5);

    }

    /**
     * Sets the Angle the the Handrocket Should Point
     */
    public setHandrocketAngle(angle: HandrocketAngles) {
        this.handrocket.setAngle(angle);
    }

    /**
     * Returns the Chunk Position of Whatever Chunk the Player is Currently on
     */
    public calcCurrentChunk() {
        this.currentChunk = new Vec2(Math.round(this.pos.x / (TOTAL_CHUNK_SIZE)), Math.round(this.pos.y / (TOTAL_CHUNK_SIZE)));
    }

    /**
     * Updates the Speed Variable of this Player
     * @param socketId Socket ID of Player to Calculate Speed for
     */
    public async updateSpeed() {

        // Calculate Speed
        this.calculatingSpeed = true;

        const SPEED_POS_OLD = new Vec2(this.pos.x, this.pos.y);
        const RUN_ANIM_THRESHOLD = 0.55;

        setTimeout(() => {

            // Set Speed Variable
            this.speed = new Vec2(
                Math.abs(SPEED_POS_OLD.x - this.pos.x),
                Math.abs(SPEED_POS_OLD.y - this.pos.y)
            );

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

    /**
     * Triggers When this Player Dies
     * @param fellOffFront Tells the Client if the Player Should be Rendered on Top or Behind Chunks (Adds Depth)
     */
    public onDeath(fellOffFront: boolean) {
        let renderLayer = 1;
        this.dead = true;

        this.handrocket.invisible = true;
        this.shadow.invisible = true;
        this.nametag.invisible = true;

        if (fellOffFront) {
            renderLayer = 5;
        }

        this.setRenderLayer(renderLayer);

        const DEATH_INTERVAL = setInterval(() => {
            if (this.serverPos.y >= 610) {
                clearInterval(DEATH_INTERVAL);
            }

            this.serverPos = new Vec2(this.pos.x, this.pos.y + this.deathFallVelocity);
            this.deathFallVelocity += 0.4;
        }, 15);
    }

    public render() {
        const REND = gameInstance;

        // Lerp Position
        this.pos = Vec2.lerp(this.pos, this.serverPos, 0.2);

        const REND_POS = convertToCameraSpace(this.pos);

        // Render Player Sprite
        REND.push();

        switch (this.direction) {
            case FacingDirections.LEFT:
                REND.scale(1, 1);
                break;
            case FacingDirections.RIGHT:
                const HORIZONTAL_OFFSET = 5;

                REND.translate(REND_POS.x - cameraPos.x + (REND.windowWidth / 2 - HORIZONTAL_OFFSET) + this.pos.x + PLAYER_DIMENSIONS.width, 0);
                REND.scale(-1, 1);
                break;
        }

        REND.imageMode(REND.CENTER);
        REND.image(
            assets.PLAYER_SPRITESHEET[this.frame],
            REND_POS.x,
            REND_POS.y,
            PLAYER_DIMENSIONS.width * PLAYER_DIMENSIONS.scale,
            PLAYER_DIMENSIONS.height * PLAYER_DIMENSIONS.scale
        );
        REND.pop();

        // Update Player Speed
        if (!this.calculatingSpeed) {
            this.updateSpeed();
        }

        // Set Animation State
        const ANIM_SPEED_THRESHOLD = 0.4;

        if (!this.dead) {
            if (this.speed.x > ANIM_SPEED_THRESHOLD || this.speed.y > ANIM_SPEED_THRESHOLD) {
                this.state = PlayerAnimationStates.RUN;
            }
            else {
                this.state = PlayerAnimationStates.IDLE;
            }

            // Animate Player
            switch (this.state) {
                case PlayerAnimationStates.IDLE:
                    if (REND.frameCount % 20 === 0) {
                        this.frame++;

                        if (this.frame > 1) {
                            this.frame = 0;
                            this.handrocketVertOffset = HANDROCKET_DIMENSIONS.vertOffsetNormal;
                        }
                        else {
                            this.handrocketVertOffset = HANDROCKET_DIMENSIONS.vertOffsetDown;
                        }
                    }

                    break;
                case PlayerAnimationStates.RUN:
                    if (this.frame < 2) {
                        this.frame = 1;
                    }

                    if (REND.frameCount % 10 === 0) {
                        if (this.frame >= PLAYER_DIMENSIONS.frames - 1) {
                            this.frame = 1;
                            this.handrocketVertOffset = HANDROCKET_DIMENSIONS.vertOffsetNormal;
                        }
                        else if (this.frame === 2 || this.frame === 4 || this.frame === 6) {
                            this.handrocketVertOffset = HANDROCKET_DIMENSIONS.vertOffsetUp;
                        }
                        else {
                            this.handrocketVertOffset = HANDROCKET_DIMENSIONS.vertOffsetNormal;
                        }

                        this.frame++;
                    }

                    break;
            }
        }
        else {
            this.frame = 0;
            this.state = PlayerAnimationStates.IDLE
        }

        // Set Held Handrocket Position
        this.handrocket.pos = new Vec2(this.pos.x, this.pos.y + this.handrocketVertOffset);
        this.handrocket.direction = this.direction;

        // Set Shadow Position
        this.shadow.pos = new Vec2(this.pos.x, this.pos.y + PLAYER_SHADOW_OFFSET);

        // Set Nametag Position
        this.nametag.pos = new Vec2(this.pos.x, this.pos.y - PLAYER_NAMETAG_OFFSET);
    }
}

/**
 * Player Held Handrocket Renderer
 */
class PlayerHandrocket extends RenderController {
    public pos: Vec2;
    public direction: FacingDirections;

    private spriteFrame: number;

    /**
     * @param pos Position to Render Handrocket at
     */
    constructor(pos: Vec2) {
        super();

        this.pos = pos;
        this.direction = FacingDirections.LEFT;

        this.spriteFrame = 0;

        this.setRenderLayer(6);
    }

    /**
     * Sets the Angle Sprite
     */
    public setAngle(angle: HandrocketAngles) {
        switch (angle) {
            case HandrocketAngles.UP:
                this.spriteFrame = 2;
                break;
            
            case HandrocketAngles.MIDDLE:
                this.spriteFrame = 0;
                break;
            
            case HandrocketAngles.DOWN:
                this.spriteFrame = 1;
                break;
        }
    }

    public render() {
        const REND = gameInstance;

        const REND_POS = convertToCameraSpace(this.pos);

        let directionHorizontalOffset: number;
        let angleVertOffset: number;

        REND.push();

        // Check Direction
        switch(this.direction) {
            case FacingDirections.LEFT:
                const HORIZONTAL_OFFSET = 5;
                
                REND.translate(REND_POS.x - cameraPos.x + (REND.windowWidth / 2 - HORIZONTAL_OFFSET) + this.pos.x + HANDROCKET_DIMENSIONS.width, 0);
                REND.scale(-1, 1);

                directionHorizontalOffset = 32;
                break;
            
            case FacingDirections.RIGHT:
                REND.scale(1, 1);
                
                directionHorizontalOffset = 29;
                break;
        }

        // Adjust Vertical Offset Based on Angle
        switch (this.spriteFrame) {
            case 1:
                angleVertOffset = 5;
                break;

            case 2:
                angleVertOffset = -15;
                break;

            default:
                angleVertOffset = 0;
                break;
        }

        // Render Hand Rocket
        REND.imageMode(REND.CENTER);
        REND.image(assets.HANDROCKET_SPRITESHEET[this.spriteFrame], REND_POS.x + directionHorizontalOffset, REND_POS.y + angleVertOffset, HANDROCKET_DIMENSIONS.width * HANDROCKET_DIMENSIONS.scale, HANDROCKET_DIMENSIONS.height * HANDROCKET_DIMENSIONS.scale);
        
        REND.pop();
    }
}

/**
 * Player Shadow Renderer
 */
class PlayerShadow extends RenderController {
    public pos: Vec2;

    /**
     * @param pos Position to Render Shadow at
     */
    constructor(pos: Vec2) {
        super();

        this.pos = pos;
        this.setRenderLayer(4);
    }

    public render() {
        const REND = gameInstance;

        // Render Shadow
        const REND_POS = convertToCameraSpace(this.pos);

        REND.tint(255, 70);
        REND.imageMode(REND.CENTER);
        REND.image(
            assets.PLAYER_SHADOW,
            REND_POS.x,
            REND_POS.y,
            6 * PLAYER_DIMENSIONS.scale * 0.9,
            4 * PLAYER_DIMENSIONS.scale * 0.9
        );
        REND.tint(255, 255);
    }
}

/**
 * Player Nametag Renderer
 */
class Nametag extends RenderController {
    public text: string;
    public colour: string;
    public pos: Vec2;

    /**
     * @param pos Position to Render Namtag at
     */
    constructor(text: string, colour: string, pos: Vec2) {
        super();
        
        this.text = text;
        this.colour = colour;
        this.pos = pos;

        this.setRenderLayer(7);
    }

    public render() {
        const REND = gameInstance;

        const REND_POS = convertToCameraSpace(this.pos);

        // Render Text
        REND.fill(this.colour);
        REND.textFont("Crumble");
        REND.textAlign(REND.CENTER, REND.CENTER);
        REND.textSize(25);
        REND.text(this.text, REND_POS.x, REND_POS.y);
    }
}

/**
 * Converts a 2D Vector to a Position Relative to Camera View
 * @param pos Position to Convert
 */
export function convertToCameraSpace(pos: Vec2): Vec2 {
    return new Vec2(
        (gameInstance.windowWidth / 2) + pos.x - cameraPos.x,
        (gameInstance.windowHeight / 2) + pos.y - cameraPos.y
    );
}

/**
 * Starts Game
 */
export function startGame() {
    gameInstance = new p5(game);
    $("canvas").css("display", "block");
}

/**
 * Stops Game
 */
export function stopGame() {
    clearInterval(inputUpdateInterval);
    $("canvas").remove();
}