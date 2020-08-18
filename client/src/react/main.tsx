/**
 * Crumble Client Main HTML
 * @author Connell Reffo
 */

import "./main.css";
import "../game";
import "../socket";

import { connectToLobby, displayContentArea } from "../interface";

import * as React from "react";

/**
 * Main Crumble Markup Component
 */
class Main extends React.Component {
    render() {
        return (
        <>
            <div id="win-screen-container" style={{display: "none"}}>
                <div id="winner-txt"></div>
                <button id="exit-win-screen-btn" onClick={() => window.location.reload()}>BACK TO HOME</button>
            </div>

            <div id="content-wrapper-container">
                <div className="content-wrapper" id="name-choose-menu" style={{display: "block"}}>
                    <div className="title-txt">&lt; CRUMBLE &gt;</div>

                    <div className="hlink" onClick={() => {displayContentArea("how-to-play-info")}}>HOW TO PLAY</div>
                    <div className="hlink" onClick={() => {displayContentArea("controls-info")}}>CONTROLS</div><br />

                    <div id="client-msg" style={{display: "none"}}></div>
                    <input className="standard-input" id="name-input" spellCheck="false" placeholder="TYPE YOUR PLAYER NAME HERE"></input><br />
                    <button className="standard-btn" id="name-conf" onClick={() => connectToLobby()}>ENTER QUEUE</button>
                </div>

                <div className="content-wrapper" id="how-to-play-info" style={{display: "none"}}>
                    <div className="title-txt">&lt; HOW TO PLAY &gt;</div>
                    <div className="info-txt">Lorem ipsum dolor sit, amet consectetur adipisicing elit. Veniam fugiat quisquam hic repudiandae, ab velit odit obcaecati optio fuga quae nihil neque adipisci sit ad. Quasi, labore ullam? Ipsam, velit.</div><br />
                    <button className="standard-btn" id="cancel-queue" onClick={() => {displayContentArea("name-choose-menu")}}>BACK</button>
                </div>

                <div className="content-wrapper" id="controls-info" style={{display: "none"}}>
                    <div className="title-txt">&lt; CONTROLS &gt;</div>
                    <div className="info-txt">Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorum atque fugiat accusamus at, ipsam id rem deserunt nisi, itaque dicta commodi repellendus deleniti in voluptates doloremque optio suscipit temporibus ex?</div><br />
                    <button className="standard-btn" id="cancel-queue" onClick={() => {displayContentArea("name-choose-menu")}}>BACK</button>
                </div>

                <div className="content-wrapper" id="match-wait-menu" style={{display: "none"}}>
                    <div className="title-txt">&lt; CRUMBLE &gt;</div>
                    <div className="subtitle-txt">WAITING FOR PLAYER(S)...</div>
                    <button className="standard-btn" id="cancel-queue" onClick={() => window.location.reload()}>CANCEL QUEUE</button>
                </div>
            </div>

            <div id="dev-name">&copy; CONNELL REFFO</div>
            <button id="leave-game" style={{display: "none"}} onClick={() => window.location.reload()}>LEAVE GAME</button>
        </>
        );
    }
}

export default Main;