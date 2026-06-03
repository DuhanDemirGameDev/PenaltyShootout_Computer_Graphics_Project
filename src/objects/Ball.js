import { GameObject } from "../core/GameObject.js";
import { Sphere } from "../geometry/Sphere.js";
import { Vec3 } from "../math/Vec3.js";
import { TextureLoader } from "../utils/TextureLoader.js";

export class Ball extends GameObject {
  constructor(gl) {
    super({ name: "Ball" });

    const textureLoader = new TextureLoader(gl);
    const ballTexture = textureLoader.loadTexture("assets/textures/football.jpg");

    const ballRadius = 0.3;
    this.geometry = new Sphere(gl, ballRadius,64, 64);
    this.transform.rotation.x = Math.PI * 0.75;
    
    this.material = {
      color: new Vec3(1, 1, 1),
      texture: ballTexture,
      useTexture: true
    };

    // The sphere origin is at its center, so the radius lifts it exactly onto the pitch.
    this.transform.position = new Vec3(0, ballRadius, 0);

  }
}
