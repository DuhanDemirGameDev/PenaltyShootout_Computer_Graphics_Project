import { Vec3 } from "./Vec3.js";

export class Mat4 {
  constructor(elements) {
    this.elements = elements
      ? new Float32Array(elements)
      : Mat4.identity().elements;
  }

  multiply(otherMatrix) {
    return Mat4.multiply(this, otherMatrix);
  }

  transformVec3(vector, w = 1) {
    const m = this.elements;
    const x = vector.x;
    const y = vector.y;
    const z = vector.z;

    const resultX = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    const resultY = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    const resultZ = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    const resultW = m[3] * x + m[7] * y + m[11] * z + m[15] * w;

    if (resultW !== 0 && resultW !== 1) {
      return new Vec3(resultX / resultW, resultY / resultW, resultZ / resultW);
    }

    return new Vec3(resultX, resultY, resultZ);
  }

  static identity() {
    return new Mat4([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);
  }

  static multiply(a, b) {
    const left = a.elements;
    const right = b.elements;
    const result = new Float32Array(16);

    for (let column = 0; column < 4; column += 1) {
      for (let row = 0; row < 4; row += 1) {
        result[column * 4 + row] =
          left[0 * 4 + row] * right[column * 4 + 0]
          + left[1 * 4 + row] * right[column * 4 + 1]
          + left[2 * 4 + row] * right[column * 4 + 2]
          + left[3 * 4 + row] * right[column * 4 + 3];
      }
    }

    return new Mat4(result);
  }

  static translation(x, y, z) {
    return new Mat4([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1,
    ]);
  }

  static rotationX(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    return new Mat4([
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ]);
  }

  static rotationY(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    return new Mat4([
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ]);
  }

  static rotationZ(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    return new Mat4([
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);
  }

  static scaling(x, y, z) {
    return new Mat4([
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1,
    ]);
  }

  static perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const rangeInv = 1 / (near - far);

    return new Mat4([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * 2 * rangeInv, 0,
    ]);
  }

  static lookAt(eye, center, up) {
    const forward = eye.subtract(center).normalize();
    const right = up.normalize().cross(forward).normalize();
    const cameraUp = forward.cross(right);

    return new Mat4([
      right.x, cameraUp.x, forward.x, 0,
      right.y, cameraUp.y, forward.y, 0,
      right.z, cameraUp.z, forward.z, 0,
      -right.dot(eye), -cameraUp.dot(eye), -forward.dot(eye), 1,
    ]);
  }
}
