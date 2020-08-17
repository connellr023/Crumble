/**
 * Tile Rendering Class
 * @author Connell Reffo
 */

import { Vec2, RGBColourCode, TILE_NORMAL_COLOUR, TILE_WEAK_COLOUR, TILE_SIZE, CHUNK_SIZE_PADDING } from "../utils";
import { render } from "../game";

import Camera from "./camera";
import RenderController from "./controller";
import { TileDestroyParticles } from "./particles";

export default class Tile extends RenderController {
    public tilePos: Vec2;

    private weak: boolean;

    private fadeColour: RGBColourCode;
    private renderColour: RGBColourCode;

    /**
     * @param tilePos Tile Position to Render Tile at
     */
    constructor(tilePos: Vec2) {
        super();

        this.tilePos = tilePos;

        this.weak = false;

        this.renderColour = TILE_NORMAL_COLOUR;
        this.fadeColour = this.renderColour;

        this.setRenderLayer(3);
    }

    /**
     * Destroys rhe Current Tile Instance
     * @param ms Milliseconds Before the Tile Explodes
     */
    public async destroy(ms: number) {
        let interval: NodeJS.Timeout;

        this.weak = true;

        // Flash Effect
        if (ms > 0) {
            let flash = false;

            interval = setInterval(() => {
                if (flash) {
                    this.fadeColour = TILE_WEAK_COLOUR;
                }
                else {
                    this.fadeColour = TILE_NORMAL_COLOUR;
                }

                flash = !flash;
            }, 250);
        }

        // Hide Tile When Timer Runs Out
        setTimeout(() => {
            clearInterval(interval);
            this.invisible = true;

            // Create Explosion Particles
            new TileDestroyParticles(this.tilePos);

            // Camera Shake
            Camera.shake(3.5, 9);
        }, ms);
    }

    public render() {
        const REND_POS = Camera.convertToCameraSpace(new Vec2(this.tilePos.x * TILE_SIZE - (TILE_SIZE * 1.5), this.tilePos.y * TILE_SIZE - (TILE_SIZE * 1.5)));

        // Lerp Colour
        this.renderColour = RGBColourCode.lerp(this.renderColour, this.fadeColour, 1.8);

        // Render Tile
        render.noStroke();
        render.fill(render.color(this.renderColour.r, this.renderColour.g, this.renderColour.b));
        render.rectMode(render.CENTER);
        render.rect(REND_POS.x, REND_POS.y, TILE_SIZE + CHUNK_SIZE_PADDING, TILE_SIZE + CHUNK_SIZE_PADDING);
    }
}