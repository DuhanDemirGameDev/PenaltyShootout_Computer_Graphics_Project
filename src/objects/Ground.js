import { GameObject } from "../core/GameObject.js";
import { Plane } from "../geometry/Plane.js";
import { Vec3 } from "../math/Vec3.js";
import { TextureLoader } from "../utils/TextureLoader.js";

export class Ground extends GameObject {
  constructor(gl) {
    super({ name: "Ground" });

    //Kaplamayı zemin objesi kendi içinde yüklüyor
    const textureLoader = new TextureLoader(gl);
    const grassTexture = textureLoader.loadTexture("assets/textures/grass.jpg");

    // 20x20 boyutunda çim zemin geometrisi
    this.geometry = new Plane(gl, 20, 20, 1);
    
    this.material = {
      color: new Vec3(1, 1, 1),
      texture: grassTexture,
      useTexture: true
    };

    // Zemini tam merkeze yerleştiriyoruz
    this.transform.position = new Vec3(0, 0, 0);
  }
}