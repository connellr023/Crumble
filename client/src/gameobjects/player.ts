/**
 * Player Rendering Class
 * @author Connell Reffo
 */

import { assets } from "../scripts/renderer";
import { render } from "../scripts/game";
import { Vec2, FacingDirections, PlayerAnimationStates, HandrocketAngles, HANDROCKET_DIMENSIONS, NAMETAG_ENEMY_COLOUR, NAMETAG_SELF_COLOUR, TOTAL_CHUNK_SIZE, PLAYER_DIMENSIONS, PLAYER_SHADOW_OFFSET, PLAYER_NAMETAG_OFFSET, PLAYER_FALL_DIMENSIONS } from "../scripts/utils";
import { clientSocketId } from "../scripts/socket";
import { Image } from "p5";

import Camera from "./camera";
import Handrocket from "./handrocket"
import Shadow from "./shadow";
import Nametag from "./nametag";
import RenderController from "./controller";

import { MuzzleBlastParticles } from "./particles";

/**
 * Player Renderer
 */
export default class Player extends RenderController {
    public name: string;
    public pos: Vec2;
    public direction: FacingDirections;
    public serverPos: Vec2;
    public socketId: string;

    public currentChunk: Vec2;
    public dead: boolean;

    public handrocket: Handrocket;
    public shadow: Shadow;
    public nametag: Nametag;

    private speed: Vec2;
    private calculatingSpeed: boolean;
    private state: PlayerAnimationStates;
    private frame: number;

    private handrocketVertOffset: number;

    private fallAcceleration = 1.2;
    private fallVelocity: number = 14;
    private fallTerminalVelocity: number = 50;

    /**
     * @param name Name of the Player
     * @param pos Position of the Player
     * @param socketId Socket ID of the Player
     * @param renderLayer Layer to Render the Player on
     */
    constructor(name: string, pos: Vec2, socketId: string) {
        super();

        this.name = name;
        this.pos = pos;
        this.serverPos = pos;
        this.socketId = socketId;
        this.direction = FacingDirections.LEFT;
        this.currentChunk = Vec2.zero;

        this.calculatingSpeed = false;
        this.speed = Vec2.zero;
        this.state = PlayerAnimationStates.IDLE;
        this.frame = 0;

        this.dead = false;

        this.handrocketVertOffset = HANDROCKET_DIMENSIONS.vertOffsetNormal;

        // Set Namtag Colour
        let nametagColour = NAMETAG_ENEMY_COLOUR;

        if (clientSocketId === this.socketId) {
            nametagColour = NAMETAG_SELF_COLOUR;
        }

        // Instantiate Other Render Controllers
        this.handrocket = new Handrocket(this.pos);
        this.shadow = new Shadow(this.pos);
        this.nametag = new Nametag(this.name, nametagColour, this.pos);

        // Calculate Current Chunk
        this.calcCurrentChunk();

        // Set Render Layer
        this.setRenderLayer(5);
    }

    /**
     * Destroys the Current Client Side Player Instance
     */
    public destroy() {
        RenderController.remove(this.handrocket);
        RenderController.remove(this.shadow);
        RenderController.remove(this.nametag);
        RenderController.remove(this);
    }

    /**
     * Sets the Angle the the Handrocket Should Point
     * @param angle The Angle to Set the Handrocket to Point Towards
     */
    public setHandrocketAngle(angle: HandrocketAngles) {
        this.handrocket.setAngle(angle);
    }

    /**
     * Returns the Chunk Position of Whatever Chunk the Player is Currently on
     */
    public calcCurrentChunk() {
        this.currentChunk = new Vec2(Math.round(this.pos.x / (TOTAL_CHUNK_SIZE)), Math.round(this.pos.y / (TOTAL_CHUNK_SIZE)));
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

    /**
     * Triggers When this Player Dies
     * @param fellOffFront Tells the Client if the Player Should be Rendered on Top or Behind Chunks (Adds Depth)
     */
    public onDeath(fellOffFront: boolean) {
        let renderLayer = 1;

        this.dead = true;
        this.frame = 0;

        this.handrocket.invisible = true;
        this.shadow.invisible = true;
        this.nametag.invisible = true;

        if (fellOffFront) {
            renderLayer = 5;
        }

        this.setRenderLayer(renderLayer);

        const REND_POS = Camera.convertToCameraSpace(this.pos);

        const DEATH_INTERVAL = setInterval(() => {
            if (REND_POS.y >= 610) {
                clearInterval(DEATH_INTERVAL);
            }

            if (this.fallVelocity < this.fallTerminalVelocity) {
                this.fallVelocity += this.fallAcceleration;
            }

            this.serverPos = new Vec2(this.pos.x, this.pos.y + this.fallVelocity);
        }, 15);
    }

    /**
     * Instantiates Muzzle Blast Particles at the Position of the Handrocket Muzzle
     */
    public createMuzzleBlast() {

        // Set Direction
        let direction = -1;

        if (this.direction === FacingDirections.RIGHT) {
            direction = 1;
        }

        // Set Offset Values
        let offset = Vec2.zero;  

        switch(this.handrocket.angle) {
            case HandrocketAngles.UP:
                offset = new Vec2(30 * direction, -15);
                break;

            case HandrocketAngles.MIDDLE:
                offset = new Vec2(50 * direction, -10);
                break;

            case HandrocketAngles.DOWN:
                offset = new Vec2(35 * direction, 12);
                break;
        }

        // Create Muzzle Blast Instance
        new MuzzleBlastParticles(new Vec2(this.handrocket.pos.x + offset.x, this.handrocket.pos.y + offset.y));
    }

    /**
     * Renders a Sprite as the Player
     * @param sprite Sprite to Render
     * @param renderPos Position on Canvas to Render Sprite at
     * @param width Width of Sprite
     * @param height Height of Sprite
     */
    private renderPlayerSprite(sprite: Image, renderPos: Vec2, width: number, height: number) {
        render.push();

        switch (this.direction) {
            case FacingDirections.LEFT:
                render.scale(1, 1);
                break;
            case FacingDirections.RIGHT:
                render.translate(renderPos.x - Camera.pos.x + (render.windowWidth / 2) + this.pos.x, 0);
                render.scale(-1, 1);
                break;
        }

        render.imageMode(render.CENTER);
        render.image(
            sprite,
            renderPos.x,
            renderPos.y,
            width,
            height
        );

        render.pop();
    }

    public render() {

        // Lerp Position
        this.pos = Vec2.lerp(this.pos, this.serverPos, 0.12);

        const REND_POS = Camera.convertToCameraSpace(this.pos);

        // Update Player Speed
        if (!this.calculatingSpeed) {
            this.updateSpeed();
        }

        // Set Animation State
        const ANIM_SPEED_THRESHOLD = 0.4;

        if (!this.dead) {

            // Check Player Speed
            if (this.speed.x > ANIM_SPEED_THRESHOLD || this.speed.y > ANIM_SPEED_THRESHOLD) {
                this.state = PlayerAnimationStates.RUN;
            }
            else {
                this.state = PlayerAnimationStates.IDLE;
            }

            // Animate Player
            switch (this.state) {
                case PlayerAnimationStates.IDLE:
                    if (render.frameCount % 20 === 0) {
                        this.frame++;

                        if (this.frame > 1) {
                            this.frame = 0;
                            this.handrocketVertOffset = HANDROCKET_DIMENSIONS.vertOffsetNormal;
                        }
                        else {
                            this.handrocketVertOffset = HANDROCKET_DIMENSIONS.vertOffsetDown;
                        }
                    }

                    break;

                case PlayerAnimationStates.RUN:
                    if (this.frame < 2) {
                        this.frame = 1;
                    }

                    if (render.frameCount % 6 === 0) {
                        if (this.frame >= PLAYER_DIMENSIONS.frames - 1) {
                            this.frame = 1;
                            this.handrocketVertOffset = HANDROCKET_DIMENSIONS.vertOffsetNormal;
                        }
                        else if (this.frame === 2 || this.frame === 4 || this.frame === 6) {
                            this.handrocketVertOffset = HANDROCKET_DIMENSIONS.vertOffsetUp;
                        }
                        else {
                            this.handrocketVertOffset = HANDROCKET_DIMENSIONS.vertOffsetNormal;
                        }

                        this.frame++;
                    }

                    break;
            }

            // Update Sprite
            this.renderPlayerSprite(assets.PLAYER_SPRITESHEET[this.frame], REND_POS, PLAYER_DIMENSIONS.width * PLAYER_DIMENSIONS.scale, PLAYER_DIMENSIONS.height * PLAYER_DIMENSIONS.scale);
        }
        else {
            this.state = PlayerAnimationStates.IDLE;

            // Animate Falling Player
            if (render.frameCount % 10 === 0) {
                this.frame++;

                if (this.frame > PLAYER_FALL_DIMENSIONS.frames - 1) {
                    this.frame = 0;
                }
            }

            // Update Sprite
            this.renderPlayerSprite(assets.PLAYER_FALL_SPRITESHEET[this.frame], REND_POS, PLAYER_FALL_DIMENSIONS.width * PLAYER_DIMENSIONS.scale, PLAYER_FALL_DIMENSIONS.height * PLAYER_DIMENSIONS.scale);
        }

        // Set Held Handrocket Position
        this.handrocket.pos = new Vec2(this.pos.x, this.pos.y + this.handrocketVertOffset);
        this.handrocket.direction = this.direction;

        // Set Shadow Position
        this.shadow.pos = new Vec2(this.pos.x, this.pos.y + PLAYER_SHADOW_OFFSET);

        // Set Nametag Position
        this.nametag.pos = new Vec2(this.pos.x, this.pos.y - PLAYER_NAMETAG_OFFSET);
    }
}