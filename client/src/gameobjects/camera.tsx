/**
 * Camera Manager Class
 * @author Connell Reffo
 */

import { Vec2 } from "../utils";
import { render } from "../game";

export default abstract class Camera {
    public static pos: Vec2;

    /**
     * Converts a 2D Vector to a Position Relative to Camera View
     * @param pos Position to Convert
     */
    public static convertToCameraSpace(pos: Vec2): Vec2 {
        return new Vec2(
            (render.windowWidth / 2) + pos.x - this.pos.x,
            (render.windowHeight / 2) + pos.y - this.pos.y
        );
    }
}