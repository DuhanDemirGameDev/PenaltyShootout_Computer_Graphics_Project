import { GameObject } from "../core/GameObject.js";
import { Cylinder } from "../geometry/Cylinder.js";
import { Cuboid } from "../geometry/Cuboid.js";
import { Vec3 } from "../math/Vec3.js";

class SingleLightTower extends GameObject {
  constructor(gl, x, z, rotY) {
    super({ name: "Light Tower" });
    const poleHeight = 8.0;
    const metalMat = { color: new Vec3(0.2, 0.2, 0.2) };
    const lightMat = { color: new Vec3(1.0, 1.0, 0.9) }; 

    const pole = new GameObject({ geometry: new Cylinder(gl, 0.15, poleHeight, 16), material: metalMat });
    pole.transform.position = new Vec3(0, poleHeight / 2, 0);

    const supportArm = new GameObject({ geometry: new Cuboid(gl, 1.0, 0.2, 0.2), material: metalMat });
    supportArm.transform.position = new Vec3(0, poleHeight, 0.2);

    const lightPanel = new GameObject({ geometry: new Cuboid(gl, 2.5, 1.0, 0.2), material: lightMat });
    lightPanel.transform.position = new Vec3(0, poleHeight, 0.5);
    lightPanel.transform.rotation.x = -Math.PI / 6; 

    this.transform.addChild(pole.transform);
    this.transform.addChild(supportArm.transform);
    this.transform.addChild(lightPanel.transform);

    // Kuleyi sahaya yerleştir
    this.transform.position = new Vec3(x, 0, z);
    this.transform.rotation.y = rotY;

    this.childrenObjects = [pole, supportArm, lightPanel];
    this.geometry = null;
  }
  
  render(gl, shaderProgram, camera) {
    if (!this.visible) return null;
    this.transform.updateWorldMatrix();
    for (const child of this.childrenObjects) child.render(gl, shaderProgram, camera);
    return this.transform.worldMatrix;
  }
}

export class StadiumLights extends GameObject {
  constructor(gl) {
    super({ name: "All Stadium Lights Root" });
    
    // 4 Kuleyi oluşturup köke bağlıyoruz
    const farLeft = new SingleLightTower(gl, -9, -9, Math.PI * 0.25);
    const farRight = new SingleLightTower(gl, 9, -9, -Math.PI * 0.25);
    const nearLeft = new SingleLightTower(gl, -9, 7, Math.PI * 0.75);
    const nearRight = new SingleLightTower(gl, 9, 7, -Math.PI * 0.75);

    this.transform.addChild(farLeft.transform);
    this.transform.addChild(farRight.transform);
    this.transform.addChild(nearLeft.transform);
    this.transform.addChild(nearRight.transform);

    this.childrenObjects = [farLeft, farRight, nearLeft, nearRight];
    this.geometry = null;
  }

  render(gl, shaderProgram, camera) {
    if (!this.visible) return null;
    this.transform.updateWorldMatrix();
    for (const child of this.childrenObjects) child.render(gl, shaderProgram, camera);
    return this.transform.worldMatrix;
  }
}