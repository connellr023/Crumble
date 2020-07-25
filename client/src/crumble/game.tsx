/**
 * Crumble Client Main Game File
 * @author Connell Reffo
 */

import {
    Vec2, PlayerAnimationStates,
    PLAYER_NAMETAG_OFFSET, PLAYER_SHADOW_OFFSET, ANIMATION_MS, PLAYER_DIMENSIONS
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
    public serverPos: Vec2;
    public socketId: string;

    private speed: Vec2;
    private calculatingSpeed: boolean;
    private state: PlayerAnimationStates;
    private frame: number;
    private shadow: PlayerShadow;

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

            this.calculatingSpeed = false;
            this.speed = Vec2.zero;
            this.state = PlayerAnimationStates.IDLE;
            this.frame = 0;

            this.shadow = new PlayerShadow(this.pos);
            this.setRenderLayer(1);
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

        const REND_POS = new Vec2(
            (REND.windowWidth / 2) + this.pos.x + cameraPos.x,
            (REND.windowHeight / 2) + this.pos.y + cameraPos.y
        );

        // Render Player Sprite
        REND.imageMode(REND.CENTER);
        REND.image(
            assets.PLAYER_SPRITESHEET[this.frame],
            REND_POS.x,
            REND_POS.y,
            PLAYER_DIMENSIONS.width * PLAYER_DIMENSIONS.scale,
            PLAYER_DIMENSIONS.height * PLAYER_DIMENSIONS.scale
        );

        // Set Shadow Position
        this.shadow.pos = new Vec2(this.pos.x, this.pos.y + PLAYER_SHADOW_OFFSET);

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
export class PlayerShadow extends RenderController {
    public pos: Vec2;

    /**
     * @param pos Position to Render Shadow at
     */
    constructor(pos: Vec2) {
        super(); {
            this.pos = pos;
            this.setRenderLayer(0);
        }
    }

    public render() {
        const REND = gameInstance;

        // Render Shadow
        const REND_POS = new Vec2(
            (REND.windowWidth / 2) + this.pos.x + cameraPos.x,
            (REND.windowHeight / 2) + this.pos.y + cameraPos.y
        );

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