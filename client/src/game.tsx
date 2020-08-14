/**
 * Crumble Client Main Game File
 * @author Connell Reffo
 */

import { Vec2 } from "./utils";
import { inputUpdateInterval } from "./socket";
import { game } from "./renderer";

import Camera from "./gameobjects/camera";
import $ from "jquery";
import p5 from "p5";

/**
 * Initialize Camera Position Variable
 */
Camera.pos = Vec2.zero;

/**
 * Current Instance of P5 Renderer
 */
export let render: p5;

/**
 * Starts Game
 */
export function startGame() {
    render = new p5(game);
    $("canvas").css("display", "block");
}

/**
 * Stops Game
 */
export function stopGame() {
    clearInterval(inputUpdateInterval);
    $("canvas").remove();
}