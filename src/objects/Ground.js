import { GameObject } from "../core/GameObject.js";
import { Plane } from "../geometry/Plane.js";
import { Vec3 } from "../math/Vec3.js";

export class Ground extends GameObject {
  constructor(gl, grassTexture) {
    super({
      name: "Ground",
      geometry: new Plane(gl, 20, 20, 1),
      material: { 
        color: new Vec3(0.08, 0.45, 0.15), // Doku yüklenene kadar yeşil renk
        texture: grassTexture,             // Yüklenen çim dokusu
        useTexture: true                   // Shader'a doku kullanmasını söylüyoruz
      },
    });

    // Zemini tam merkeze yerleştiriyoruz
    this.transform.position = new Vec3(0, 0, 0);
  }
}