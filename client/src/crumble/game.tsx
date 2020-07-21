/**
 * Minecraft TSE Main Game File
 * @author Connell Reffo
 */

import {
    BG_COLOUR, Player, Vec2, IPlayerData, PlayerAnimationStates, CRUMBLE_GAME,
    PLAYER_SPRITE, SHADOW_SPRITE, PLAYER_NAMETAG_OFFSET, PLAYER_SHADOW_OFFSET, ANIMATION_TIME
} from "./utils";

import { connectedPlayers, clientSocketId, inputUpdateInterval } from "./socket";

import * as Phaser from "phaser";

let game: Phaser.Game;
let animationInterval: NodeJS.Timeout;

/**
 * Main Crumble Scene
 */
export class CrumbleGame extends Phaser.Scene {
    public players: any = {};

    constructor() {
        super({
            key: CRUMBLE_GAME
        });
    }

    public preload() {
        this.load.spritesheet(PLAYER_SPRITE, process.env.PUBLIC_URL + "/assets/player.png", { frameWidth: 5, frameHeight: 9 });
        this.load.image(SHADOW_SPRITE, process.env.PUBLIC_URL + "/assets/shadow.png");
    }

    /**
     * Instantiates a Player on the Client Side
     * @param name is the Name of the Player
     * @param pos is the Initial Position of the Player for it to be Rendered at
     * @param socketId Socket ID of Player to Render
     */
    public createPlayer(name: string, pos: Vec2, socketId: string) {

        // Create Shadow
        let shadow = this.add.sprite(pos.x, pos.y + PLAYER_SHADOW_OFFSET, SHADOW_SPRITE);
        shadow.scale = 6.3;
        shadow.alpha = 0.3;

        // Create Nametag
        let nametag = this.add.text(pos.x, pos.y - PLAYER_NAMETAG_OFFSET, name);
        nametag.setAlign("center");
        nametag.setFontSize(25);
        nametag.setResolution(3);
        nametag.setFontFamily("Crumble");
        
        if (clientSocketId === socketId) {
            nametag.setColor("#7cff70");
        }
        else {
            nametag.setColor("#ff5252");
        }

        // Create Player
        let player = this.add.sprite(pos.x, pos.y, PLAYER_SPRITE);
        player.scale = 6;

        this.players[socketId] = new Player(name, player, nametag, shadow);
    }

    /**
     * Creates Sprites When Game Starts
     */
    public create() {
        this.cameras.main.setZoom(1.5);

        // Render Players
        for (let socketId in connectedPlayers) {
            const PLAYER = connectedPlayers[socketId] as IPlayerData;
            this.createPlayer(PLAYER.name, new Vec2(PLAYER.pos.x, PLAYER.pos.y), socketId);
        }

        // Initialize Player Animation Loop
        animationInterval = setInterval(() => {
            
            // Loop Through Each Player
            for (let socketId in this.players) {
                const PLAYER = this.players[socketId] as Player;

                if (PLAYER.state === PlayerAnimationStates.IDLE) { // Idle Animation
                    if (PLAYER.animationFrame > 1) {
                        this.players[socketId].animationFrame = 0;
                    }

                    this.players[socketId].sprite.setFrame(PLAYER.animationFrame);
                }
                else { // Run Animation
                    if (PLAYER.animationFrame > 7) {
                        this.players[socketId].animationFrame = 2;
                    }
                    else if (PLAYER.animationFrame < 2) {
                        this.players[socketId].animationFrame = 2;
                    }

                    this.players[socketId].sprite.setFrame(PLAYER.animationFrame);
                }

                this.players[socketId].animationFrame++;
            }
        }, ANIMATION_TIME);
    }

    public update() {

        // Sync Players Variable with Connected Players
        for (let socketId in connectedPlayers) {
            const PLAYER = connectedPlayers[socketId] as IPlayerData;
            const LERP_VEC = Vec2.lerp(
                new Vec2(this.players[socketId].sprite.x, this.players[socketId].sprite.y),
                new Vec2(PLAYER.pos.x, PLAYER.pos.y), 0.2
            );
            
            this.players[socketId].sprite.setPosition(LERP_VEC.x, LERP_VEC.y);
        }

        // Update Players
        for (let socketId in this.players) {
            const PLAYER = this.players[socketId] as Player;

            // Calculate Speed
            if (!this.players[socketId].calculatingSpeed) {
                this.players[socketId].updateSpeed();
            }
            
            // Update Nametag Position
            this.players[socketId].nametag.setPosition(PLAYER.sprite.x - (this.players[socketId].name.length * this.players[socketId].nametagOffsetX), PLAYER.sprite.y - PLAYER_NAMETAG_OFFSET);

            // Update Shadow Position
            this.players[socketId].shadow.setPosition(PLAYER.sprite.x, PLAYER.sprite.y + PLAYER_SHADOW_OFFSET);
        }
        
        // Constantly Update Camera Center Position
        this.cameras.main.centerOnX(0);
        this.cameras.main.centerOnY(0);
    }
}

/**
 * Initialize Phaser
 */
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: "crumble-client",
    backgroundColor: BG_COLOUR,
    scene: CrumbleGame,
    scale: {
        mode: Phaser.Scale.RESIZE
    },
    render: {
        antialias: false,
        pixelArt: true
    }
}

/**
 * Starts Game
 */
export function startGame() {
    game = new Phaser.Game(config);
}

/**
 * Stops Game
 */
export function stopGame() {
    clearInterval(inputUpdateInterval);
    clearInterval(animationInterval);

    game.destroy(true);
}