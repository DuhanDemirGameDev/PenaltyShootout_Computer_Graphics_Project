import { Vec3 } from "../math/Vec3.js";

// ============================================================
// Temel Işık Sınıfı
// Nokta ışığı temsil eder: konum, renk ve yoğunluk.
// ============================================================

export class Light {
  constructor({
    position = new Vec3(0, 10, 0),
    color = new Vec3(1, 1, 1),
    intensity = 1.5,
  } = {}) {
    this.position = position;
    this.color = color;
    this.intensity = intensity;
    this.enabled = true; // Varsayılan olarak ışık açık
  }

  /**
   * Işık uniform'larını shader'a gönderir.
   * @param {ShaderProgram} shader
   * @param {number} index — uLightPos[index] formatı
   */
  setUniforms(shader, index) {
    shader.setVec3(`uLightPos[${index}]`, this.position);
    
    // Işık sönükse shader'a rengi (0, 0, 0) olarak yollayarak aydınlatmasını sıfırlıyoruz
    const finalColor = this.enabled ? this.color : new Vec3(0, 0, 0);
    shader.setVec3(`uLightColor[${index}]`, finalColor);
  }
}
