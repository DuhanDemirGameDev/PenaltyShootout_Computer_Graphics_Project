/**
 * Immutable-style three-dimensional vector utility used throughout the simulation.
 */
export class Vec3 {
  /**
   * Creates a three-dimensional vector.
   *
   * @param {number} [x] - X component.
   * @param {number} [y] - Y component.
   * @param {number} [z] - Z component.
   */
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * @param {Vec3} vector - Vector to add.
   * @returns {Vec3} Sum of both vectors.
   */
  add(vector) {
    return new Vec3(
      this.x + vector.x,
      this.y + vector.y,
      this.z + vector.z
    );
  }

  /**
   * @param {Vec3} vector - Vector to subtract.
   * @returns {Vec3} Difference between both vectors.
   */
  subtract(vector) {
    return new Vec3(
      this.x - vector.x,
      this.y - vector.y,
      this.z - vector.z
    );
  }

  /**
   * @param {number} scalar - Scalar multiplier.
   * @returns {Vec3} Scaled vector.
   */
  multiply(scalar) {
    return new Vec3(
      this.x * scalar,
      this.y * scalar,
      this.z * scalar
    );
  }

  /**
   * @param {Vec3} vector - Vector to compare against.
   * @returns {number} Dot product.
   */
  dot(vector) {
    return this.x * vector.x + this.y * vector.y + this.z * vector.z;
  }

  /**
   * @param {Vec3} vector - Vector to compare against.
   * @returns {Vec3} Cross product.
   */
  cross(vector) {
    return new Vec3(
      this.y * vector.z - this.z * vector.y,
      this.z * vector.x - this.x * vector.z,
      this.x * vector.y - this.y * vector.x
    );
  }

  /**
   * @returns {number} Euclidean vector length.
   */
  length() {
    return Math.hypot(this.x, this.y, this.z);
  }

  /**
   * @returns {Vec3} Unit-length vector, or the zero vector when length is zero.
   */
  normalize() {
    const length = this.length();

    if (length === 0) {
      return new Vec3(0, 0, 0);
    }

    return this.multiply(1 / length);
  }

  /**
   * @returns {number[]} Components as an array.
   */
  toArray() {
    return [this.x, this.y, this.z];
  }

  /**
   * @returns {string} Human-readable vector representation for diagnostics.
   */
  toString() {
    return `Vec3(${this.x.toFixed(3)}, ${this.y.toFixed(3)}, ${this.z.toFixed(3)})`;
  }

  /**
   * @param {number[]} values - Array containing x, y, and z components.
   * @returns {Vec3} Vector created from the array values.
   */
  static fromArray(values) {
    return new Vec3(values[0], values[1], values[2]);
  }
}
