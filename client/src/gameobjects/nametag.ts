/**
 * Nametag Rendering Class
 * @author Connell Reffo
 */

import { render } from "../scripts/game";
import { Vec2 } from "../scripts/utils";

import Camera from "./camera";
import RenderController from "./controller";

/**
 * Player Nametag Renderer
 */
export default class Nametag extends RenderController {
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

        this.setRenderLayer(9);
    }

    public render() {
        const REND_POS = Camera.convertToCameraSpace(this.pos);

        // Render Text
        render.fill(this.colour);
        render.textFont("Crumble");
        render.textAlign(render.CENTER, render.CENTER);
        render.textSize(25);
        render.text(this.text, REND_POS.x, REND_POS.y);
    }
}