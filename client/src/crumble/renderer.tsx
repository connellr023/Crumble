/**
 * Crumble Client Render Engine
 * @author Connell Reffo
 */

import { clientSocketId, connectedPlayers } from "./socket";
import { Vec2, BG_COLOUR, MIN_LAYER, MAX_LAYER, PLAYER_DIMENSIONS } from "./utils";

import p5 from "p5";

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
 * Deletes a Render Controller from the Render Layers Variable
 * @param renderer Render Controller to Delete
 */
export function deleteRenderController(renderer: RenderController) {
    for (let layer in renderLayers) {
        for (let renderController in renderLayers[layer]) {
            if (renderLayers[layer][renderController] === renderer) {
                delete renderLayers[layer][renderController];
            }
        }
    }
}

/**
 * Splits a Spritesheet Horizontally
 * @param sheet Spritesheet Image
 * @param spriteWidth Width of Individual Sprite
 * @param spriteHeight Height of Individual Sprite
 * @param frames Frames in Spritesheet
 */
function splitSpritesheet(sheet: p5.Image, spriteWidth: number, spriteHeight: number, frames: number): Array<p5.Image> {
    const splitSheet: Array<p5.Image> = [];

    for (let frame = 0; frame < spriteWidth * frames; frame += spriteWidth) {
        const FRAME_IMAGE = sheet.get(frame, 0, spriteWidth, spriteHeight);

        splitSheet.push(FRAME_IMAGE);
    }

    return splitSheet;
}

/**
 * Main P5 Instance to Handle Render Controller Rendering
 */
export function game(p: p5) {
    let playerSpritesheet: p5.Image;

    p.preload = () => {

        // Load Assets
        playerSpritesheet = p.loadImage(process.env.PUBLIC_URL + "/assets/player.png");

        assets.PLAYER_SHADOW = p.loadImage(process.env.PUBLIC_URL + "/assets/shadow.png");
    }

    p.setup = () => {

        // Split Player Spritesheet Into Frames
        assets.PLAYER_SPRITESHEET = splitSpritesheet(playerSpritesheet, PLAYER_DIMENSIONS.width, PLAYER_DIMENSIONS.height, PLAYER_DIMENSIONS.frames);
        
        // Initialize Canvas
        const CANV = p.createCanvas(p.windowWidth, p.windowHeight, p.P2D);
        const CONTEXT = CANV.elt.getContext("2d");

        CONTEXT.mozImageSmoothingEnabled = false;
        CONTEXT.webkitImageSmoothingEnabled = false;
        CONTEXT.msImageSmoothingEnabled = false;
        CONTEXT.imageSmoothingEnabled = false;

        p.frameRate(60);
        p.disableFriendlyErrors = true;
    }

    p.draw = () => {
        p.background(BG_COLOUR);

        // Make Camera Follow Player
        if (!connectedPlayers[clientSocketId].dead) {
            const LERP_POS = Vec2.lerp(cameraPos, connectedPlayers[clientSocketId].pos, 0.1);

            setCameraPos(LERP_POS);
        }

        // Render all Render Controllers
        for (let layer in renderLayers) {
            const CONTROLLERS = renderLayers[layer] as Array<RenderController>;

            CONTROLLERS.forEach((renderController) => {
                if (!renderController.invisible) {
                    renderController.render();
                }
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
    public invisible: boolean = false;

    /**
     * Sets the Render Layer of the Render Controller
     * @param layer Render Layer to Set to
     */
    public setRenderLayer(layer: number) {
        renderLayers[this.renderLayer.toString()].forEach((renderer: RenderController, index: number) => {
            if (renderer === this) {
                delete renderLayers[this.renderLayer.toString()][index];
            }
        });

        this.renderLayer = layer;
        renderLayers[this.renderLayer.toString()].push(this);
    }

    /**
     * Executes Every Frame
     */
    public render() {}
}