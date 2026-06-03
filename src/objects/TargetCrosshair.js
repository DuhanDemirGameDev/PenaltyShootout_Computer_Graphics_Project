import { GameObject } from "../core/GameObject.js";
import { Torus } from "../geometry/Torus.js";
import { Vec3 } from "../math/Vec3.js";

/**
 * Displays the current shot target as a ring in the goal plane.
 */
export class TargetCrosshair extends GameObject {
  /**
   * Creates the crosshair mesh at the default aim position.
   *
   * @param {WebGLRenderingContext|WebGL2RenderingContext} gl - Rendering context.
   */
  constructor(gl) {
    super({
      name: "Crosshair",
      geometry: new Torus(gl, 0.35, 0.08, 32, 16),
      material: { color: new Vec3(1.0, 0.0, 0.0) }
    });

    // Rotate the torus into the goal plane so it reads as a target ring.
    this.transform.position = new Vec3(0, 1.5, -6.5);
    this.transform.rotation.x = Math.PI / 2;
  }
}
