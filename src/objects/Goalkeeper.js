import { GameObject } from "../core/GameObject.js";
import { Cuboid } from "../geometry/Cuboid.js";
import { Sphere } from "../geometry/Sphere.js";
import { Vec3 } from "../math/Vec3.js";

export class Goalkeeper extends GameObject {
  constructor(gl) {
    super({ name: "Goalkeeper Root" });

    const jerseyMaterial = { color: new Vec3(0.1, 0.2, 0.8) }; // Gece Mavisi forma
    const skinMaterial = { color: new Vec3(0.9, 0.75, 0.6) };  // Ten rengi
    const shortsMaterial = { color: new Vec3(0.1, 0.1, 0.1) }; // Siyah şort
    const gloveMaterial = { color: new Vec3(0.2, 0.2, 0.2) }; // Gri eldivenler
    const shoeMaterial = { color: new Vec3(0.8, 0.9, 0.1) };   // Fosforlu sarı kramponlar

    const torsoW = 0.75, torsoH = 0.9, torsoD = 0.3; // Gövde 
    const legW = 0.28, legH = 0.95, legD = 0.25;     // Bacaklar 
    const armW = 0.20, armH = 1.0, armD = 0.20;      // Kollar
    const headRadius = 0.23;

    // Ayak tabanının tam y = 0 çizgisine oturması için gereken gövde yüksekliği
    const calculatedTorsoY = legH + (torsoH / 2) + 0.15;

    //Gövde 
    const torso = new GameObject({
      name: "Torso",
      geometry: new Cuboid(gl, torsoW, torsoH, torsoD),
      material: jerseyMaterial,
    });
    torso.transform.position = new Vec3(0, calculatedTorsoY, 0);

    //Kafa
    const head = new GameObject({
      name: "Head",
      geometry: new Sphere(gl, headRadius, 16, 16),
      material: skinMaterial,
    });
    head.transform.position = new Vec3(0, (torsoH / 2) + headRadius, 0);

    //SOL KOL HİYERARŞİSİ (Omuz -> Kol -> Eldiven)
    const leftShoulder = new GameObject({ name: "Left Shoulder" });
    leftShoulder.transform.position = new Vec3(-(torsoW / 2 + armW / 2) - 0.01, (torsoH / 2) - 0.1, 0);

    const leftArm = new GameObject({
      name: "Left Arm", geometry: new Cuboid(gl, armW, armH, armD), material: skinMaterial,
    });
    leftArm.transform.position = new Vec3(0, -(armH / 2), 0); // Kolu omuzdan aşağı sarkıt
    
    const leftGlove = new GameObject({
      name: "Left Glove", geometry: new Cuboid(gl, armW + 0.06, 0.25, armD + 0.06), material: gloveMaterial,
    });
    leftGlove.transform.position = new Vec3(0, -(armH / 2 + 0.125), 0);

    // Sol kol bağlamaları
    leftShoulder.transform.addChild(leftArm.transform);
    leftArm.transform.addChild(leftGlove.transform);


    //SAĞ KOL HİYERARŞİSİ (Omuz -> Kol -> Eldiven)
    const rightShoulder = new GameObject({ name: "Right Shoulder" });
    rightShoulder.transform.position = new Vec3((torsoW / 2 + armW / 2) + 0.01, (torsoH / 2) - 0.1, 0);

    const rightArm = new GameObject({
      name: "Right Arm", geometry: new Cuboid(gl, armW, armH, armD), material: skinMaterial,
    });
    rightArm.transform.position = new Vec3(0, -(armH / 2), 0);

    const rightGlove = new GameObject({
      name: "Right Glove", geometry: new Cuboid(gl, armW + 0.06, 0.25, armD + 0.06), material: gloveMaterial,
    });
    rightGlove.transform.position = new Vec3(0, -(armH / 2 + 0.125), 0);

    // Sağ kol bağlamaları
    rightShoulder.transform.addChild(rightArm.transform);
    rightArm.transform.addChild(rightGlove.transform);


    //SOL BACAK HİYERARŞİSİ (Kalça -> Bacak -> Krampon)
    const leftHip = new GameObject({ name: "Left Hip" });
    leftHip.transform.position = new Vec3(-0.18, -(torsoH / 2), 0);

    const leftLeg = new GameObject({
      name: "Left Leg", geometry: new Cuboid(gl, legW, legH, legD), material: shortsMaterial,
    });
    leftLeg.transform.position = new Vec3(0, -(legH / 2), 0);

    const leftShoe = new GameObject({
      name: "Left Shoe", geometry: new Cuboid(gl, legW + 0.02, 0.15, legD + 0.1), material: shoeMaterial,
    });
    leftShoe.transform.position = new Vec3(0, -(legH / 2 + 0.075), 0.05);

    // Sol bacak bağlamaları
    leftHip.transform.addChild(leftLeg.transform);
    leftLeg.transform.addChild(leftShoe.transform);


    //SAĞ BACAK HİYERARŞİSİ (Kalça -> Bacak -> Krampon)
    const rightHip = new GameObject({ name: "Right Hip" });
    rightHip.transform.position = new Vec3(0.18, -(torsoH / 2), 0);

    const rightLeg = new GameObject({
      name: "Right Leg", geometry: new Cuboid(gl, legW, legH, legD), material: shortsMaterial,
    });
    rightLeg.transform.position = new Vec3(0, -(legH / 2), 0);

    const rightShoe = new GameObject({
      name: "Right Shoe", geometry: new Cuboid(gl, legW + 0.02, 0.15, legD + 0.1), material: shoeMaterial,
    });
    rightShoe.transform.position = new Vec3(0, -(legH / 2 + 0.075), 0.05);

    // Sağ bacak bağlamaları
    rightHip.transform.addChild(rightLeg.transform);
    rightLeg.transform.addChild(rightShoe.transform);

    // ANA HİYERARŞİ (Gövdeye Eklem Bağlantıları)
    this.transform.addChild(torso.transform);
    torso.transform.addChild(head.transform);
    torso.transform.addChild(leftShoulder.transform);  
    torso.transform.addChild(rightShoulder.transform);
    torso.transform.addChild(leftHip.transform); 
    torso.transform.addChild(rightHip.transform);

    /*
    // === FAZ 2.12: HİYERARŞİ GÖSTERİM POZU ===
    // Dönüş komutlarını artık geometriye değil, eklere (Joints) veriyoruz!
    leftShoulder.transform.rotation.z = Math.PI * 0.75; // Sol kol omuzdan mükemmel kalkar
    rightHip.transform.rotation.x = -Math.PI * 0.25;    // Sağ bacak kalçadan mükemmel kalkar
    torso.transform.rotation.x = 0.1;
    */

    // Render listesi
    this.childrenObjects = [torso, head, leftArm, leftGlove, rightArm, rightGlove, leftLeg, leftShoe, rightLeg, rightShoe];
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