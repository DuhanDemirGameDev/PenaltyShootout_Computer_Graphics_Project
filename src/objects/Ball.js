import { GameObject } from "../core/GameObject.js";
import { Sphere } from "../geometry/Sphere.js";
import { Vec3 } from "../math/Vec3.js";

export class Ball extends GameObject {
  constructor(gl, ballTexture) {
    super({
      name: "Ball",
      geometry: new Sphere(gl, 0.5, 32, 16), // Yarıçapı 0.5 olan küre
      material: { 
        color: new Vec3(0.95, 0.95, 0.9), // Kaplama yüklenmezse kullanılacak renk
        texture: ballTexture,             // Yüklenen futbol topu dokusu
        useTexture: true                  // Shader'a dokuyu kullanmasını söylüyoruz
      },
    });

    // Topu zeminin biraz üstüne ve penaltı noktasına yerleştiriyoruz
    this.transform.position = new Vec3(0, 0.5, 3);
  }
}