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

    const frameMat = { color: new Vec3(0.85, 0.85, 0.85), useTexture: false };
    const screenGazi = { color: new Vec3(1.15, 1.15, 1.15), texture: gaziTex, useTexture: true };
    const screenAcm = { color: new Vec3(1.15, 1.15, 1.15), texture: acmTex, useTexture: true };
    const screenAyaz = { color: new Vec3(1.15, 1.15, 1.15), texture: ayazTex, useTexture: true };

    const boardLength = 6.66;
    const boardHeight = 1.0;
    const boardThickness = 0.2;
    const halfWidth = 10.0;

    this.childrenObjects = [];

    const createAdPanel = (name, xOffset, screenMat) => {
      const panelRoot = new GameObject({ name });

      const frame = new GameObject({
        name: `${name} Frame`,
        geometry: new Cuboid(gl, boardLength, boardHeight, boardThickness),
        material: frameMat
      });

      const screen = new GameObject({
        name: `${name} Screen`,
        geometry: new Cuboid(gl, boardLength, boardHeight, 0.02),
        material: screenMat
      });
      screen.transform.position = new Vec3(0, 0, (boardThickness / 2) + 0.01);

      panelRoot.transform.addChild(frame.transform);
      panelRoot.transform.addChild(screen.transform);
      panelRoot.transform.position = new Vec3(xOffset, boardHeight / 2, 0);

      this.childrenObjects.push(frame, screen);
      return panelRoot;
    };

    const createSideBoards = (namePrefix, posX, posZ, rotationY) => {
      const parent = new GameObject({ name: `${namePrefix} Boards Parent` });

      parent.transform.addChild(createAdPanel(`${namePrefix} P1`, -6.66, screenGazi).transform);
      parent.transform.addChild(createAdPanel(`${namePrefix} P2`, 0, screenAcm).transform);
      parent.transform.addChild(createAdPanel(`${namePrefix} P3`, 6.66, screenAyaz).transform);

      parent.transform.position = new Vec3(posX, 0, posZ);
      parent.transform.rotation.y = rotationY;

      return parent;
    };

    this.transform.addChild(createSideBoards("Left", -halfWidth, 0, Math.PI / 2).transform);
    this.transform.addChild(createSideBoards("Right", halfWidth, 0, -Math.PI / 2).transform);
    this.transform.addChild(createSideBoards("Back", 0, -halfWidth, 0).transform);
    this.transform.addChild(createSideBoards("Front", 0, halfWidth, Math.PI).transform);

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
