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
            <div className="content-wrapper" id="name-choose-menu" style={{display: "block"}}>
                <div className="title-txt">&lt; CRUMBLE &gt;</div>
                <div id="client-msg" style={{display: "none"}}></div>
                <input className="standard-input" id="name-input" spellCheck="false" placeholder="TYPE YOUR PLAYER NAME HERE"></input><br />
                <button className="standard-btn" id="name-conf" onClick={() => connectToLobby()}>ENTER QUEUE</button>
            </div>

            <div className="content-wrapper" id="match-wait-menu" style={{display: "none"}}>
                <div className="title-txt">&lt; CRUMBLE &gt;</div>
                <div className="subtitle-txt">Waiting For Player(s)...</div>
                <button className="standard-btn" id="cancel-queue" onClick={() => window.location.reload()}>CANCEL QUEUE</button>
            </div>
        </>
        );
    }
}

export default Main;