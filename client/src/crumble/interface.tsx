/**
 * Crumble Client Main Interface Manager
 * @author Connell Reffo
 */

import { handleClientSocket } from "./socket";

import $ from "jquery";

/**
 * Displays a Message Under the Crumble Title Element on the Main Screen
 * @param message Message to Dispay to the Client
 */
export function displayClientMsg(message: string) {
    
}

/**
 * Asks the Crumble Server for an Available Lobby ID
 */
export function connectToLobby() {
    const name = $("#name-input").val() as string;

    // Send AJAX Request
    $.ajax({
        type: "POST",
        url: "/api/find-lobby",
        dataType: "json",
        success: (res) => {
            if (res.lobby != null) {
                handleClientSocket(name, res.lobby as string);
            }
            else {
                console.log("Maximum Amount of Active Games Reached");
            }
        },
        error: (error) => {
            console.log(`ERROR: ${error}`);
        }
    });
}