import { Mat4 } from "./Mat4.js";
import { Vec3 } from "./Vec3.js";

/**
 * Stores local transform state and maintains hierarchical world matrices.
 */
export class Transform {
  constructor() {
    this.position = new Vec3(0, 0, 0);
    this.rotation = new Vec3(0, 0, 0);
    this.scale = new Vec3(1, 1, 1);

    this.parent = null;
    this.children = [];

    this.localMatrix = Mat4.identity();
    this.worldMatrix = Mat4.identity();
  }

  /**
   * Parents another transform under this transform.
   *
   * @param {Transform} transform - Child transform to attach.
   */
  addChild(transform) {
    if (transform === this) {
      throw new Error("A transform cannot be added as a child of itself.");
    }

    if (this.isDescendantOf(transform)) {
      throw new Error("A transform cannot be parented to one of its own descendants.");
    }

    if (transform.parent) {
      transform.parent.removeChild(transform);
    }

    transform.parent = this;
    this.children.push(transform);
    transform.updateWorldMatrix();
  }

  /**
   * Detaches a child transform from this transform.
   *
   * @param {Transform} transform - Child transform to remove.
   * @returns {boolean} True when the transform was removed.
   */
  removeChild(transform) {
    const childIndex = this.children.indexOf(transform);

    if (childIndex === -1) {
      return false;
    }

    this.children.splice(childIndex, 1);
    transform.parent = null;
    transform.updateWorldMatrix();

    return true;
  }

  /**
   * Determines whether this transform is already below the supplied transform.
   *
   * @param {Transform} transform - Candidate ancestor.
   * @returns {boolean} True when the supplied transform is an ancestor.
   */
  isDescendantOf(transform) {
    let current = this.parent;

    while (current) {
      if (current === transform) {
        return true;
      }

      current = current.parent;
    }

    return false;
  }

  /**
   * Recomputes the local transformation matrix from position, rotation, and scale.
   *
   * @returns {Mat4} Updated local matrix.
   */
  updateLocalMatrix() {
    const translation = Mat4.translation(
      this.position.x,
      this.position.y,
      this.position.z
    );
    const rotationX = Mat4.rotationX(this.rotation.x);
    const rotationY = Mat4.rotationY(this.rotation.y);
    const rotationZ = Mat4.rotationZ(this.rotation.z);
    const scaling = Mat4.scaling(
      this.scale.x,
      this.scale.y,
      this.scale.z
    );

    this.localMatrix = translation
      .multiply(rotationZ)
      .multiply(rotationY)
      .multiply(rotationX)
      .multiply(scaling);

    return this.localMatrix;
  }

  /**
   * Recomputes this transform and all descendants in world space.
   *
   * @returns {Mat4} Updated world matrix.
   */
  updateWorldMatrix() {
    this.updateLocalMatrix();

    this.worldMatrix = this.parent
      ? this.parent.worldMatrix.multiply(this.localMatrix)
      : this.localMatrix;

    for (const child of this.children) {
      child.updateWorldMatrix();
    }

    return this.worldMatrix;
  }
}
