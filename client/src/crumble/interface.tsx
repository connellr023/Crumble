/**
 * Crumble Client Main Interface Manager
 * @author Connell Reffo
 */

import { handleClientSocket } from "./socket";

import $ from "jquery";

let enteredQueue = false;

/**
 * Sets the Value of Entered Queue (Required for Access Cross File)
 * @param value Value of Entered Queue Variable to be Set
 */
export function setEnteredQueue(value: boolean) {
    enteredQueue = value;
}

/**
 * Displays a Message Under the Crumble Title Element on the Main Screen
 * @param message Message to Dispay to the Client
 */
export function displayClientMsg(message: string) {
    const $clientMsg = $("#client-msg");

    $clientMsg.css("display", "block");
    $clientMsg.text(message);
}

/**
 * Asks the Crumble Server for an Available Lobby ID
 */
export function connectToLobby() {
    const name = $("#name-input").val() as string;

    const maxNameLength = 16;

    if (!enteredQueue) {

        // Check if Name is Too Long
        if (name.length > maxNameLength) {
            displayClientMsg(`Player Name Must be Under ${maxNameLength} Characters`);
        }
        else if (name.length === 0) {
            displayClientMsg("Player Name Must be Greater than 0 Characters");
        }
        else {

            // Send AJAX Request
            $.ajax({
                type: "POST",
                url: "/api/find-lobby",
                dataType: "json",
                success: (res) => {
                    if (res.lobby != null) {
                        handleClientSocket(name, res.lobby as string);
                        setEnteredQueue(true);
                    }
                    else {
                        displayClientMsg("Maximum Amount of Active Games Reached");
                    }
                },
                error: (error) => {
                    console.log(`ERROR: ${error}`);
                }
            });
        }
    }
}