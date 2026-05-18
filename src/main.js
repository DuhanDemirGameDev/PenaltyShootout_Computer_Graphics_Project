import { WebGLApp } from "./core/WebGLApp.js";
import { Camera } from "./core/Camera.js";
import { GameObject } from "./core/GameObject.js";
import { Scene } from "./core/Scene.js";
import { ShaderProgram } from "./core/ShaderProgram.js";
import { Time } from "./core/Time.js";
import { Cylinder } from "./geometry/Cylinder.js";
import { Plane } from "./geometry/Plane.js";
import { Sphere } from "./geometry/Sphere.js";
import { InputManager } from "./interaction/InputManager.js";
import { Vec3 } from "./math/Vec3.js";
import { MousePicker } from "./interaction/MousePicker.js";
import { TargetCrosshair } from "./objects/TargetCrosshair.js"; 

const basicVertexShaderSourceWebGL2 = `#version 300 es
precision highp float;
in vec3 aPosition;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
void main() {
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
`;

// BURADAKİ gl_FragColor HATASINI DÜZELTTİK: Artık doğrudan fragColor'a eşitliyoruz
const basicFragmentShaderSourceWebGL2 = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec3 uColor;
void main() {
  fragColor = vec4(uColor, 1.0); 
}
`;

let mouseReleased = false;
window.addEventListener("mouseup", () => { mouseReleased = true; });

function main() {
  try {
    const app = new WebGLApp("glCanvas");
    const shader = new ShaderProgram(app.gl, basicVertexShaderSourceWebGL2, basicFragmentShaderSourceWebGL2);
    
    const camera = new Camera({
      position: new Vec3(0, 5, 12),
      target: new Vec3(0, 0, 0),
      aspectRatio: app.canvas.width / app.canvas.height,
    });
    const scene = new Scene({ camera });
    const time = new Time();
    const input = new InputManager(app.canvas);

    shader.use();
    app.clear();
    shader.setMat4("uViewMatrix", camera.getViewMatrix().elements);
    shader.setMat4("uProjectionMatrix", camera.getProjectionMatrix().elements);

    // --- SAHNE OBJELERİ ---
    const ground = new GameObject({
      name: "Ground",
      geometry: new Plane(app.gl, 20, 20, 1),
      material: { color: new Vec3(0.08, 0.45, 0.15) },
    });
    scene.add(ground);

    const ball = new GameObject({
      name: "Ball",
      geometry: new Sphere(app.gl, 0.5, 32, 16),
      material: { color: new Vec3(0.95, 0.95, 0.9) },
    });
    ball.transform.position = new Vec3(0, 0.5, 3);
    scene.add(ball);

    // Direkler
    const leftGoalpost = new GameObject({ name: "Left Goalpost", geometry: new Cylinder(app.gl, 0.1, 3, 24), material: { color: new Vec3(0.85, 0.85, 0.82) } });
    leftGoalpost.transform.position = new Vec3(-2.5, 1.5, -7);
    scene.add(leftGoalpost);

    const rightGoalpost = new GameObject({ name: "Right Goalpost", geometry: new Cylinder(app.gl, 0.1, 3, 24), material: { color: new Vec3(0.85, 0.85, 0.82) } });
    rightGoalpost.transform.position = new Vec3(2.5, 1.5, -7);
    scene.add(rightGoalpost);

    // GEÇİCİ KALECİ 
    const goalkeeper = new GameObject({
      name: "Goalkeeper",
      geometry: new Cylinder(app.gl, 0.35, 1.8, 16),
      material: { color: new Vec3(0.1, 0.3, 0.9) }, 
    });
    goalkeeper.transform.position = new Vec3(0, 0.9, -6.5);
    scene.add(goalkeeper);

    // ============================================================
    // === BARIŞ'IN ALANI: DURUM MAKİNESİ VE KALECİ FİZİĞİ ========
    // ============================================================
    let gameState = "READY"; 
    
    let shotProgress = 0.0;          
    let shotDuration = 0.8;        
    let arcHeight = 2.0;           
    let ballStartPosition = null;    
    let ballTargetPosition = null;       

    // Fizik ve Kaleci Değişkenleri
    let sideSpin = 0.0;       
    let verticalSpin = 0.0;   
    let shotPower = 0.0;
    const maxPower = 3.0; 

    // Kaleci Atlayış Değişkenleri
    let gkStartPosition = null;
    let gkTargetPosition = null;

    const animate = (timestamp) => {
      time.update(timestamp);
      camera.updateAspectRatio(app.canvas.width, app.canvas.height);

      let crosshair = scene.objects.find(obj => obj.name === "Crosshair");
      if (!crosshair) {
          crosshair = new TargetCrosshair(app.gl);
          scene.add(crosshair);
      }

      // ------------------------------------------
      // DURUM 1: HAZIRLIK VE NİŞAN ALMA (READY)
      // ------------------------------------------
      if (gameState === "READY") {
          // 1. Kaleci Slider Bağlantısı
          const gkSlider = document.getElementById("goalkeeperX");
          let gkObj = scene.objects.find(obj => obj.name === "Goalkeeper");
          if (gkSlider && gkObj) {
              gkObj.transform.position.x = parseFloat(gkSlider.value);
              gkObj.transform.rotation.z = 0; 
              gkObj.transform.position.y = 0.9;
          }

          // 2. Crosshair Kontrolü (Klavye)
          const moveSpeed = 4.0 * time.deltaTime; 
          if (input.isKeyDown("ArrowLeft")) crosshair.transform.position.x -= moveSpeed;
          if (input.isKeyDown("ArrowRight")) crosshair.transform.position.x += moveSpeed;
          if (input.isKeyDown("ArrowUp")) crosshair.transform.position.y += moveSpeed;
          if (input.isKeyDown("ArrowDown")) crosshair.transform.position.y -= moveSpeed;

          crosshair.transform.position.x = Math.max(-2.4, Math.min(2.4, crosshair.transform.position.x));
          crosshair.transform.position.y = Math.max(0.2, Math.min(2.6, crosshair.transform.position.y));

          // 3. Top Seçimi ve Şarj Başlangıcı
          if (input.wasMouseClicked()) {
              const mouse = input.getMousePosition();
              let ballObject = scene.objects.find(obj => obj.name === "Ball");

              if (ballObject) {
                  const rayDirection = MousePicker.calculateRayDirection(mouse.ndcX, mouse.ndcY, camera.getViewMatrix(), camera.getProjectionMatrix());
                  const hitPoint = MousePicker.getIntersectionPoint(camera.position, rayDirection, ballObject.transform.position, 0.5);

                  if (hitPoint) {
                      const hitOffsetX = hitPoint.x - ballObject.transform.position.x;
                      const hitOffsetY = hitPoint.y - ballObject.transform.position.y;
                      sideSpin = -hitOffsetX * 6.5; 
                      verticalSpin = -hitOffsetY * 3.5; 

                      shotPower = 0.0;
                      mouseReleased = false; 
                      gameState = "CHARGING";
                  }
              }
          }
      }
      
      // ------------------------------------------
      // DURUM 1.5: ŞİDDETİ ŞARJ ETME (CHARGING)
      // ------------------------------------------
      else if (gameState === "CHARGING") {
          shotPower += time.deltaTime * 2.5; 
          if (shotPower > maxPower) shotPower = maxPower;

          if (mouseReleased) {
              let ballObject = scene.objects.find(obj => obj.name === "Ball");
              let gkObj = scene.objects.find(obj => obj.name === "Goalkeeper");

              if (ballObject && gkObj) {
                  ballStartPosition = new Vec3(ballObject.transform.position.x, ballObject.transform.position.y, ballObject.transform.position.z);
                  ballTargetPosition = new Vec3(crosshair.transform.position.x, crosshair.transform.position.y, crosshair.transform.position.z);
                  
                  shotDuration = 1.2 - (shotPower / maxPower) * 0.85; 
                  arcHeight = 1.2 + (shotPower * 0.4);
                  if (verticalSpin < -0.5) arcHeight *= 0.1;

                  // Kaleci hedef belirleme
                  gkStartPosition = new Vec3(gkObj.transform.position.x, gkObj.transform.position.y, gkObj.transform.position.z);
                  const finalFalsoX = ballTargetPosition.x + sideSpin; 
                  gkTargetPosition = new Vec3(
                      Math.max(-2.5, Math.min(2.5, finalFalsoX)), 
                      Math.max(0.5, ballTargetPosition.y * 0.8), 
                      gkStartPosition.z 
                  );

                  shotProgress = 0.0;
                  gameState = "SHOOTING"; 
              }
          }
      }
      
      // ------------------------------------------
      // DURUM 2: ŞUT VE ATLAYIŞ (SHOOTING)
      // ------------------------------------------
      else if (gameState === "SHOOTING") {
          shotProgress += time.deltaTime / shotDuration;

          let isFinished = false;
          if (shotProgress >= 1.0) { shotProgress = 1.0; isFinished = true; }

          const t = shotProgress;
          let ballObject = scene.objects.find(obj => obj.name === "Ball");
          let gkObj = scene.objects.find(obj => obj.name === "Goalkeeper");

          // Topun Aerodinamik Uçuşu
          const currentX = (ballStartPosition.x + (ballTargetPosition.x - ballStartPosition.x) * t) + (sideSpin * t * t);
          const currentZ = ballStartPosition.z + (ballTargetPosition.z - ballStartPosition.z) * t;
          const asymmetricArc = Math.sin(Math.pow(t, 1.4) * Math.PI);
          const currentY = (ballStartPosition.y + (ballTargetPosition.y - ballStartPosition.y) * t) + (asymmetricArc * arcHeight) + (verticalSpin * t * (1 - t));

          if (ballObject) ballObject.transform.position = new Vec3(currentX, currentY, currentZ);

          // Kalecinin Atlayışı
          if (gkObj && gkStartPosition && gkTargetPosition) {
              gkObj.transform.position.x = gkStartPosition.x + (gkTargetPosition.x - gkStartPosition.x) * t;
              gkObj.transform.position.y = gkStartPosition.y + (gkTargetPosition.y - gkStartPosition.y) * t;
              const diveAngle = (gkTargetPosition.x - gkStartPosition.x) * 0.4;
              gkObj.transform.rotation.z = -diveAngle * t;
          }

          if (isFinished) {
              const dx = ballObject.transform.position.x - gkObj.transform.position.x;
              const dy = ballObject.transform.position.y - gkObj.transform.position.y;
              const dz = ballObject.transform.position.z - gkObj.transform.position.z;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              
              if (dist < 1.1) { 
                  console.log("🧤 MÜKEMMEL KURTARIŞ!");
              } else if (currentZ <= -6.4 && currentX > -2.4 && currentX < 2.4 && currentY < 2.6) {
                  console.log("GOOOLLL! ⚽🏆");
              } else {
                  console.log("AUT! ❌");
              }
              gameState = "FINISHED";
          }
      }
      
      else if (gameState === "FINISHED") {
          if (input.wasKeyPressed("Space")) {
              let ballObject = scene.objects.find(obj => obj.name === "Ball");
              if (ballObject) ballObject.transform.position = new Vec3(0, 0.5, 3);
              crosshair.transform.position = new Vec3(0, 1.5, -6.5);
              gameState = "READY";
              console.log("🔄 Resetlendi.");
          }
      }

      app.clear();
      shader.use();
      scene.update(time.deltaTime);
      scene.render(app.gl, shader);
      input.endFrame();
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  } catch (error) {
    console.error("Hata:", error);
  }
}
main();