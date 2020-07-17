/**
 * Crumble Server Main Game Handler
 * @author Connell Reffo
 */

import { server, SocketEvents } from "./server";

import * as socketIo from "socket.io";

/**
 * The Maximum Amount of Players that can be in a Single Game
 */
export const maxPlayers = 2;

/**
 * Tracks all active online games
 */
export let activeGames: Array<Game> = [];

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
    public socket: socketIo.Socket;

    /**
     * @param name Name of Player
     * @param position Position of Player
     * @param direction Direction Player is Facing
     * @param socket The Active Socket Connection between this Player and the Server
     */
    constructor (name: string, position: Vec2, direction: number, socket: socketIo.Socket) {
        this.name = name;
        this.position = position;
        this.direction = direction;
        this.socket = socket;
    }
}

export class Game {
    public lobbyId: string;
    public connectedPlayers: number;
    
    private io: socketIo.Server;
    private players: Array<Player>;

    constructor() {
        this.connectedPlayers = 1;

        // Register New Online Match
        activeGames.push(this);
    }

    /**
     * Executes When the Game Starts
     */
    public start() {

        // Create Socket IO Stream
        this.io = socketIo.listen(server, {
            path: `/${this.lobbyId}`
        });

        this.io.on(SocketEvents.CONNECTION, (socket) => {
            this.connectedPlayers++;

            socket.on(SocketEvents.REGISTER, (name: string) => {

                // Prevent Multiple Players of the Same Socket from being Registered
                for (let player in this.players) {
                    if (this.players[player].socket !== socket) {
                        this.players.push(new Player(name, Vec2.zero, 0, socket));
                    }
                }
            })
        });
    }

    /**
     * Executes once every game tick
     */
    public tick() {

    }

}