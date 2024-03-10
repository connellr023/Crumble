/**
 * Crumble Client Main HTML
 * @author Connell Reffo
 */
import "./App.scss";
import "./scripts/game";
import "./scripts/socket";

import { connectToLobby, displayContentArea } from "./scripts/interface";
import * as React from "react";

/**
 * Main Crumble Markup Component
 */
class App extends React.Component {
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
                    
                    <div id="how-to-play-content">
                        <div className="info-txt">The goal of Crumble is to be the final player standing. Parts of the level around you will crumble periodically indicated by a flashing red square.</div><br />
                        <img className="tut-img" src={process.env.PUBLIC_URL + "/tutorial/tile_crumble.png"} alt="Tile Crumbling" /><br />

                        <div className="info-txt">Players have the ability to fire rocket projectiles at certain angles. Upon impact, a rocket will knock them back as well as cause nearby tiles to instantly be destroyed. If a rocket hits a player, it will deal knockback as well destroy nearby tiles.</div>
                        <img className="tut-img" src={process.env.PUBLIC_URL + "/tutorial/rocket_projectile.png"} alt="Moving Rocket Projectile" /><br />
                        
                        <div className="info-txt">In terms of elimination. You can die by either falling through a crumbled tile or by falling off the edge of the map.</div>
                        <img className="tut-img" src={process.env.PUBLIC_URL + "/tutorial/falling_player.png"} alt="Falling Player" />

                        <br />
                    </div>
                    
                    <button className="standard-btn" id="cancel-queue" onClick={() => {displayContentArea("name-choose-menu")}}>BACK</button>
                </div>

                <div className="content-wrapper" id="controls-info" style={{display: "none"}}>
                    <div className="title-txt">&lt; CONTROLS &gt;</div>
                    
                    <div className="info-txt"><div className="key-icon">W</div> MOVES YOUR PLAYER UP</div>
                    <div className="info-txt"><div className="key-icon">A</div> MOVES YOUR PLAYER LEFT</div>
                    <div className="info-txt"><div className="key-icon">S</div> MOVES YOUR PLAYER DOWN</div>
                    <div className="info-txt"><div className="key-icon">D</div> MOVES YOUR PLAYER RIGHT</div>

                    <br />
                    <div className="info-txt"><div className="key-icon">LEFT CLICK</div> SHOOTS A ROCKET</div>
                    <div className="info-txt"><div className="key-icon">MOVE MOUSE</div> POINTS YOUR WEAPON</div>

                    <button className="standard-btn" id="cancel-queue" onClick={() => {displayContentArea("name-choose-menu")}}>BACK</button>
                </div>

                <div className="content-wrapper" id="match-wait-menu" style={{display: "none"}}>
                    <div className="title-txt">&lt; CRUMBLE &gt;</div>
                    <div className="subtitle-txt" id="player-waiting">WAITING FOR PLAYER(S)...</div>
                    <button className="standard-btn" id="cancel-queue" onClick={() => window.location.reload()}>CANCEL QUEUE</button>
                </div>
            </div>

            <div id="dev-name">&copy; CONNELL REFFO</div>
            <button id="leave-game" style={{display: "none"}} onClick={() => window.location.reload()}>LEAVE GAME</button>
        </>
        );
    }
}

export default App;