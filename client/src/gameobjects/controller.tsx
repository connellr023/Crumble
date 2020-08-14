/**
 * Main Render Controller Outline
 * @author Connell Reffo
 */

import { MIN_LAYER, MAX_LAYER } from "../utils";

/**
 * Outline for Render Control Instances
 */
export default abstract class RenderController {
    public static layers: any = {};

    public renderLayer: number = 0;
    public invisible: boolean = false;

    /**
     * Sets the Render Layer of the Render Controller
     * @param layer Render Layer to Set to
     */
    public setRenderLayer(layer: number) {
        RenderController.layers[this.renderLayer.toString()].forEach((renderer: RenderController, index: number) => {
            if (renderer === this) {
                delete RenderController.layers[this.renderLayer.toString()][index];
            }
        });

        this.renderLayer = layer;
        RenderController.layers[this.renderLayer.toString()].push(this);
    }

    /**
     * Executes Every Frame
     */
    public abstract render(): void;

    /**
     * Initializes Render Layer Object
     */
    public static initLayers() {
        for (let layer = MIN_LAYER; layer < MAX_LAYER; layer++) {
            RenderController.layers[layer.toString()] = [];
        }
    }

    /**
     * Deletes a Render Controller from the Render Layers Variable
     * @param renderer Render Controller to Delete
     */
    public static remove(renderer: RenderController) {
        for (let layer in RenderController.layers) {
            for (let renderController in RenderController.layers[layer]) {
                if (RenderController.layers[layer][renderController] === renderer) {
                    delete RenderController.layers[layer][renderController];
                }
            }
        }
    }

    /**
     * Renders Every Controller Instance in the Layers Array
     */
    public static renderAllControllers() {
        for (let layer in RenderController.layers) {
            const CONTROLLERS = RenderController.layers[layer] as Array<RenderController>;

            CONTROLLERS.forEach((renderController) => {
                if (!renderController.invisible) {
                    renderController.render();
                }
            });
        }
    }
}