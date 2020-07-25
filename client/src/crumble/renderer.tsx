/**
 * Crumble Client Render Engine
 * @author Connell Reffo
 */

import { Vec2, BG_COLOUR, MIN_LAYER, MAX_LAYER, PLAYER_DIMENSIONS } from "./utils";

import p5 from "p5";
import $ from "jquery";

/**
 * Tracks Render Controllers in Render Layers
 */
let renderLayers: any = {};

/**
 * Position of the Crumble Camera
 */
export let cameraPos = Vec2.zero;

/**
 * Tracks Assets tp be Used in Game Rendering
 */
export let assets = {
    PLAYER_SPRITESHEET: [] as Array<p5.Image>,
    PLAYER_SHADOW: new p5.Image()
};

/**
 * Sets the Position of the Crumble Camera
 * @param pos Position to Change Camera to
 */
export function setCameraPos(pos: Vec2) {
    cameraPos = pos;
}

/**
 * Initializes Render Layer Object
 */
export function initRenderLayers() {
    for (let layer = MIN_LAYER; layer < MAX_LAYER; layer++) {
        renderLayers[layer.toString()] = [];
    }
}

/**
 * Main P5 Instance to Handle RenderController Rendering
 */
export function game(p: p5) {
    let playerSpritesheet: p5.Image;

    p.preload = () => {

        // Load Assets
        playerSpritesheet = p.loadImage(process.env.PUBLIC_URL + "/assets/player.png");

        assets.PLAYER_SHADOW = p.loadImage(process.env.PUBLIC_URL + "/assets/shadow.png");
    }

    p.setup = () => {

        // Split Spritesheet Into Frames
        for (let frame = 0; frame < PLAYER_DIMENSIONS.width * PLAYER_DIMENSIONS.frames; frame += PLAYER_DIMENSIONS.width) {
            const FRAME = playerSpritesheet.get(frame, 0, PLAYER_DIMENSIONS.width, PLAYER_DIMENSIONS.height);

            assets.PLAYER_SPRITESHEET.push(FRAME);
        }
        
        // Initialize Canvas
        const CANV = p.createCanvas(p.windowWidth, p.windowHeight, p.P2D);
        const CONTEXT = CANV.elt.getContext("2d");

        CONTEXT.mozImageSmoothingEnabled = false;
        CONTEXT.webkitImageSmoothingEnabled = false;
        CONTEXT.msImageSmoothingEnabled = false;
        CONTEXT.imageSmoothingEnabled = false;

        p.frameRate(60);

        $("canvas").css("image-rendering", "pixelated");
    }

    p.draw = () => {
        p.background(BG_COLOUR);

        // Render all Render Controllers
        for (let layer in renderLayers) {
            const CONTROLLERS = renderLayers[layer] as Array<RenderController>;

            CONTROLLERS.forEach((renderController) => {
                renderController.render();
            });
        }
    }

    p.windowResized = () => {

        // Constantly Scale Canvas to Screen Size
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    }
}

export class RenderController {
    public renderLayer: number = 0;

    /**
     * Sets the Render Layer of the Render Controller
     * @param layer Render Layer to Set to
     */
    public setRenderLayer(layer: number) {
        delete renderLayers[this.renderLayer.toString()][this];

        this.renderLayer = layer;
        renderLayers[this.renderLayer.toString()].push(this);
    }

    /**
     * Executes Every Frame
     */
    public render() {}
}