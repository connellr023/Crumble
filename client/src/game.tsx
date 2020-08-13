/**
 * Crumble Client Main Game File
 * @author Connell Reffo
 */

import { Vec2 } from "./utils";
import { inputUpdateInterval } from "./socket";
import { game, cameraPos } from "./renderer";

import $ from "jquery";
import p5 from "p5";

/**
 * Current Instance of P5 Renderer
 */
export let gameInstance: p5;

/**
 * Converts a 2D Vector to a Position Relative to Camera View
 * @param pos Position to Convert
 */
export function convertToCameraSpace(pos: Vec2): Vec2 {
    return new Vec2(
        (gameInstance.windowWidth / 2) + pos.x - cameraPos.x,
        (gameInstance.windowHeight / 2) + pos.y - cameraPos.y
    );
}

/**
 * Starts Game
 */
export function startGame() {
    gameInstance = new p5(game);
    $("canvas").css("display", "block");
}

/**
 * Stops Game
 */
export function stopGame() {
    clearInterval(inputUpdateInterval);
    $("canvas").remove();
}