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

    this.joints = {
      torso,
      head,
      leftShoulder,
      rightShoulder,
      leftHip,
      rightHip,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg
    };

    // Kaleciyi kale çizgisinin tam önüne konumlandırıyoruz (Kale çizgisi Z = -7)
    this.transform.position = new Vec3(0, 0, -6.3);
    this.geometry = null;

    // Hazır duruşunu başlangıçta uygula
    this.setDiveProgress(0, this.transform.position, this.transform.position);
  }

  /**
   * Kalecinin dalış ve sıçrama animasyonunu eklemleriyle birlikte gerçekçi şekilde yönetir.
   * @param {number} t - İlerleme oranı (0.0 -> 1.0)
   * @param {Vec3} start - Başlangıç pozisyonu
   * @param {Vec3} target - Hedef pozisyonu
   */
  setDiveProgress(t, start, target) {
    if (t === 0) {
      // Başlangıç/Hazır Duruşu
      this.transform.position.x = start.x;
      this.transform.position.y = 0;
      this.transform.rotation = new Vec3(0, 0, 0);

      // Dizler bükülü, gövde hafif öne eğik, kollar açık hazır bekleyiş duruşu
      this.joints.torso.transform.rotation = new Vec3(0.15, 0, 0);
      this.joints.head.transform.rotation = new Vec3(-0.05, 0, 0);
      this.joints.leftShoulder.transform.rotation = new Vec3(0.1, 0, 0.35);
      this.joints.rightShoulder.transform.rotation = new Vec3(0.1, 0, -0.35);
      this.joints.leftHip.transform.rotation = new Vec3(-0.25, 0, 0);
      this.joints.rightHip.transform.rotation = new Vec3(-0.25, 0, 0);
      return;
    }

    const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);

    // 1. Yatay (X) Hareket (Gideceği noktaya kavisli hızlı ivmelenme)
    const tX = easeOutQuad(t);
    const x = start.x + (target.x - start.x) * tX;

    // 2. Dikey (Y) Zıplama - Çömelme ve ardından Parabolik Sıçrama (Fizik tabanlı)
    let y = 0;
    const crouchDuration = 0.15; // İlk %15 çömelme süresi
    if (t < crouchDuration) {
      const cp = t / crouchDuration;
      y = -0.32 * Math.sin(cp * Math.PI); // Hafif yaylanıp çömelme payı

      // Çömelirken eklemlerin bükülmesi
      this.joints.torso.transform.rotation = new Vec3(0.15 + 0.22 * cp, 0, 0);
      this.joints.head.transform.rotation = new Vec3(-0.05 - 0.03 * cp, 0, 0);
      this.joints.leftHip.transform.rotation = new Vec3(-0.25 - 0.3 * cp, 0, 0);
      this.joints.rightHip.transform.rotation = new Vec3(-0.25 - 0.3 * cp, 0, 0);
      this.joints.leftShoulder.transform.rotation = new Vec3(0.1, 0, 0.35 + 0.18 * cp);
      this.joints.rightShoulder.transform.rotation = new Vec3(0.1, 0, -0.35 - 0.18 * cp);
      
      this.transform.rotation = new Vec3(0, 0, 0);
    } else {
      const lp = (t - crouchDuration) / (1 - crouchDuration); // Sıçrama/Uçuş süreci (0.0 -> 1.0)
      
      // Zıplama yüksekliği interpolasyonu + Yerçekimine karşı yukarı uçuş yayı
      const baseHeight = 0 + (target.y - 0) * lp;
      const jumpArc = Math.sin(lp * Math.PI) * 0.9; // Havaya sıçrama yayı
      y = baseHeight + jumpArc;

      // Kalecinin tüm gövdesini dalış açısına göre döndür
      const direction = target.x - start.x; // < 0 sola dalış, > 0 sağa dalış
      const diveAngle = direction * 0.45; // Dalış yatış açısı derecesi
      this.transform.rotation = new Vec3(0, 0, -diveAngle * lp);

      // FIX (Issue 3): Gövde dalış yönünde hafif döner; Y ekseninde 0.15 * lp ile sınırlı
      this.joints.torso.transform.rotation = new Vec3(0.1 * lp, direction * 0.12 * lp, 0);
      this.joints.head.transform.rotation = new Vec3(0, 0, 0);

      // FIX (Issue 3): Eklemlerin dalış yönüne göre gerilmesi (Anatomik uçuş pozu)
      // Omuz ekseninde:
      //   - Z dönüşü: Kolun vücuttan yanlara açılması (adduction/abduction)
      //   - X dönüşü: Kolun öne/arkaya uzanması (flexion/extension) - dalış uzanması için ÖNEMLİ
      if (direction < -0.2) {
        // SOLA DALIŞ — Sol kollar ileri ve yukarı uzanır, sağ kol denge için hafifçe açılır
        // Sol omuz: vücuttan yukarı ve sola kaldır (Z), dalış yönünde hafif öne (X)
        this.joints.leftShoulder.transform.rotation = new Vec3(
          -Math.PI * 0.20 * lp,          // X: dalış yönünde hafif öne eğim
           0,
           Math.PI * 0.55 * lp            // Z: sol kolu yukarı ve sola kaldır
        );
        // Sağ omuz: denge için karşı tarafta orta açı, doğal poz
        this.joints.rightShoulder.transform.rotation = new Vec3(
           Math.PI * 0.10 * lp,           // X: hafif geriye (denge)
           0,
          -Math.PI * 0.30 * lp            // Z: sağ kolu vücuttan hafifçe aç
        );

        // Bacak pozu: Sol bacak (yere yakın) hafif bükülerek destek sağlar, sağ bacak uzanır
        this.joints.leftHip.transform.rotation  = new Vec3(-0.15 * lp, 0, -0.25 * lp);
        this.joints.rightHip.transform.rotation = new Vec3(-0.35 * lp, 0, -0.40 * lp);

      } else if (direction > 0.2) {
        // SAĞA DALIŞ — Sağ kol ileri ve yukarı uzanır, sol kol denge için hafifçe açılır
        this.joints.rightShoulder.transform.rotation = new Vec3(
          -Math.PI * 0.20 * lp,           // X: dalış yönünde hafif öne eğim
           0,
          -Math.PI * 0.55 * lp            // Z: sağ kolu yukarı ve sağa kaldır
        );
        this.joints.leftShoulder.transform.rotation = new Vec3(
           Math.PI * 0.10 * lp,           // X: hafif geriye (denge)
           0,
           Math.PI * 0.30 * lp            // Z: sol kolu vücuttan hafifçe aç
        );

        // Bacak pozu: Sağ bacak (yere yakın) hafif bükülerek destek sağlar, sol bacak uzanır
        this.joints.rightHip.transform.rotation = new Vec3(-0.15 * lp, 0,  0.25 * lp);
        this.joints.leftHip.transform.rotation  = new Vec3(-0.35 * lp, 0,  0.40 * lp);

      } else {
        // ORTAYA / DÜZ ZIPLAMA — İki kol simetrik olarak yukarı kalkar
        this.joints.leftShoulder.transform.rotation = new Vec3(
          -Math.PI * 0.30 * lp,           // X: her iki kol ileri ve yukarı uzanır
           0,
           Math.PI * 0.50 * lp            // Z: sol kol sola ayrılır
        );
        this.joints.rightShoulder.transform.rotation = new Vec3(
          -Math.PI * 0.30 * lp,           // X: sağ kol ileri ve yukarı
           0,
          -Math.PI * 0.50 * lp            // Z: sağ kol sağa ayrılır
        );

        this.joints.leftHip.transform.rotation  = new Vec3(-0.20 * lp, 0, -0.15 * lp);
        this.joints.rightHip.transform.rotation = new Vec3(-0.20 * lp, 0,  0.15 * lp);
      }
    }

    this.transform.position.x = x;
    this.transform.position.y = y;
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