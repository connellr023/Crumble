/**
 * Minecraft TSE Main Game File
 * @author Connell Reffo
 */

import p5 from "p5";

export const backgroundColour = "#121212";

/**
 * Generates a Random Integer in a Range
 * @param min Minimum Value of Output
 * @param max Maximum Value of Output
 */
export function randomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Vec2 {
    public x: number;
    public y: number;

    /**
     * @param x X Position
     * @param y Y Position
     */
    constructor (x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

/**
 * Main Rendering Handler
 */
function Game(p: p5) {
    p.setup = () => {
        p.setAttributes("antialias", false);
        p.createCanvas(p.windowWidth, p.windowHeight + 12);
    }

    p.draw = () => {
        p.background(backgroundColour);
    }

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight + 12);
    }
}

new p5(Game);