/**
 * Player Shadow Rendering Class
 * @author Connell Reffo
 */

import { assets } from "../renderer";
import { gameInstance as REND, convertToCameraSpace } from "../game";
import { Vec2, PLAYER_DIMENSIONS } from "../utils";

import RenderController from "./controller";

/**
 * Player Shadow Renderer
 */
export default class Shadow extends RenderController {
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

        // Render Shadow
        const REND_POS = convertToCameraSpace(this.pos);

        REND.tint(255, 80);
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