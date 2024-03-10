/**
 * Camera Manager Class
 * @author Connell Reffo
 */

import { Vec2, randomInt, TOTAL_CHUNK_SIZE } from "../scripts/utils";
import { connectedPlayers, clientSocketId } from "../scripts/socket";
import { render } from "../scripts/game";

export default abstract class Camera {
    public static pos: Vec2;

    private static shakePower: number = 0;
    private static shakeTimer: number = 0;

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

    /**
     * Executes Every Frame
     */
    public static update() {

        // Make Camera Lock to Player Chunk Pos
        if (!connectedPlayers[clientSocketId].dead) {
            const LERP_POS = Vec2.lerp(Camera.pos, new Vec2(connectedPlayers[clientSocketId].currentChunk.x * TOTAL_CHUNK_SIZE, connectedPlayers[clientSocketId].currentChunk.y * TOTAL_CHUNK_SIZE), 0.1);

            Camera.pos = LERP_POS;
        }

        // Process Camera Shake
        if (Camera.shakeTimer >= 0) {
            const MAX_CAM_DIST = 5;

            let shakePos = new Vec2(randomInt(-MAX_CAM_DIST, MAX_CAM_DIST) * Camera.shakePower, randomInt(-MAX_CAM_DIST, MAX_CAM_DIST) * this.shakePower);
            Camera.pos = new Vec2(Camera.pos.x + shakePos.x, Camera.pos.y + shakePos.y);

            this.shakeTimer--;
        }
    }

    /**
     * Shakes the Camera
     * @param power The Power of the Shake
     * @param duration The Duration of the Shake in Frames
     */
    public static shake(power: number, duration: number) {
        Camera.shakePower = power;
        Camera.shakeTimer = duration;
    }
}