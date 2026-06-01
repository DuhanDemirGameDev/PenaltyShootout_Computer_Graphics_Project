import { Mat4 } from "../math/Mat4.js";
import { Vec3 } from "../math/Vec3.js";

export class Camera {
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

  getProjectionMatrix() {
    return Mat4.perspective(this.fov, this.aspectRatio, this.near, this.far);
  }

  updateAspectRatio(width, height) {
    this.aspectRatio = height > 0 ? width / height : 1;
  }

  setFovDegrees(degrees) {
    this.fov = degrees * Math.PI / 180;
  }
}
