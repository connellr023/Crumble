/**
 * Crumble Client Main Game File
 * @author Connell Reffo
 */

import {
    Vec2, PlayerAnimationStates, FacingDirections,
    PLAYER_NAMETAG_OFFSET, PLAYER_SHADOW_OFFSET, ANIMATION_MS, PLAYER_DIMENSIONS, NAMETAG_ENEMY_COLOUR, NAMETAG_SELF_COLOUR
} from "./utils";

import { clientSocketId, inputUpdateInterval } from "./socket";
import { game, assets, RenderController, cameraPos } from "./renderer";

import $ from "jquery";
import p5 from "p5";

let gameInstance: p5;
let animationInterval: NodeJS.Timeout;

/**
 * Player Renderer
 */
export class Player extends RenderController {
    public name: string;
    public pos: Vec2;
    public direction: FacingDirections;
    public serverPos: Vec2;
    public socketId: string;

    private speed: Vec2;
    private calculatingSpeed: boolean;
    private state: PlayerAnimationStates;
    private frame: number;

    private shadow: PlayerShadow;
    private nametag: Nametag;

    /**
     * @param name Name of the Player
     * @param pos Position of the Player
     * @param socketId Socket ID of the Player
     * @param renderLayer Layer to Render the Player on
     */
    constructor(name: string, pos: Vec2, socketId: string) {
        super(); {
            this.name = name;
            this.pos = pos;
            this.serverPos = pos;
            this.socketId = socketId;
            this.direction = FacingDirections.LEFT;

            this.calculatingSpeed = false;
            this.speed = Vec2.zero;
            this.state = PlayerAnimationStates.IDLE;
            this.frame = 0;

            // Set Namtag Colour
            let nametagColour = NAMETAG_ENEMY_COLOUR;

            if (clientSocketId == this.socketId) {
                nametagColour = NAMETAG_SELF_COLOUR;
            }

            // Instantiate Other Render Controllers
            this.shadow = new PlayerShadow(this.pos);
            this.nametag = new Nametag(this.name, nametagColour, this.pos);

            // Set Render Layer
            this.setRenderLayer(2);
        }
    }

    /**
     * Updates the Speed Variable of this Player
     * @param socketId Socket ID of Player to Calculate Speed for
     */
    public async updateSpeed() {

        // Calculate Speed
        this.calculatingSpeed = true;

        const SPEED_POS_OLD = new Vec2(this.pos.x, this.pos.y);
        const RUN_ANIM_THRESHOLD = 0.55;

        setTimeout(() => {

            // Set Speed Variable
            this.speed = new Vec2(
                Math.abs(SPEED_POS_OLD.x - this.pos.x),
                Math.abs(SPEED_POS_OLD.y - this.pos.y)
            );

            this.calculatingSpeed = false;
        }, 150);

        // Set Animation State
        if (this.speed.x > RUN_ANIM_THRESHOLD || this.speed.y > RUN_ANIM_THRESHOLD) {
            this.state = PlayerAnimationStates.RUN;
        }
        else {
            this.state = PlayerAnimationStates.IDLE;
        }
    }

    public render() {
        const REND = gameInstance;

        // Lerp Position
        this.pos = Vec2.lerp(this.pos, this.serverPos, 0.25);

        const REND_POS = convertToCameraSpace(this.pos);

        // Render Player Sprite
        REND.push();

        switch (this.direction) {
            case FacingDirections.LEFT:
                REND.scale(1, 1);
                break;
            case FacingDirections.RIGHT:
                const HORIZONTAL_OFFSET = 682;

                REND.translate(REND_POS.x + this.pos.x + HORIZONTAL_OFFSET + PLAYER_DIMENSIONS.width * PLAYER_DIMENSIONS.scale, 0);
                REND.scale(-1, 1);
                break;
        }

        REND.imageMode(REND.CENTER);
        REND.image(
            assets.PLAYER_SPRITESHEET[this.frame],
            REND_POS.x,
            REND_POS.y,
            PLAYER_DIMENSIONS.width * PLAYER_DIMENSIONS.scale,
            PLAYER_DIMENSIONS.height * PLAYER_DIMENSIONS.scale
        );
        REND.pop();

        // Set Shadow Position
        this.shadow.pos = new Vec2(this.pos.x, this.pos.y + PLAYER_SHADOW_OFFSET);

        // Set Nametag Position
        this.nametag.pos = new Vec2(this.pos.x, this.pos.y - PLAYER_NAMETAG_OFFSET);

        // Update Player Speed
        if (!this.calculatingSpeed) {
            this.updateSpeed();
        }

        // Set Animation State
        const ANIM_SPEED_THRESHOLD = 0.4;

        if (this.speed.x > ANIM_SPEED_THRESHOLD || this.speed.y > ANIM_SPEED_THRESHOLD) {
            this.state = PlayerAnimationStates.RUN;
        }
        else {
            this.state = PlayerAnimationStates.IDLE;
        }

        // Animate Player
        switch (this.state) {
            case PlayerAnimationStates.IDLE:
                if (REND.frameCount % 20 === 0) {
                    this.frame++;

                    if (this.frame > 1) {
                        this.frame = 0;
                    }
                }

                break;
            case PlayerAnimationStates.RUN:
                if (this.frame < 2) {
                    this.frame = 2;
                }

                if (REND.frameCount % 10 === 0) {
                    this.frame++;

                    if (this.frame > PLAYER_DIMENSIONS.frames - 1) {
                        this.frame = 2;
                    }
                }

                break;
        }
    }
}

/**
 * Player Shadow Renderer
 */
class PlayerShadow extends RenderController {
    public pos: Vec2;

    /**
     * @param pos Position to Render Shadow at
     */
    constructor(pos: Vec2) {
        super(); {
            this.pos = pos;
            this.setRenderLayer(1);
        }
    }

    public render() {
        const REND = gameInstance;

        // Render Shadow
        const REND_POS = convertToCameraSpace(this.pos);

        REND.tint(255, 80);
        REND.imageMode(REND.CENTER);
        REND.image(
            assets.PLAYER_SHADOW,
            REND_POS.x,
            REND_POS.y,
            6 * PLAYER_DIMENSIONS.scale,
            4 * PLAYER_DIMENSIONS.scale
        );
        REND.tint(255, 255);
    }
}

/**
 * Player Nametag Renderer
 */
class Nametag extends RenderController {
    public text: string;
    public colour: string;
    public pos: Vec2;

    /**
     * @param pos Position to Render Namtag at
     */
    constructor(text: string, colour: string, pos: Vec2) {
        super(); {
            this.text = text;
            this.colour = colour;
            this.pos = pos;

            this.setRenderLayer(3);
        }
    }

    public render() {
        const REND = gameInstance;

        // Render Nametag
        const REND_POS = convertToCameraSpace(this.pos);

        REND.fill(this.colour);
        REND.textFont("Crumble");
        REND.textAlign(REND.CENTER, REND.CENTER);
        REND.textSize(30);
        REND.text(this.text, REND_POS.x, REND_POS.y);
    }
}

/**
 * Converts a 2D Vector to a Position Relative to Camera View
 * @param pos Position to Convert
 */
export function convertToCameraSpace(pos: Vec2): Vec2 {
    return new Vec2(
        (gameInstance.windowWidth / 2) + pos.x + cameraPos.x,
        (gameInstance.windowHeight / 2) + pos.y + cameraPos.y
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
    clearInterval(animationInterval);
    $("canvas").remove();
}