import { GameObject } from "../core/GameObject.js";
import { Cylinder } from "../geometry/Cylinder.js";
import { Cuboid } from "../geometry/Cuboid.js";
import { Vec3 } from "../math/Vec3.js";

export class StadiumLight extends GameObject {
  constructor(gl) {
    super({ name: "Stadium Light Root" });

    // Ölçüler
    const poleHeight = 8.0;
    const poleRadius = 0.15;
    const panelWidth = 2.5;
    const panelHeight = 1.0;
    const panelDepth = 0.2;

    // Materyaller (Koyu metal ve parlak açık sarı ışık)
    const metalMaterial = { color: new Vec3(0.2, 0.2, 0.2) };
    const lightMaterial = { color: new Vec3(1.0, 1.0, 0.9) }; 

    // 1. Ana Direk (Cylinder)
    const pole = new GameObject({
      name: "Pole",
      geometry: new Cylinder(gl, poleRadius, poleHeight, 16),
      material: metalMaterial,
    });
    // Direği yukarı kaydır (silindirlerin merkezi ortada olduğu için boyunun yarısı kadar)
    pole.transform.position = new Vec3(0, poleHeight / 2, 0);

    // 2. Destek Kolu (Cuboid)
    const supportArm = new GameObject({
      name: "Support Arm",
      geometry: new Cuboid(gl, 1.0, 0.2, 0.2),
      material: metalMaterial,
    });
    // Direğin en tepesine ve biraz öne yerleştir
    supportArm.transform.position = new Vec3(0, poleHeight, 0.2);

    // 3. Işık Paneli (Cuboid)
    const lightPanel = new GameObject({
      name: "Light Panel",
      geometry: new Cuboid(gl, panelWidth, panelHeight, panelDepth),
      material: lightMaterial,
    });
    // Paneli destek kolunun önüne koy ve sahaya bakması için X ekseninde aşağı doğru eğ (-30 derece)
    lightPanel.transform.position = new Vec3(0, poleHeight, 0.5);
    lightPanel.transform.rotation.x = -Math.PI / 6; 

    // Hiyerarşiyi Kurma
    this.transform.addChild(pole.transform);
    this.transform.addChild(supportArm.transform);
    this.transform.addChild(lightPanel.transform);

    this.childrenObjects = [pole, supportArm, lightPanel];
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