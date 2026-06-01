import { GameObject } from "../core/GameObject.js";
import { Cuboid } from "../geometry/Cuboid.js";
import { Vec3 } from "../math/Vec3.js";
import { TextureLoader } from "../utils/TextureLoader.js";

export class AdBoards extends GameObject {
  constructor(gl) {
    super({ name: "AdBoards Root" });

    const textureLoader = new TextureLoader(gl);
    const gaziTex = textureLoader.loadTexture("assets/textures/gazi.png");
    const acmTex = textureLoader.loadTexture("assets/textures/acm_gazi.png");
    const ayazTex = textureLoader.loadTexture("assets/textures/ayazjam.png");

    // 1. KASA RENGİ: Ferah açık gri (Siyahın o daraltıcı havasından kurtulduk)
    const frameMat = { color: new Vec3(0.85, 0.85, 0.85), useTexture: false };

    // 2. PARLAKLIK DÜZELTİLDİ: 1.0 karanlık, 1.2 çok parlaktı. Altın oran: 1.15
    const screenGazi = { color: new Vec3(1.15, 1.15, 1.15), texture: gaziTex, useTexture: true };
    const screenAcm = { color: new Vec3(1.15, 1.15, 1.15), texture: acmTex, useTexture: true };
    const screenAyaz = { color: new Vec3(1.15, 1.15, 1.15), texture: ayazTex, useTexture: true };

    const boardLength = 6.66; 
    const boardHeight = 1.0;
    const boardThickness = 0.2;
    const halfWidth = 10.0; 

    this.childrenObjects = [];

    // --- YARDIMCI FONKSİYON ---
    const createAdPanel = (name, xOffset, screenMat) => {
      const panelRoot = new GameObject({ name: name });
      
      const frame = new GameObject({
        name: `${name} Frame`,
        geometry: new Cuboid(gl, boardLength, boardHeight, boardThickness),
        material: frameMat
      });
      
      // 3. EKRAN GEOMETRİSİ: Plane yerine incecik bir Cuboid kullanıyoruz!
      // Bu sayede oyun motoru yazıları otomatik olarak doğru (aynasız) basıyor.
      const screen = new GameObject({
        name: `${name} Screen`,
        geometry: new Cuboid(gl, boardLength, boardHeight, 0.02), // Kağıt inceliğinde ekran
        material: screenMat
      });
      
      // Ekranı kasanın "iç sahaya" bakan tarafına tam yapıştırıyoruz
      screen.transform.position = new Vec3(0, 0, (boardThickness / 2) + 0.01);
      
      // ARTIK ROTASYON KODU YOK! Küp olduğu için otomatik doğru duracak.
      
      panelRoot.transform.addChild(frame.transform);
      panelRoot.transform.addChild(screen.transform);
      panelRoot.transform.position = new Vec3(xOffset, boardHeight / 2, 0);
      
      this.childrenObjects.push(frame, screen);
      return panelRoot;
    };

    // --- KENARLARI OLUŞTURMA ---
    const createSideBoards = (namePrefix, posX, posZ, rotationY) => {
      const parent = new GameObject({ name: `${namePrefix} Boards Parent` });
      
      const p1 = createAdPanel(`${namePrefix} P1`, -6.66, screenGazi);
      const p2 = createAdPanel(`${namePrefix} P2`, 0, screenAcm);
      const p3 = createAdPanel(`${namePrefix} P3`, 6.66, screenAyaz);

      parent.transform.addChild(p1.transform);
      parent.transform.addChild(p2.transform);
      parent.transform.addChild(p3.transform);
      
      parent.transform.position = new Vec3(posX, 0, posZ);
      parent.transform.rotation.y = rotationY;
      
      return parent;
    };

    // Duvarları sahaya yerleştiriyoruz
    const leftBoards = createSideBoards("Left", -halfWidth, 0, Math.PI / 2);
    this.transform.addChild(leftBoards.transform);

    const rightBoards = createSideBoards("Right", halfWidth, 0, -Math.PI / 2);
    this.transform.addChild(rightBoards.transform);

    const backBoards = createSideBoards("Back", 0, -halfWidth, 0);
    this.transform.addChild(backBoards.transform);

    const frontBoards = createSideBoards("Front", 0, halfWidth, Math.PI);
    this.transform.addChild(frontBoards.transform);

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