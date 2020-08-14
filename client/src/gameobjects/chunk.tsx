/**
 * Chunk and Chunk Edge Rendering Classes
 * @author Connell Reffo
 */

import { gameInstance as REND, convertToCameraSpace } from "../game";
import { randomInt, Vec2, CHUNK_SIZE, TOTAL_CHUNK_SIZE, CHUNK_SIZE_PADDING, CHUNK_EDGE_HEIGHT, CHUNK_EDGE_COLOUR, CHUNK_GROUND_COLOUR, TILE_SIZE } from "../utils";

import RenderController from "./controller";

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

    private particles: Array<{pos: Vec2, size: number, speed: number, direction: number}> = [];
    private particleCount: number = 7;

    /**
     * @param chunkPos Position of Chunk to Place Edge At
     */
    constructor(chunkPos: Vec2) {
        super();

        this.chunkPos = chunkPos;

        this.setRenderLayer(2);
        this.initParticles();
    }

    /**
     * Initializes Chunk Edge Particle Effect
     */
    private initParticles() {
        for (let pc = 0; pc < this.particleCount; pc++) {
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