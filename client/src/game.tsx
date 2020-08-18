/**
 * Crumble Client Main Game File
 * @author Connell Reffo
 */

import { Vec2 } from "./utils";
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
 * Background Scroll Position
 */
let scrollY = 0;

/**
 * Background Scroll Effect Interval
 */
let backgroundScroll = setInterval(() => {
    $("html").css("background-position-y", `${scrollY}px`);

    scrollY += 0.1;
}, 1);

/**
 * Starts Game
 */
export function startGame() {
    clearInterval(backgroundScroll);

    render = new p5(game);

    $("canvas").css("display", "block");
    $("#leave-game").css("display", "block");
    $("html").css("background-image", "none");
}