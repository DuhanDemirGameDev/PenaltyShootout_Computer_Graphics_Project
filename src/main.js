// ============================================================
// Ana Giriş Noktası (Entry Point)
// WebGL uygulamasını başlatır, sahneyi kurar ve animasyon döngüsünü çalıştırır.
// Tüm iş mantığı ilgili modüllere delege edilmiştir.
// ============================================================

import { WebGLApp } from "./core/WebGLApp.js";
import { Camera } from "./core/Camera.js";
import { Scene } from "./core/Scene.js";
import { ShaderProgram } from "./core/ShaderProgram.js";
import { Time } from "./core/Time.js";
import { InputManager } from "./interaction/InputManager.js";
import { Vec3 } from "./math/Vec3.js";
import { AdBoards } from "./objects/AdBoards.js";

// Shader kaynakları
import { basicVertexShader, basicFragmentShader, shadowVertexShader, shadowFragmentShader } from "./shaders/ShaderSources.js";

// Sahne objeleri
import { Ground } from "./objects/Ground.js";
import { Ball } from "./objects/Ball.js";
import { GoalPost } from "./objects/GoalPost.js";
import { StadiumLights } from "./objects/StadiumLights.js";
import { Goalkeeper } from "./objects/Goalkeeper.js";
import { TargetCrosshair } from "./objects/TargetCrosshair.js";

// Oyun sistemleri
import { GameStateMachine } from "./interaction/GameStateMachine.js";
import { UIManager } from "./ui/UIManager.js";
import { CameraControls } from "./interaction/CameraControls.js";

// Işık ve Gölge
import { Spotlight } from "./lighting/Spotlight.js";
import { ShadowMap } from "./lighting/ShadowMap.js";

function main() {
  try {
    // --- Motor Başlatma ---
    const app = new WebGLApp("glCanvas");
    const shader = new ShaderProgram(app.gl, basicVertexShader, basicFragmentShader);
    const shadowShader = new ShaderProgram(app.gl, shadowVertexShader, shadowFragmentShader);

    const camera = new Camera({
      position: new Vec3(0, 10, 30),
      target: new Vec3(0, 0, 0),
      aspectRatio: app.canvas.width / app.canvas.height,
    });

    const scene = new Scene({ camera });
    const time = new Time();
    const input = new InputManager(app.canvas);

    shader.use();
    app.clear();

    app.gl.enable(app.gl.BLEND);
    app.gl.blendFunc(app.gl.SRC_ALPHA, app.gl.ONE_MINUS_SRC_ALPHA);

    shader.setMat4("uViewMatrix", camera.getViewMatrix().elements);
    shader.setMat4("uProjectionMatrix", camera.getProjectionMatrix().elements);

    // --- Sahne Objeleri ---
    scene.add(new Ground(app.gl));
    scene.add(new Ball(app.gl));
    scene.add(new GoalPost(app.gl));
    scene.add(new StadiumLights(app.gl));
    scene.add(new Goalkeeper(app.gl));
    scene.add(new AdBoards(app.gl));

    // --- Işıklar ve Gölge ---
    const lightTarget = new Vec3(0, 0, -3);
    const light1 = new Spotlight({ position: new Vec3(-9, 8, -9), target: lightTarget });
    const light2 = new Spotlight({ position: new Vec3(9, 8, -9), target: lightTarget });
    const light3 = new Spotlight({ position: new Vec3(-9, 8, 7), target: lightTarget });
    const light4 = new Spotlight({ position: new Vec3(9, 8, 7), target: lightTarget });

    scene.addLight(light1);
    scene.addLight(light2);
    scene.addLight(light3);
    scene.addLight(light4);

    const shadowMap = new ShadowMap(app.gl, 2048, 2048);
    const mainLight = light3; // Gölgeler ana ışık (ön-sol kule) üzerinden hesaplanacak

    // --- UI ve Oyun Durum Makinesi ---
    const ui = new UIManager();
    const game = new GameStateMachine(ui);
    game.init(app.gl, { TargetCrosshair });

    // Seçili ışık kulesi değiştikçe slider'ları güncelle
    const lightSelector = document.getElementById("selectedLightIndex");
    const posXSliderInit = document.getElementById("lightPosX");
    const posYSliderInit = document.getElementById("lightPosY");
    const posZSliderInit = document.getElementById("lightPosZ");
    const lightsList = [light1, light2, light3, light4];

    if (lightSelector && posXSliderInit && posYSliderInit && posZSliderInit) {
      lightSelector.addEventListener("change", () => {
        const idx = parseInt(lightSelector.value);
        const selLight = lightsList[idx];
        if (selLight) {
          posXSliderInit.value = selLight.position.x;
          posYSliderInit.value = selLight.position.y;
          posZSliderInit.value = selLight.position.z;
        }
      });
    }

    // --- Kamera Kontrolleri ---
    const cameraControls = new CameraControls(camera, app.canvas);

    // --- Animasyon Döngüsü ---
    const animate = (timestamp) => {
      time.update(timestamp);
      camera.updateAspectRatio(app.canvas.width, app.canvas.height);

      // Slider değerlerini güncelle
      const intensitySlider = document.getElementById("lightIntensity");
      if (intensitySlider) {
        const val = parseFloat(intensitySlider.value);
        scene.lights.forEach(l => l.intensity = val);
      }

      // Işık kulelerinin aktiflik durumunu güncelle (Açma/Kapama)
      const check1 = document.getElementById("light1Enabled");
      const check2 = document.getElementById("light2Enabled");
      const check3 = document.getElementById("light3Enabled");
      const check4 = document.getElementById("light4Enabled");

      light1.enabled = check1 ? check1.checked : true;
      light2.enabled = check2 ? check2.checked : true;
      light3.enabled = check3 ? check3.checked : true;
      light4.enabled = check4 ? check4.checked : true;

      // Dinamik Spotlight Hareketi ve Manuel Konumlandırma
      const movementSlider = document.getElementById("lightMovementSpeed");
      let moveSpeed = 1.0;
      if (movementSlider) {
        moveSpeed = parseFloat(movementSlider.value);
      }

      const posXSlider = document.getElementById("lightPosX");
      const posYSlider = document.getElementById("lightPosY");
      const posZSlider = document.getElementById("lightPosZ");

      const selectedIndex = lightSelector ? parseInt(lightSelector.value) : 2;
      const selectedLight = lightsList[selectedIndex];

      if (moveSpeed > 0) {
        const timeSec = time.elapsedTime * 0.001 * moveSpeed;
        
        // Spotlight hedeflerini arama ışıkları gibi gezdiriyoruz
        light1.target = new Vec3(Math.cos(timeSec) * 3.5, 0, -3 + Math.sin(timeSec) * 1.5);
        light2.target = new Vec3(Math.sin(timeSec * 1.25) * 3.5, 0, -3 + Math.cos(timeSec * 0.75) * 1.5);
        
        // Seçilen ışık kaynağı manuel konum etrafında daire çizer, diğerleri otomatik hedef takibi yapar
        const basePosX = posXSlider ? parseFloat(posXSlider.value) : (selectedLight ? selectedLight.position.x : -9);
        const basePosY = posYSlider ? parseFloat(posYSlider.value) : (selectedLight ? selectedLight.position.y : 8);
        const basePosZ = posZSlider ? parseFloat(posZSlider.value) : (selectedLight ? selectedLight.position.z : 7);
        
        if (selectedLight) {
          selectedLight.position = new Vec3(
            basePosX + Math.cos(timeSec * 0.8) * 1.8,
            basePosY,
            basePosZ + Math.sin(timeSec * 0.8) * 1.8
          );
        }
        
        light3.target = new Vec3(Math.cos(timeSec * 0.8) * 4.5, 0, -3 + Math.sin(timeSec * 1.1) * 2.0);
        light4.target = new Vec3(Math.sin(timeSec * 1.4) * 3.0, 0, -3 + Math.cos(timeSec * 0.6) * 2.0);
      } else {
        const defaultTarget = new Vec3(0, 0, -3);
        light1.target = defaultTarget;
        light2.target = defaultTarget;
        light3.target = defaultTarget;
        light4.target = defaultTarget;
        
        // Hareket yokken tamamen manuel kontrol: Seçili ışık kaynağı kullanıcının belirlediği X, Y, Z konumuna gider
        if (selectedLight && posXSlider && posYSlider && posZSlider) {
          selectedLight.position = new Vec3(
            parseFloat(posXSlider.value),
            parseFloat(posYSlider.value),
            parseFloat(posZSlider.value)
          );
        }
      }

      // Tüm fiziksel ışık kulelerinin konumlarını ilgili ışık kaynakları ile senkronize et
      const stadiumLightsObj = scene.objects.find(obj => obj.name && obj.name.includes("All Stadium Lights"));
      if (stadiumLightsObj) {
        for (let i = 0; i < 4; i++) {
          if (stadiumLightsObj.childrenObjects[i] && lightsList[i]) {
            stadiumLightsObj.childrenObjects[i].transform.position.x = lightsList[i].position.x;
            stadiumLightsObj.childrenObjects[i].transform.position.z = lightsList[i].position.z;
          }
        }
      }

      // Oyun mantığı güncelleme
      game.update(time.deltaTime, scene, input, camera);
      cameraControls.update(input, time.deltaTime);

      const lightSpaceMatrix = mainLight.getLightSpaceMatrix();

      // 1. Gölge Geçişi (Shadow Pass)
      shadowMap.bind();
      shadowShader.use();
      shadowShader.setMat4("uLightSpaceMatrix", lightSpaceMatrix.elements);
      scene.renderDepthPass(app.gl, shadowShader);
      shadowMap.unbind(app.canvas.width, app.canvas.height);

      // 2. Ana Çizim Geçişi (Color Pass)
      app.clear();
      shader.use();
      shader.setBool("uShadowEnabled", light3.enabled); // Ana ışık kapalıysa gölgeleri kapat
      shader.setMat4("uLightSpaceMatrix", lightSpaceMatrix.elements);

      // Gölge haritasını aktif et
      app.gl.activeTexture(app.gl.TEXTURE1);
      app.gl.bindTexture(app.gl.TEXTURE_2D, shadowMap.getDepthTexture());
      shader.setInt("uShadowMap", 1);

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