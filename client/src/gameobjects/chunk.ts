/**
 * Chunk and Chunk Edge Rendering Classes
 * @author Connell Reffo
 */

import { render } from "../scripts/game";
import { randomInt, Vec2, CHUNK_SIZE, TOTAL_CHUNK_SIZE, CHUNK_SIZE_PADDING, CHUNK_EDGE_HEIGHT, CHUNK_EDGE_COLOUR } from "../scripts/utils";

import Camera from "./camera";
import RenderController from "./controller";
import Tile from "./tile";

/**
 * Level Chunk Renderer
 */
export class Chunk {
    public chunkPos: Vec2;
    public tiles: Array<Tile>;

    public chunkEdge: ChunkEdge | undefined;

    /**
     * @param chunkPos Position to Render Chunk at
     */
    constructor(chunkPos: Vec2) {
        this.chunkPos = chunkPos;
        this.tiles = [];
        this.chunkEdge = undefined;

        this.initTiles();
    }

    /**
     * Populates Tiles Array with Tiles Inside this Chunk
     */
    private initTiles() {
        for (let y = 0; y < CHUNK_SIZE; y++) {
            for (let x = 0; x < CHUNK_SIZE; x++) {
                const TILE_POS = new Vec2(x + (this.chunkPos.x * CHUNK_SIZE), y + (this.chunkPos.y * CHUNK_SIZE));
                this.tiles.push(new Tile(TILE_POS));
            }
        }
    }
}

/**
 * Chunk Edge Renderer
 */
export class ChunkEdge extends RenderController {
    public chunkPos: Vec2;

    private particles: Array<{pos: Vec2, size: number, speed: number, direction: number}> = [];
    private particleCount: number = 5;

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
        const REND_POS = Camera.convertToCameraSpace(new Vec2(this.chunkPos.x * TOTAL_CHUNK_SIZE, this.chunkPos.y * TOTAL_CHUNK_SIZE + (TOTAL_CHUNK_SIZE / 2) + (CHUNK_EDGE_HEIGHT / 2)));

        // Render Chunk Edge
        render.noStroke();
        render.fill(CHUNK_EDGE_COLOUR);
        render.rectMode(render.CENTER);
        render.rect(REND_POS.x, REND_POS.y, TOTAL_CHUNK_SIZE + CHUNK_SIZE_PADDING, CHUNK_EDGE_HEIGHT);

        // Render Particles
        this.particles.forEach((particle) => {
            particle.pos = new Vec2(particle.pos.x, particle.pos.y + render.sin(render.frameCount * 0.03) * particle.speed * particle.direction);

            const PARTICLE_REND_POS = new Vec2(REND_POS.x + particle.pos.x - (TOTAL_CHUNK_SIZE / 2), REND_POS.y + particle.pos.y);

            render.noStroke();
            render.fill(CHUNK_EDGE_COLOUR);
            render.rectMode(render.CENTER);
            render.rect(PARTICLE_REND_POS.x, PARTICLE_REND_POS.y, particle.size, particle.size);
        });
    }
}