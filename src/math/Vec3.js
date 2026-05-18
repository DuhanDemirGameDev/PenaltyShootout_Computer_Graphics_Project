export class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(vector) {
    return new Vec3(
      this.x + vector.x,
      this.y + vector.y,
      this.z + vector.z
    );
  }

  subtract(vector) {
    return new Vec3(
      this.x - vector.x,
      this.y - vector.y,
      this.z - vector.z
    );
  }

  multiply(scalar) {
    return new Vec3(
      this.x * scalar,
      this.y * scalar,
      this.z * scalar
    );
  }

  dot(vector) {
    return this.x * vector.x + this.y * vector.y + this.z * vector.z;
  }

  cross(vector) {
    return new Vec3(
      this.y * vector.z - this.z * vector.y,
      this.z * vector.x - this.x * vector.z,
      this.x * vector.y - this.y * vector.x
    );
  }

  length() {
    return Math.hypot(this.x, this.y, this.z);
  }

  normalize() {
    const length = this.length();

    if (length === 0) {
      return new Vec3(0, 0, 0);
    }

    return this.multiply(1 / length);
  }

  toArray() {
    return [this.x, this.y, this.z];
  }

  toString() {
    return `Vec3(${this.x.toFixed(3)}, ${this.y.toFixed(3)}, ${this.z.toFixed(3)})`;
  }

  static fromArray(values) {
    return new Vec3(values[0], values[1], values[2]);
  }
}
