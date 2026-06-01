import { GameObject } from "../core/GameObject.js";
import { Cylinder } from "../geometry/Cylinder.js";
import { Plane } from "../geometry/Plane.js";
import { Vec3 } from "../math/Vec3.js";
import { TextureLoader } from "../utils/TextureLoader.js";

export class GoalPost extends GameObject {
  constructor(gl) {
    // Ana (Kök) Obje: Kalenin merkez noktası
    super({ name: "GoalPost Root" });
    
    // Kale boyutları
    const postRadius = 0.1;
    const postHeight = 3.0;
    const crossbarWidth = 7.32; // Standart FIFA kale genişliği
    const netDepth = 2.0;       // Kalenin arkaya doğru olan derinliği
    
    // Direklerin rengi
    const postMaterial = { color: new Vec3(0.9, 0.9, 0.9) };

    const textureLoader = new TextureLoader(gl);
    const netTexture = textureLoader.loadTexture("assets/textures/net.png");
    // Ağ materyali ayarları
    const netMaterial = {
      color: new Vec3(1, 1, 1),
      texture: netTexture,
      useTexture: true
    };

    //Sol Direk
    const leftPost = new GameObject({
      name: "Left Post",
      geometry: new Cylinder(gl, postRadius, postHeight, 24),
      material: postMaterial,
    });
    // Kök noktaya göre sola ve yukarıya kaydır
    leftPost.transform.position = new Vec3(-crossbarWidth / 2, postHeight / 2, 0);

    //Sağ Direk
    const rightPost = new GameObject({
      name: "Right Post",
      geometry: new Cylinder(gl, postRadius, postHeight, 24),
      material: postMaterial,
    });
    // Kök noktaya göre sağa ve yukarıya kaydır
    rightPost.transform.position = new Vec3(crossbarWidth / 2, postHeight / 2, 0);

    //Üst Direk 
    const crossbar = new GameObject({
      name: "Crossbar",
      // Üst direk için silindiri yan yatırmamız gerekecek, o yüzden boyunu genişlik yapıyoruz
      geometry: new Cylinder(gl, postRadius, crossbarWidth + (postRadius * 2), 24),
      material: postMaterial,
    });
    // Üste taşı ve Z ekseninde 90 derece döndür (Math.PI / 2 radyan)
    crossbar.transform.position = new Vec3(0, postHeight, 0);
    crossbar.transform.rotation.z = Math.PI / 2;

    //Arka Ağ
    const backNet = new GameObject({
      name: "Back Net",
      geometry: new Plane(gl, crossbarWidth, postHeight, 1),
      material: netMaterial,
    });

    // Kalenin 2 birim arkasına götür, yerden yükselt ve dik durması için X ekseninde 90 derece döndür
    backNet.transform.position = new Vec3(0, postHeight / 2, -netDepth);
    backNet.transform.rotation.x = Math.PI / 2;

    //Sol Yan Ağ
    const leftNet = new GameObject({
      name: "Left Net",
      geometry: new Plane(gl, netDepth, postHeight, 1),
      material: netMaterial,
    });
    // Sola kaydır, arkaya doğru uzat ve dik durması için Z ekseninde 90 derece döndür
    leftNet.transform.position = new Vec3(-crossbarWidth / 2, postHeight / 2, -netDepth / 2);
    leftNet.transform.rotation.x = Math.PI / 2;
    leftNet.transform.rotation.y = Math.PI / 2;

    //Sağ Yan Ağ
    const rightNet = new GameObject({
      name: "Right Net",
      geometry: new Plane(gl, netDepth, postHeight, 1),
      material: netMaterial,
    });
    // Sağa kaydır, arkaya doğru uzat ve dik durması için Z ekseninde 90 derece döndür
    rightNet.transform.position = new Vec3(crossbarWidth / 2, postHeight / 2, -netDepth / 2);
    rightNet.transform.rotation.x = Math.PI / 2;
    rightNet.transform.rotation.y = -Math.PI / 2;

    const topNet = new GameObject({
      name: "Top Net",
      geometry: new Plane(gl, crossbarWidth, netDepth, 1), // Genişlik x Derinlik
      material: netMaterial,
    });
    // Yukarı kaldır ve arkaya doğru ortala
    topNet.transform.position = new Vec3(0, postHeight, -netDepth / 2);

    //Hiyerarşiye Tüm Parçaları Ekleme
    this.transform.addChild(leftPost.transform);
    this.transform.addChild(rightPost.transform);
    this.transform.addChild(crossbar.transform);
    this.transform.addChild(backNet.transform);
    this.transform.addChild(leftNet.transform);
    this.transform.addChild(rightNet.transform);
    this.transform.addChild(topNet.transform);

    // Render motorumuzun bu alt objeleri çizebilmesi için onları bir listeye ekleyelim - manuel hiyerarşi kurduğumuz için ekliyoruz
    this.childrenObjects = [leftPost, rightPost, crossbar, backNet, leftNet, rightNet, topNet];

    this.transform.position = new Vec3(0, 0, -7);
    // Kök objenin kendi geometrisi yoktur -sadece çocuklarını taşıyor-
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