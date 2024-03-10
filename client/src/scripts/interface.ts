/**
 * Crumble Client Main Interface Manager
 * @author Connell Reffo
 */

import { handleClientSocket } from "./socket";
import { NAMETAG_ENEMY_COLOUR, NAMETAG_SELF_COLOUR, MAX_NAME_LENGTH } from "./utils";

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
 * Switches to a Different Content Area
 * @param id The ID of the Content Wrapper Element
 */
export function displayContentArea(id: string) {
    $(".content-wrapper").hide();
    $(`#${id}`).css("display", "block");
}

/**
 * Displays a Message Under the Crumble Title Element on the Main Screen
 * @param message Message to Dispay to the Client
 */
export function displayClientMsg(message: string) {
    const $clientMsg = $("#client-msg");

    $clientMsg.css("display", "block");
    $clientMsg.text(message.toUpperCase());

    setTimeout(() => {
        $clientMsg.hide();
    }, message.length * 110);
}

/**
 * Asks the Crumble Server for an Available Lobby ID
 */
export function connectToLobby() {
    const NAME = $("#name-input").val()?.toString().trim() as string;

    // Check if Already Entered Queue
    if (!enteredQueue) {

        // Check if Name is Too Long
        if (NAME.length > MAX_NAME_LENGTH) {
            displayClientMsg(`Player Name Must be Under ${MAX_NAME_LENGTH} Characters`);
        }
        else if (NAME.length === 0) {
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
                        handleClientSocket(NAME, res.lobby as string);
                        setEnteredQueue(true);
                    }
                    else {
                        displayClientMsg("Maximum Amount of Active Games Reached");
                    }
                },
                error: (error) => {
                    displayClientMsg("500: Internal Server Error");
                }
            });
        }
    }
}

/**
 * Displays Win/Loss Screen
 * @param name Name of the Winner
 * @param won If the Current Client Won
 */
export function displayWinner(name: string, won: boolean) {
    if (won) {
        $("#winner-txt").css("color", NAMETAG_SELF_COLOUR);
    }
    else {
        $("#winner-txt").css("color", NAMETAG_ENEMY_COLOUR);
    }

    $("#leave-game").hide();
    $("#winner-txt").text(`< ${name.toUpperCase()} WINS >`);
    $("#win-screen-container").css("display", "block");
}

/**
 * Displays a Connection Error for the Client
 * @param error Error Message to Display
 */
export function displayConnectionError(error: string) {
    if (!enteredQueue) {
        $("#leave-game").hide();

        $("#winner-txt").css("color", NAMETAG_ENEMY_COLOUR);
        $("#winner-txt").text(error.toUpperCase());

        $("#win-screen-container").css("display", "block");
    }
    else {
        $("#player-waiting").text(error.toUpperCase());
        $("#player-waiting").css("color", NAMETAG_ENEMY_COLOUR);
    }
}