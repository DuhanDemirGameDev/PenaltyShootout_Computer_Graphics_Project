import { Mat4 } from "../math/Mat4.js";
import { Vec3 } from "../math/Vec3.js";

/**
 * Represents a perspective camera with view and projection matrix helpers.
 */
export class Camera {
  /**
   * Creates a camera configured for the current scene viewport.
   *
   * @param {Object} [options] - Camera configuration.
   * @param {Vec3} [options.position] - Camera position in world space.
   * @param {Vec3} [options.target] - World-space point observed by the camera.
   * @param {Vec3} [options.up] - Up direction used to construct the view matrix.
   * @param {number} [options.fov] - Vertical field of view in radians.
   * @param {number} [options.aspectRatio] - Canvas width divided by canvas height.
   * @param {number} [options.near] - Near clipping plane distance.
   * @param {number} [options.far] - Far clipping plane distance.
   */
  constructor({
    position = new Vec3(0, 0, 5),
    target = new Vec3(0, 0, 0),
    up = new Vec3(0, 1, 0),
    fov = Math.PI / 4,
    aspectRatio = 1,
    near = 0.1,
    far = 100,
  } = {}) {
    this.position = position;
    this.target = target;
    this.up = up;
    this.fov = fov;
    this.aspectRatio = aspectRatio;
    this.near = near;
    this.far = far;
  }

  get front() {
    return this.target.subtract(this.position).normalize();
  }

  set front(direction) {
    this.target = this.position.add(direction.normalize());
  }

  getViewMatrix() {
    return Mat4.lookAt(this.position, this.target, this.up);
  }

  /**
   * @returns {Mat4} Perspective projection matrix for the current camera settings.
   */
  getProjectionMatrix() {
    return Mat4.perspective(this.fov, this.aspectRatio, this.near, this.far);
  }

  /**
   * Updates the camera aspect ratio after the canvas changes size.
   *
   * @param {number} width - Current canvas width in pixels.
   * @param {number} height - Current canvas height in pixels.
   */
  updateAspectRatio(width, height) {
    this.aspectRatio = height > 0 ? width / height : 1;
  }

  /**
   * Sets the vertical field of view using degrees for UI compatibility.
   *
   * @param {number} degrees - Field of view in degrees.
   */
  setFovDegrees(degrees) {
    this.fov = degrees * Math.PI / 180;
  }
}
