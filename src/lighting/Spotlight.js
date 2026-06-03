import { Light } from "./Light.js";
import { Vec3 } from "../math/Vec3.js";
import { Mat4 } from "../math/Mat4.js";

/**
 * Stadium spotlight model that also provides the light-space matrix for shadows.
 */
export class Spotlight extends Light {
  constructor({
    position = new Vec3(0, 10, 0),
    target = new Vec3(0, 0, 0),
    color = new Vec3(1.0, 0.95, 0.85),
    intensity = 1.0,
    near = 1.0,
    far = 60.0,
  } = {}) {
    super({ position, color, intensity });
    this.target = target;
    this.near = near;
    this.far = far;
  }

  /**
   * @returns {Mat4} View matrix from the light position toward its target.
   */
  getViewMatrix() {
    return Mat4.lookAt(this.position, this.target, new Vec3(0, 1, 0));
  }

  /**
   * @returns {Mat4} Perspective projection used by the shadow pass.
   */
  getProjectionMatrix() {
    return Mat4.perspective(Math.PI / 2.5, 1.0, this.near, this.far);
  }

  /**
   * @returns {Mat4} Light-space matrix used for shadow-map rendering and lookup.
   */
  getLightSpaceMatrix() {
    return this.getProjectionMatrix().multiply(this.getViewMatrix());
  }
}
