/**
 * Crumble Client Main HTML
 * @author Connell Reffo
 */

import "./main.css";
import "./crumble/game";
import "./crumble/socket";

import { connectToLobby } from "./crumble/interface"

import * as React from "react";

class Main extends React.Component {
    render() {
        return (
        <>
            <div className="content-wrapper">
                <div className="title-txt">&lt; CRUMBLE &gt;</div>
                <input className="standard-input" id="name-input" spellCheck="false" placeholder="TYPE YOUR PLAYER NAME HERE"></input><br />
                <button className="standard-btn" id="name-conf" onClick={() => connectToLobby()}>ENTER QUEUE</button>
            </div>
        </>
        );
    }
}

export default Main;