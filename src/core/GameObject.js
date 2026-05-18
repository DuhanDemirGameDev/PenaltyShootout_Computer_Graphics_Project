import { Transform } from "../math/Transform.js";

export class GameObject {
  constructor({ name = "GameObject", geometry = null, material = null } = {}) {
    this.name = name;
    this.transform = new Transform();

    // These will be connected in later phases when mesh and material systems exist.
    this.geometry = geometry;
    this.material = material;
    this.visible = true;
  }

  update(deltaTime) {
    // Subclasses can override this for animation, physics, AI, or input behavior.
  }

  render(gl, shaderProgram, camera) {
    if (!this.visible) {
      return null;
    }

    this.transform.updateWorldMatrix();

    if (shaderProgram && this.geometry) {
      shaderProgram.setMat4("uModelMatrix", this.transform.worldMatrix.elements);
      this.geometry.draw(shaderProgram);
    }

    return this.transform.worldMatrix;
  }
}
