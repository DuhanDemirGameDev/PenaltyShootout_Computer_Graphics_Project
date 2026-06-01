import { GameObject } from "../core/GameObject.js";
import { Cuboid } from "../geometry/Cuboid.js";
import { Vec3 } from "../math/Vec3.js";
// import { TextureLoader } from "../utils/TextureLoader.js"; // Şimdilik yoruma aldık

export class AdBoards extends GameObject {
  constructor(gl) {
    super({ name: "AdBoards Root" });

    // İLERİDE RESİM EKLEMEK İSTEDİĞİNDE ŞU 2 SATIRI AÇABİLİRSİN:
    // const textureLoader = new TextureLoader(gl);
    // const adTexture = textureLoader.loadTexture("assets/textures/adboard.jpg");

    const adMaterial = {
      color: new Vec3(0.9, 0.9, 0.9), // Şimdilik boş açık gri/beyaz bir pano
      // texture: adTexture,          // İleride resmi açtığında buradaki "//" işaretini sil
      useTexture: false               // İleride resim eklediğinde burayı "true" yap
    };

    const boardLength = 18.0; 
    const boardHeight = 1.0;  
    const boardThickness = 0.2;

    // 1. SOL PANO
    const leftBoard = new GameObject({
      name: "Left AdBoard",
      geometry: new Cuboid(gl, boardLength, boardHeight, boardThickness),
      material: adMaterial
    });
    leftBoard.transform.position = new Vec3(-9.5, boardHeight / 2, 0);
    leftBoard.transform.rotation.y = Math.PI / 2; 

    // 2. SAĞ PANO
    const rightBoard = new GameObject({
      name: "Right AdBoard",
      geometry: new Cuboid(gl, boardLength, boardHeight, boardThickness),
      material: adMaterial
    });
    rightBoard.transform.position = new Vec3(9.5, boardHeight / 2, 0);
    rightBoard.transform.rotation.y = -Math.PI / 2;

    // 3. ARKA PANO (Kalenin Arkası)
    const backBoard = new GameObject({
      name: "Back AdBoard",
      geometry: new Cuboid(gl, boardLength + 1, boardHeight, boardThickness),
      material: adMaterial
    });
    backBoard.transform.position = new Vec3(0, boardHeight / 2, -9.5);

    // Panoları köke bağlıyoruz
    this.transform.addChild(leftBoard.transform);
    this.transform.addChild(rightBoard.transform);
    this.transform.addChild(backBoard.transform);

    this.childrenObjects = [leftBoard, rightBoard, backBoard];
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