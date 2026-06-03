import { Transform } from "../math/Transform.js";
import { Vec3 } from "../math/Vec3.js";

/**
 * Base renderable entity used by both primitive meshes and composite objects.
 */
export class GameObject {
  constructor({ name = "GameObject", geometry = null, material = null } = {}) {
    this.name = name;
    this.transform = new Transform();

    this.geometry = geometry;
    this.material = {
      color: new Vec3(1, 1, 1),
      ...material,
    };
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
      shaderProgram.setVec3("uColor", this.material.color);

      if (this.material.useTexture && this.material.texture) {
        shaderProgram.setBool("uUseTexture", true);
        shaderProgram.setTexture("uTexture", this.material.texture, 0);
      } else {
        shaderProgram.setBool("uUseTexture", false);
      }

      this.geometry.draw(shaderProgram);
    }

    return this.transform.worldMatrix;
  }
}
