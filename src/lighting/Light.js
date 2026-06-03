import { Vec3 } from "../math/Vec3.js";

/**
 * Basic point-light data model used by the scene lighting shader.
 */
export class Light {
  constructor({
    position = new Vec3(0, 10, 0),
    color = new Vec3(1, 1, 1),
    intensity = 1.5,
  } = {}) {
    this.position = position;
    this.color = color;
    this.intensity = intensity;
    this.enabled = true;
  }

  /**
   * Uploads this light into the shader's light array.
   *
   * @param {ShaderProgram} shader - Active shader program.
   * @param {number} index - Light array index.
   */
  setUniforms(shader, index) {
    shader.setVec3(`uLightPos[${index}]`, this.position);
    
    // Disabled lights are represented as black contributors in the shader.
    const finalColor = this.enabled ? this.color : new Vec3(0, 0, 0);
    shader.setVec3(`uLightColor[${index}]`, finalColor);
  }
}
