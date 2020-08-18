/**
 * Crumble Server Map/Level Manager
 * @author Connell Reffo
 */

import { Vec2, ILevel, randomInt } from "../utils";

/**
 * Width of a Level in Chunks
 */
const MAP_WIDTH = 3;

/**
 * Manages Available Levels
 */
export default abstract class LevelManager {

    /**
     * Tracks Levels that can be Used Randomly
     */
    public static availableLevels: Array<ILevel> = [];

    /**
     * Returns a Random Level from Available Levels
     */
    public static randomLevel(): ILevel {
        return LevelManager.availableLevels[randomInt(0, LevelManager.availableLevels.length - 1)];
    }

    /**
     * Generates a Level Object Based on a String
     * Legend:
     *    # = Chunk
     *    SPACE = Nothing
     * @param level A String Which Represents a Level
     */
    public static createLevel(level: string) {
        let finalLevel: ILevel = {
             chunks: [],
             destroyedTiles: []
        };

        let chunkPos = Vec2.zero;
    
        for (let c = 0; c < level.length; c++) {
            if (chunkPos.x === MAP_WIDTH + 1) {
                chunkPos.x = 0;
                chunkPos.y++;
            }

            if (level[c] === "#") {
                finalLevel.chunks.push(new Vec2(chunkPos.x, chunkPos.y));
            }

            chunkPos.x++;
        }

        LevelManager.availableLevels.push(finalLevel);
    }
}

// Create Levels
LevelManager.createLevel(`
###
##
`);