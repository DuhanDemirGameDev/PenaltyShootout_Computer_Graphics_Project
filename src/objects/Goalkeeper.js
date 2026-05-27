import { GameObject } from "../core/GameObject.js";
import { Cuboid } from "../geometry/Cuboid.js";
import { Sphere } from "../geometry/Sphere.js";
import { Vec3 } from "../math/Vec3.js";

export class Goalkeeper extends GameObject {
  constructor(gl) {
    super({ name: "Goalkeeper Root" });

    const jerseyMaterial = { color: new Vec3(0.8, 0.1, 0.1) }; // Kırmızı
    const skinMaterial = { color: new Vec3(0.9, 0.75, 0.6) };  // Ten rengi
    const shortsMaterial = { color: new Vec3(0.1, 0.1, 0.1) }; // Siyah şort/tayt

    //Gövde 
    const torso = new GameObject({
      name: "Torso",
      geometry: new Cuboid(gl, 0.8, 1.2, 0.4),
      material: jerseyMaterial,
    });
    torso.transform.position = new Vec3(0, 1.5, 0);

    //Kafa
    const head = new GameObject({
      name: "Head",
      geometry: new Sphere(gl, 0.25, 16, 16),
      material: skinMaterial,
    });
    head.transform.position = new Vec3(0, 0.8, 0);

    //Kollar
    const leftArm = new GameObject({
      name: "Left Arm",
      geometry: new Cuboid(gl, 0.25, 1.0, 0.25),
      material: skinMaterial,
    });
    leftArm.transform.position = new Vec3(-0.55, 0.0, 0); // Gövdenin solunda

    const rightArm = new GameObject({
      name: "Right Arm",
      geometry: new Cuboid(gl, 0.25, 1.0, 0.25),
      material: skinMaterial,
    });
    rightArm.transform.position = new Vec3(0.55, 0.0, 0); // Gövdenin sağında

    //Bacaklar
    const leftLeg = new GameObject({
      name: "Left Leg",
      geometry: new Cuboid(gl, 0.3, 1.2, 0.3),
      material: shortsMaterial,
    });
    leftLeg.transform.position = new Vec3(-0.25, -1.2, 0); // Gövdenin altında solda

    const rightLeg = new GameObject({
      name: "Right Leg",
      geometry: new Cuboid(gl, 0.3, 1.2, 0.3),
      material: shortsMaterial,
    });
    rightLeg.transform.position = new Vec3(0.25, -1.2, 0); // Gövdenin altında sağda

    // HİYERARŞİ BAĞLANTILARI
    this.transform.addChild(torso.transform); // Gövde -> Root'a
    
    // Her şey gövdeye bağlandı
    torso.transform.addChild(head.transform); 
    torso.transform.addChild(leftArm.transform);
    torso.transform.addChild(rightArm.transform);
    torso.transform.addChild(leftLeg.transform);
    torso.transform.addChild(rightLeg.transform);

    this.childrenObjects = [torso, head, leftArm, rightArm, leftLeg, rightLeg];
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