/**
 * Rocket Projectile Rendering Class
 * @author Connell Reffo
 */

import { gameInstance as REND, convertToCameraSpace } from "../game";
import { Vec2, CLIENT_ROCKET_SPEED, ROCKET_PROJECTILE_COLOUR } from "../utils";

import { SmokeTrailParticles, ExplodeParticles } from "./particles";

import RenderController from "./controller";
 
/**
 * Handrocket Projectile Renderer
 */
export default class Rocket extends RenderController {
    public pos: Vec2;
    public direction: Vec2;

    private trailParticles: SmokeTrailParticles;

    /**
     * @param pos Initial Position of Projectile
     * @param direction The Direction the Rocket is Moving in
     */
    constructor(pos: Vec2, direction: Vec2) {
        super();

        this.pos = pos;
        this.direction = direction;

        this.trailParticles = new SmokeTrailParticles(this.pos);

        this.setRenderLayer(7);
    }

    /**
     * Explodes the Current Rocket Instance
     */
    public explode() {

        // Halt Trail Particles
        this.trailParticles.stopParticles = true;

        // Instantiate Explosion Particles
        new ExplodeParticles(this.pos);

        // Delete Current Render Controller
        RenderController.remove(this);
    }

    public render() {

        // Move Client Side Instance of Test Projectile
        this.pos = new Vec2(this.pos.x + (CLIENT_ROCKET_SPEED * this.direction.x), this.pos.y + (CLIENT_ROCKET_SPEED * this.direction.y * 0.75));

        // Set Position of Trail
        this.trailParticles.pos = this.pos;

        const REND_POS = convertToCameraSpace(this.pos);

        // Render Projectile
        REND.noStroke();
        REND.fill(ROCKET_PROJECTILE_COLOUR);
        REND.rectMode(REND.CENTER);
        REND.rect(REND_POS.x, REND_POS.y, 13, 13);  
    }
}