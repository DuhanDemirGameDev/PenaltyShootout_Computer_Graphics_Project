import { Light } from "./Light.js";
import { Vec3 } from "../math/Vec3.js";
import { Mat4 } from "../math/Mat4.js";

// ============================================================
// Spot Işık Sınıfı
// Stadyum ışık kulelerinden sahneye yönelen spot ışıkları temsil eder.
// Gölge haritalama için light-space matrisini hesaplar.
// ============================================================

export class Spotlight extends Light {
  constructor({
    position = new Vec3(0, 10, 0),
    target = new Vec3(0, 0, 0),
    color = new Vec3(1.0, 0.95, 0.85),
    intensity = 1.5,
    near = 1.0,
    far = 60.0,
  } = {}) {
    super({ position, color, intensity });
    this.target = target;
    this.near = near;
    this.far = far;
  }

  /** Işığın gözünden bakış matrisi */
  getViewMatrix() {
    return Mat4.lookAt(this.position, this.target, new Vec3(0, 1, 0));
  }

  /** Işığın perspektif projeksiyon matrisi */
  getProjectionMatrix() {
    return Mat4.perspective(Math.PI / 2.5, 1.0, this.near, this.far);
  }

  /** Gölge haritalama için: projection * view */
  getLightSpaceMatrix() {
    return this.getProjectionMatrix().multiply(this.getViewMatrix());
  }
}
