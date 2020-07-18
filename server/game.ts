/**
 * Crumble Server Main Game Handler
 * @author Connell Reffo
 */

import { io, SocketEvents } from "./server";

import * as socketIo from "socket.io";

/**
 * The Maximum Amount of Players that can be in a Single Game
 */
export const maxPlayers = 2;

/**
 * Tracks all active online games
 */
export let activeGames: Array<Game> = [];

/**
 * Generates a Random Integer in a Range
 * @param min Minimum Value of Output
 * @param max Maximum Value of Output
 */
function randomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class Vec2 {
    public x: number;
    public y: number;

    public static zero = new Vec2(0, 0);

    /**
     * @param x X Position
     * @param y Y Position
     */
    constructor (x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export class Player {
    public name: string;
    public position: Vec2;
    public direction: number;
    public socketId: string;

    /**
     * @param name Name of Player
     * @param position Position of Player
     * @param direction Direction Player is Facing
     * @param socketId The Socket ID of the Connected Player
     */
    constructor (name: string, position: Vec2, direction: number, socketId: string) {
        this.name = name;
        this.position = position;
        this.direction = direction;
        this.socketId = socketId;
    }
}

export class Game {
    public lobbyId: string;
    public players: Array<Player> = [];
    public namespace: socketIo.Namespace;

    constructor() {
        // Generate Lobby ID
        this.lobbyId = activeGames.length + randomInt(0, 100).toString();
    }

    /**
     * Registers the Current Game Instance as Active
     */
    public registerActiveGame() {
        activeGames.push(this);
        console.log(`[+] Opened Game "${this.lobbyId}"`);

        this.namespace = io.of(`/lobbies/${this.lobbyId}`);

        this.setup();
    }

    /**
     * Pushes a New Player Instance to the Players Array
     * @param name Name of Player
     * @param socketId ID of Active Socket Connection
     */
    public addPlayer(name: string, socketId: string) {
        const player = new Player(name, Vec2.zero, 0, socketId);
        this.players.push(player);
    }

    /**
     * Removes Player by Socket from Players Array
     * @param socketId Socket ID of Player to Remove
     */
    public removePlayer(socketId: string) {
        this.players.forEach((player, index) => {
            if (player.socketId === socketId) {
                delete this.players[index];
            }
        });
    }

    /**
     * Executes When the Game Starts
     */
    public setup() {
        
        // Setup Namespace
        this.namespace.on(SocketEvents.CONNECTION, (socket) => {

            // Socket Player Register Event
            socket.on(SocketEvents.REGISTER, (name: string) => {
                this.addPlayer(name, socket.id);
                console.log(`[+] Added Player "${name}" to "${this.namespace.name}"`);
            });

            // Socket Disconnect Event
            socket.on(SocketEvents.DISCONNECT, () => {
                this.namespace.emit(SocketEvents.PLAYER_LEAVE, socket.id);

                delete io.nsps[this.namespace.name];
                activeGames = activeGames.filter((game) => {
                    return game.lobbyId !== this.lobbyId;
                });

                console.log(`[x] Closed Game "${this.lobbyId}" Due to Socket ID "${socket.id}"`);
            });
        });
    }

    /**
     * Executes Once Every Game Tick
     */
    public tick() {

    }
}