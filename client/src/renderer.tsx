/**
 * Crumble Client Render Engine
 * @author Connell Reffo
 */

import { clientSocketId, connectedPlayers } from "./socket";
import { Vec2, BG_COLOUR, PLAYER_DIMENSIONS, HANDROCKET_DIMENSIONS, TOTAL_CHUNK_SIZE, GRAPHICS_PATH } from "./utils";

import RenderController from "./gameobjects/controller";
import p5 from "p5";

/**
 * Position of the Crumble Camera
 */
export let cameraPos = Vec2.zero;

/**
 * Position of the Mouse on the Canvas
 */
export let mousePos = Vec2.zero;

/**
 * Tracks Assets tp be Used in Game Rendering
 */
export let assets = {
    HANDROCKET_SPRITESHEET: [] as Array<p5.Image>,
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
    let handrocketSpritesheet: p5.Image;

    p.preload = () => {

        // Load Assets
        playerSpritesheet = p.loadImage(GRAPHICS_PATH + "player.png");
        handrocketSpritesheet = p.loadImage(GRAPHICS_PATH + "handrocket.png");

        assets.PLAYER_SHADOW = p.loadImage(GRAPHICS_PATH + "shadow.png");
    }

    p.setup = () => {

        // Split Player Spritesheet into Frames
        assets.PLAYER_SPRITESHEET = splitSpritesheet(playerSpritesheet, PLAYER_DIMENSIONS.width, PLAYER_DIMENSIONS.height, PLAYER_DIMENSIONS.frames);

        // Split Handrocket Spritesheet into Frames
        assets.HANDROCKET_SPRITESHEET = splitSpritesheet(handrocketSpritesheet, HANDROCKET_DIMENSIONS.width, HANDROCKET_DIMENSIONS.height, HANDROCKET_DIMENSIONS.frames);
        
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

        // Make Camera Lock to Player Chunk Pos
        if (!connectedPlayers[clientSocketId].dead) {
            const LERP_POS = Vec2.lerp(cameraPos, new Vec2(connectedPlayers[clientSocketId].currentChunk.x * TOTAL_CHUNK_SIZE, connectedPlayers[clientSocketId].currentChunk.y * TOTAL_CHUNK_SIZE), 0.1);

            setCameraPos(LERP_POS);
        }

        // Render All Render Controllers
        RenderController.renderAllControllers();

        // Set Mouse Position
        mousePos = new Vec2(p.mouseX, p.mouseY);
    }

    p.windowResized = () => {

        // Constantly Scale Canvas to Screen Size
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    }
}