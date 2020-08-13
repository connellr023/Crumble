/**
 * Particle Rendering Classes
 * @author Connell Reffo
 */

import { gameInstance as REND, convertToCameraSpace } from "../game";
import { randomInt, Vec2, IParticle, TILE_DESTROY_PARTICLE_COLOUR, TILE_SIZE, MUZZLE_BLAST_PARTICLE_COLOUR, ROCKET_SMOKE_TRAIL_COLOUR, ROCKET_PROJECTILE_COLOUR } from "../utils";

import RenderController from "./controller";

/**
 * Generates a Random Speed Value for Either Rise or Run Particle Properties
 * @param speed Determines Overall if the Value will be Consistently Fast or Slow (Higher is Faster)
 */
function randomSpeed(speed: number): number {
    return randomInt(-300, 300) * (speed / 10000);
}

/**
 * Tile Destroy Particles Renderer
 */
export class TileDestroyParticles extends RenderController {
    public tilePos: Vec2;
    public stopParticles: boolean;
    
    private particles: Array<IParticle> = [];
    private particleCount: number = 12;
    private particleSpeedMultiplier: number;
    
    private minParticleSize: number = 8;
    private maxParticleSize: number = 12;

    private minLifetime: number = 30;
    private maxLifetime: number = 80;

    private baseSpeed: number = 25;

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
        for (let pc = 0; pc < this.particleCount; pc++) {
            this.particles.push({
                pos: this.tilePos,
                size: randomInt(this.minParticleSize, this.maxParticleSize),
                maxLifetimeFrames: randomInt(this.minLifetime, this.maxLifetime),
                lifetimeFrames: 0,
                direction: {
                    rise: randomSpeed(this.baseSpeed),
                    run: randomSpeed(this.baseSpeed)
                }
            });
        }
    }

    public render() {
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
                    particle.size = randomInt(this.minParticleSize, this.maxParticleSize);
                    particle.maxLifetimeFrames = randomInt(this.minLifetime, this.maxLifetime);
                    particle.lifetimeFrames = 0;
                    particle.direction = {
                        rise: randomSpeed(this.baseSpeed),
                        run: randomSpeed(this.baseSpeed)
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

            particle.pos = new Vec2(particle.pos.x + (particle.direction.run * this.particleSpeedMultiplier), particle.pos.y + (particle.direction.rise * this.particleSpeedMultiplier));
            particle.lifetimeFrames++;
        });

        // Delete Current Render Controller
        if (this.particles.length === 0) {
            RenderController.remove(this);
        }
    }
}

/**
 * Handrocket Initial Shot Blast Particles
 */
export class MuzzleBlastParticles extends RenderController {
    public pos: Vec2;

    private particles: Array<IParticle> = [];
    private particleCount: number = 12;

    private minParticleSize: number = 9;
    private maxParticleSize: number = 12;

    private baseSpeed: number = 60;

    /**
     * @param pos Position to Create Particles At
     */
    constructor(pos: Vec2) {
        super();

        this.pos = pos;

        this.setRenderLayer(7);
        this.initParticles();
    }

    /**
     * Initializes Particles Array
     */
    private initParticles() {
        for (let pc = 0; pc < this.particleCount; pc++) {
            this.particles.push({
                pos: this.pos,
                size: randomInt(this.minParticleSize, this.maxParticleSize),
                maxLifetimeFrames: randomInt(20, 35), 
                lifetimeFrames: 0,
                direction: {
                    rise: randomSpeed(this.baseSpeed),
                    run: randomSpeed(this.baseSpeed)
                }
            });
        }
    }

    public render() {

        // Render Particles
        this.particles.forEach((particle) => {
            const PARTICLE_REND_POS = convertToCameraSpace(particle.pos);

            REND.noStroke();
            REND.fill(MUZZLE_BLAST_PARTICLE_COLOUR);
            REND.rectMode(REND.CENTER);
            REND.rect(PARTICLE_REND_POS.x + (particle.direction.run * 0.4), PARTICLE_REND_POS.y + (particle.direction.rise * 0.4), particle.size, particle.size);

            if (particle.lifetimeFrames >= particle.maxLifetimeFrames && this.particles.length > 0) {
                this.particles = this.particles.filter((part) => {
                    return part !== particle;
                });
            }
            else if (particle.lifetimeFrames >= particle.maxLifetimeFrames - particle.size) {
                particle.size--;
            }
            else if (this.particles.length === 0) {

                // Destroy Instance when All Particles are Gone
                RenderController.remove(this);
            }

            particle.pos = new Vec2(particle.pos.x + (particle.direction.run), particle.pos.y + (particle.direction.rise));
            particle.lifetimeFrames++;
        });
    }
}

/**
 * Smoke Trail Renderer
 */
export class SmokeTrailParticles extends RenderController {
    public pos: Vec2;
    public stopParticles: boolean;

    private particles: Array<IParticle> = [];
    private particleCount: number = 10;
    
    private minParticleSize: number = 8;
    private maxParticleSize: number = 11;

    private minLifetime: number = 10;
    private maxLifetime: number = 65;

    private baseSpeed: number = 30;

    /**
     * @param pos Initial Position to Start Rendering At
     */
    constructor(pos: Vec2) {
        super();

        this.pos = pos;

        this.stopParticles = false;

        this.setRenderLayer(6);
        this.initParticles();
    }

    /**
     * Initializes Particles Array
     */
    private initParticles() {
        for (let pc = 0; pc < this.particleCount; pc++) {
            this.particles.push({
                pos: this.pos,
                size: randomInt(this.minParticleSize, this.maxParticleSize),
                maxLifetimeFrames: randomInt(this.minLifetime, this.maxLifetime), 
                lifetimeFrames: 0,
                direction: {
                    rise: randomSpeed(this.baseSpeed),
                    run: randomSpeed(this.baseSpeed)
                }
            });
        }
    }

    public render() {

        // Render Particles
        this.particles.forEach((particle) => {
            const PARTICLE_REND_POS = convertToCameraSpace(particle.pos);

            REND.noStroke();
            REND.fill(ROCKET_SMOKE_TRAIL_COLOUR);
            REND.rectMode(REND.CENTER);
            REND.rect(PARTICLE_REND_POS.x, PARTICLE_REND_POS.y, particle.size, particle.size);

            if (particle.lifetimeFrames >= particle.maxLifetimeFrames) {
                if (!this.stopParticles) {
                    particle.pos = this.pos;
                    particle.size = randomInt(this.minParticleSize, this.maxParticleSize);
                    particle.maxLifetimeFrames = randomInt(this.minLifetime, this.maxLifetime);
                    particle.lifetimeFrames = 0;
                    particle.direction = {
                        rise: randomSpeed(this.baseSpeed),
                        run: randomSpeed(this.baseSpeed)
                    }
                }
                else if (this.particles.length > 0) {
                    this.particles = this.particles.filter((part) => {
                        return part !== particle;
                    });
                }       
            }
            else if (particle.lifetimeFrames >= particle.maxLifetimeFrames - particle.size) {
                particle.size--;
            }

            particle.pos = new Vec2(particle.pos.x + (particle.direction.run), particle.pos.y + (particle.direction.rise));
            particle.lifetimeFrames++;
        });

        // Check if All Particles are Gone and Delete Current Instance
        if (this.particles.length === 0) {
            RenderController.remove(this);
        }
    }
}

/**
 * Rocket Explosion Particles
 */
export class ExplodeParticles extends RenderController {
    public pos: Vec2;

    private particles: Array<IParticle> = [];
    private particleCount: number = 10;
    
    private minParticleSize: number = 8;
    private maxParticleSize: number = 11;

    private minLifetime: number = 20;
    private maxLifetime: number = 35;

    private baseSpeed: number = 95;

    /**
     * @param pos Position to Render Explosion At
     */
    constructor(pos: Vec2) {
        super();

        this.pos = pos;

        this.setRenderLayer(7);
        this.initParticles();
    }

    /**
     * Initializes Particles Array
     */
    public initParticles() {
        for (let pc = 0; pc < this.particleCount; pc++) {
            this.particles.push({
                pos: this.pos,
                size: randomInt(this.minParticleSize, this.maxParticleSize),
                maxLifetimeFrames: randomInt(this.minLifetime, this.maxLifetime), 
                lifetimeFrames: 0,
                direction: {
                    rise: randomSpeed(this.baseSpeed),
                    run: randomSpeed(this.baseSpeed)
                }
            });
        }
    }

    public render() {

        // Render Particles
        this.particles.forEach((particle) => {
            const PARTICLE_REND_POS = convertToCameraSpace(particle.pos);

            REND.noStroke();
            REND.fill(ROCKET_PROJECTILE_COLOUR);
            REND.rectMode(REND.CENTER);
            REND.rect(PARTICLE_REND_POS.x, PARTICLE_REND_POS.y, particle.size, particle.size);

            if (particle.lifetimeFrames >= particle.maxLifetimeFrames) {
                if (this.particles.length > 0) {
                    this.particles = this.particles.filter((part) => {
                        return part !== particle;
                    });
                }
            }
            else if (particle.lifetimeFrames >= particle.maxLifetimeFrames - particle.size) {
                particle.size--;
            }

            particle.pos = new Vec2(particle.pos.x + (particle.direction.run), particle.pos.y + (particle.direction.rise));
            particle.lifetimeFrames++;
        });

        // Delete Current Render Controller
        if (this.particles.length === 0) {
            RenderController.remove(this);
        }
    }
}
