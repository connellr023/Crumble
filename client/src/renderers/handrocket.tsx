/**
 * Handrocket Rendering Class
 * @author Connell Reffo
 */

import { cameraPos, assets } from "../renderer";
import { gameInstance as REND, convertToCameraSpace } from "../game";
import { Vec2, FacingDirections, HandrocketAngles, HANDROCKET_DIMENSIONS } from "../utils";

import RenderController from "./controller";

/**
 * Player Held Handrocket Renderer
 */
export default class Handrocket extends RenderController {
    public pos: Vec2;
    public direction: FacingDirections;
    public angle: HandrocketAngles;

    private spriteFrame: number;

    /**
     * @param pos Position to Render Handrocket at
     */
    constructor(pos: Vec2) {
        super();

        this.pos = pos;
        this.direction = FacingDirections.LEFT;
        this.angle = HandrocketAngles.MIDDLE;

        this.spriteFrame = 0;

        this.setRenderLayer(6);
    }

    /**
     * Sets the Angle Sprite
     */
    public setAngle(angle: HandrocketAngles) {
        this.angle = angle;

        switch (this.angle) {
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