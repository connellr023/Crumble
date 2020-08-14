/**
 * Nametag Rendering Class
 * @author Connell Reffo
 */

import { gameInstance as REND, convertToCameraSpace } from "../game";
import { Vec2 } from "../utils";

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
        const REND_POS = convertToCameraSpace(this.pos);

        // Render Text
        REND.fill(this.colour);
        REND.textFont("Crumble");
        REND.textAlign(REND.CENTER, REND.CENTER);
        REND.textSize(25);
        REND.text(this.text, REND_POS.x, REND_POS.y);
    }
}