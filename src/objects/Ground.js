import { GameObject } from "../core/GameObject.js";
import { Plane } from "../geometry/Plane.js";
import { Vec3 } from "../math/Vec3.js";
import { TextureLoader } from "../utils/TextureLoader.js";
import { Cuboid } from "../geometry/Cuboid.js";

export class Ground extends GameObject {
  constructor(gl) {
    super({ name: "Ground Root" });

    this.childrenObjects = [];

    //Kaplamayı zemin objesi kendi içinde yüklüyor
    const textureLoader = new TextureLoader(gl);
    const grassTexture = textureLoader.loadTexture("assets/textures/grass.jpg");

    const grass = new GameObject({
      name: "Grass Plane",
      geometry: new Plane(gl, 20, 20, 1),
      material: { color: new Vec3(1, 1, 1), texture: grassTexture, useTexture: true }
    });
    this.transform.addChild(grass.transform);
    this.childrenObjects.push(grass);

    const lineMat = { color: new Vec3(1, 1, 1), useTexture: false };
    const lineY = 0.01;
    const t = 0.15;

    const boxFront = new GameObject({ name: "Box Front", geometry: new Cuboid(gl, 10, 0.02, t), material: lineMat });
    boxFront.transform.position = new Vec3(0, lineY, -1);

    const boxLeft = new GameObject({ name: "Box Left", geometry: new Cuboid(gl, t, 0.02, 6), material: lineMat });
    boxLeft.transform.position = new Vec3(-5, lineY, -4);

    const boxRight = new GameObject({ name: "Box Right", geometry: new Cuboid(gl, t, 0.02, 6), material: lineMat });
    boxRight.transform.position = new Vec3(5, lineY, -4);

    const smallFront = new GameObject({ name: "Small Box Front", geometry: new Cuboid(gl, 6, 0.02, t), material: lineMat });
    smallFront.transform.position = new Vec3(0, lineY, -4);

    const smallLeft = new GameObject({ name: "Small Box Left", geometry: new Cuboid(gl, t, 0.02, 3), material: lineMat });
    smallLeft.transform.position = new Vec3(-3, lineY, -5.5);

    const smallRight = new GameObject({ name: "Small Box Right", geometry: new Cuboid(gl, t, 0.02, 3), material: lineMat });
    smallRight.transform.position = new Vec3(3, lineY, -5.5);

    const penaltySpot = new GameObject({ name: "Penalty Spot", geometry: new Cuboid(gl, 0.4, 0.02, 0.4), material: lineMat });
    penaltySpot.transform.position = new Vec3(0, lineY, -2.5);

    const lines = [boxFront, boxLeft, boxRight, smallFront, smallLeft, smallRight, penaltySpot];
    for (const line of lines) {
      this.transform.addChild(line.transform);
      this.childrenObjects.push(line);
    }

    this.geometry = null;
  }

  render(gl, shaderProgram, camera) {
    if (!this.visible) return null;
    this.transform.updateWorldMatrix();
    for (const child of this.childrenObjects) {
      child.render(gl, shaderProgram, camera);
    }
    return this.transform.worldMatrix;
  }
}
