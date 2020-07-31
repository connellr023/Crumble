/**
 * Crumble Client Main Game File
 * @author Connell Reffo
 */

import {
    Vec2, PlayerAnimationStates, FacingDirections, randomInt,
    PLAYER_NAMETAG_OFFSET, PLAYER_SHADOW_OFFSET, PLAYER_DIMENSIONS, NAMETAG_ENEMY_COLOUR, NAMETAG_SELF_COLOUR, TOTAL_CHUNK_SIZE, CHUNK_SIZE_PADDING, CHUNK_GROUND_COLOUR, CHUNK_EDGE_COLOUR, CHUNK_EDGE_HEIGHT, TILE_SIZE, BG_COLOUR
} from "./utils";

import { clientSocketId, inputUpdateInterval } from "./socket";
import { game, assets, RenderController, cameraPos } from "./renderer";

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

    private chunkEdge: ChunkEdge;

    /**
     * @param chunkPos Position to Render Chunk at
     */
    constructor(chunkPos: Vec2) {
        super();

        this.chunkPos = chunkPos;
        this.chunkEdge = new ChunkEdge(this.chunkPos);

        this.setRenderLayer(2);
    }

    public render() {
        const REND = gameInstance;

        const REND_POS = convertToCameraSpace(new Vec2(this.chunkPos.x * TOTAL_CHUNK_SIZE, this.chunkPos.y * TOTAL_CHUNK_SIZE));
        
        // Render Chunk Ground
        REND.noStroke();
        REND.fill(CHUNK_GROUND_COLOUR);
        REND.rectMode(REND.CENTER);
        REND.rect(REND_POS.x, REND_POS.y, TOTAL_CHUNK_SIZE + CHUNK_SIZE_PADDING, TOTAL_CHUNK_SIZE + CHUNK_SIZE_PADDING);
    }
}

/**
 * Chunk Edge Renderer
 */
class ChunkEdge extends RenderController {
    public chunkPos: Vec2;

    private particles: Array<{pos: Vec2, size: number, speed: number, direction: number}>;

    /**
     * @param chunkPos Position of Chunk to Place Edge At
     */
    constructor(chunkPos: Vec2) {
        super();

        this.chunkPos = chunkPos;
        this.particles = [];

        this.initParticles();
        this.setRenderLayer(1);
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
        REND.fill(CHUNK_EDGE_COLOUR);
        REND.rectMode(REND.CENTER);
        REND.rect(REND_POS.x, REND_POS.y, TOTAL_CHUNK_SIZE + CHUNK_SIZE_PADDING, CHUNK_EDGE_HEIGHT);

        // Render Particles
        this.particles.forEach((particle) => {
            particle.pos = new Vec2(particle.pos.x, particle.pos.y + REND.sin(REND.frameCount * 0.03) * particle.speed * particle.direction);

            const PARTICLE_REND_POS = new Vec2(REND_POS.x + particle.pos.x - (TOTAL_CHUNK_SIZE / 2), REND_POS.y + particle.pos.y);

            REND.fill(CHUNK_EDGE_COLOUR);
            REND.rectMode(REND.CENTER);
            REND.rect(PARTICLE_REND_POS.x, PARTICLE_REND_POS.y, particle.size, particle.size);
        });
    }
}

/**
 * Destroyed Tile Renderer
 */
export class DestroyedTile extends RenderController {
    public tilePos: Vec2;

    /**
     * @param tilePos Position of Destroyed Tile
     */
    constructor(tilePos: Vec2) {
        super();

        this.tilePos = tilePos;

        this.setRenderLayer(3);
    }

    public render() {
        const REND = gameInstance;

        const REND_POS = convertToCameraSpace(new Vec2(this.tilePos.x * TILE_SIZE, this.tilePos.y * TILE_SIZE + (TILE_SIZE / 2)));

        // Render Destroyed Tile
        REND.fill(BG_COLOUR);
        REND.rectMode(REND.CENTER);
        REND.rect(REND_POS.x, REND_POS.y, TILE_SIZE + CHUNK_SIZE_PADDING, TILE_SIZE + CHUNK_SIZE_PADDING);
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

    private speed: Vec2;
    private calculatingSpeed: boolean;
    private state: PlayerAnimationStates;
    private frame: number;

    private shadow: PlayerShadow;
    private nametag: Nametag;
    
    private dead: boolean;

    private deathFallVelocity: number;

    /**
     * @param name Name of the Player
     * @param pos Position of the Player
     * @param socketId Socket ID of the Player
     * @param renderLayer Layer to Render the Player on
     */
    constructor(name: string, pos: Vec2, socketId: string) {
        super(); {
            this.name = name;
            this.pos = pos;
            this.serverPos = pos;
            this.socketId = socketId;
            this.direction = FacingDirections.LEFT;

            this.calculatingSpeed = false;
            this.speed = Vec2.zero;
            this.state = PlayerAnimationStates.IDLE;
            this.frame = 0;

            this.dead = false;

            this.deathFallVelocity = 5;

            // Set Namtag Colour
            let nametagColour = NAMETAG_ENEMY_COLOUR;

            if (clientSocketId === this.socketId) {
                nametagColour = NAMETAG_SELF_COLOUR;
            }

            // Instantiate Other Render Controllers
            this.shadow = new PlayerShadow(this.pos);
            this.nametag = new Nametag(this.name, nametagColour, this.pos);

            // Set Render Layer
            this.setRenderLayer(5);
        }
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
        let renderLayer = 0;
        this.dead = true;

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
                        }
                    }

                    break;
                case PlayerAnimationStates.RUN:
                    if (this.frame < 2) {
                        this.frame = 2;
                    }

                    if (REND.frameCount % 10 === 0) {
                        this.frame++;

                        if (this.frame > PLAYER_DIMENSIONS.frames - 1) {
                            this.frame = 2;
                        }
                    }

                    break;
            }
        }
        else {
            this.frame = 0;
            this.state = PlayerAnimationStates.IDLE
        }

        // Set Shadow Position
        this.shadow.pos = new Vec2(this.pos.x, this.pos.y + PLAYER_SHADOW_OFFSET);

        // Set Nametag Position
        this.nametag.pos = new Vec2(this.pos.x, this.pos.y - PLAYER_NAMETAG_OFFSET);
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

        this.setRenderLayer(6);
    }

    public render() {
        const REND = gameInstance;

        const REND_POS = convertToCameraSpace(this.pos);

        // Render Background
        REND.fill(REND.color(0, 50));
        REND.rectMode(REND.CENTER);
        REND.rect(REND_POS.x, REND_POS.y + 2, this.text.length * 13, 25);

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