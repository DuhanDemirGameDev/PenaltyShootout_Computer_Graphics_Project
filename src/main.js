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
    // Task 2: Spotlight intensity başlangıç değeri 1.0 olarak ayarlandı
    const light1 = new Spotlight({ position: new Vec3(-9, 8, -9), target: lightTarget, intensity: 1.0 });
    const light2 = new Spotlight({ position: new Vec3( 9, 8, -9), target: lightTarget, intensity: 1.0 });
    const light3 = new Spotlight({ position: new Vec3(-9, 8,  7), target: lightTarget, intensity: 1.0 });
    const light4 = new Spotlight({ position: new Vec3( 9, 8,  7), target: lightTarget, intensity: 1.0 });

    scene.addLight(light1);
    scene.addLight(light2);
    scene.addLight(light3);
    scene.addLight(light4);

    // 4 adet kule için 4 ayrı gölge haritası (Performans için çözünürlüğü 1024x1024 yaptık)
    const shadowMaps = [
      new ShadowMap(app.gl, 1024, 1024),
      new ShadowMap(app.gl, 1024, 1024),
      new ShadowMap(app.gl, 1024, 1024),
      new ShadowMap(app.gl, 1024, 1024)
    ];

    // --- UI ve Oyun Durum Makinesi ---
    const ui = new UIManager();
    const game = new GameStateMachine(ui);
    game.init(app.gl, { TargetCrosshair });

    const lightsList = [light1, light2, light3, light4];

    // Task 1 FIX: Her ışık için kanonikal (animasyon öncesi) baz pozisyonları saklıyoruz.
    // Dropdown değiştiğinde slider'ları bu baz pozisyonlarına göre güncelliyoruz,
    // böylece animasyon döngüsü yeni ışığın baz pozisyonunu referans alır ve ışık teleport etmez.
    const lightBasePositions = lightsList.map(l => ({
      x: l.position.x,
      y: l.position.y,
      z: l.position.z,
    }));

    const lightSelector   = document.getElementById("selectedLightIndex");
    const posXSliderInit  = document.getElementById("lightPosX");
    const posYSliderInit  = document.getElementById("lightPosY");
    const posZSliderInit  = document.getElementById("lightPosZ");

    // Slider'lardaki mevcut baz pozisyonunu sakla (kullanıcının değiştirdiğinde güncellenir)
    // Başlangıçta seçili ışık (index 2 = light3) baz pozisyonu slider'lara yüklenir.
    if (posXSliderInit) posXSliderInit.value = lightBasePositions[2].x;
    if (posYSliderInit) posYSliderInit.value = lightBasePositions[2].y;
    if (posZSliderInit) posZSliderInit.value = lightBasePositions[2].z;

    if (lightSelector && posXSliderInit && posYSliderInit && posZSliderInit) {
      lightSelector.addEventListener("change", () => {
        const idx = parseInt(lightSelector.value);
        // Task 1 FIX: Slider'ları animasyonlu (anlık) pozisyondan DEĞİL,
        // o ışığın kanonikal baz pozisyonundan oku. Böylece loop bir sonraki frame'de
        // doğru baz üzerinde animasyon uygular ve ışık zıplamaz.
        const base = lightBasePositions[idx];
        if (base) {
          posXSliderInit.value = base.x;
          posYSliderInit.value = base.y;
          posZSliderInit.value = base.z;
        }
      });

      // Kullanıcı slider'ı elle değiştirdiğinde kanonikal baz pozisyonunu da güncelle
      const updateBase = () => {
        const idx = parseInt(lightSelector.value);
        lightBasePositions[idx].x = parseFloat(posXSliderInit.value);
        lightBasePositions[idx].y = parseFloat(posYSliderInit.value);
        lightBasePositions[idx].z = parseFloat(posZSliderInit.value);
      };
      posXSliderInit.addEventListener("input", updateBase);
      posYSliderInit.addEventListener("input", updateBase);
      posZSliderInit.addEventListener("input", updateBase);
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


      const selectedIndex = lightSelector ? parseInt(lightSelector.value) : 2;
      const selectedLight = lightsList[selectedIndex];

      if (moveSpeed > 0) {
        const timeSec = time.elapsedTime * 0.001 * moveSpeed;
        
        // Spotlight hedeflerini arama ışıkları gibi gezdiriyoruz
        light1.target = new Vec3(Math.cos(timeSec) * 3.5, 0, -3 + Math.sin(timeSec) * 1.5);
        light2.target = new Vec3(Math.sin(timeSec * 1.25) * 3.5, 0, -3 + Math.cos(timeSec * 0.75) * 1.5);
        
        // Task 1 FIX: Orbit bazını slider'dan değil lightBasePositions'dan oku —
        // bu sayede dropdown değişiminde ışık anlık pozisyona (mid-orbit) zıplamaz.
        const base = lightBasePositions[selectedIndex];
        const basePosX = base ? base.x : (selectedLight ? selectedLight.position.x : -9);
        const basePosY = base ? base.y : (selectedLight ? selectedLight.position.y :  8);
        const basePosZ = base ? base.z : (selectedLight ? selectedLight.position.z :  7);
        
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
        const base = lightBasePositions[selectedIndex];
        if (selectedLight && base) {
          selectedLight.position = new Vec3(base.x, base.y, base.z);
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

      // 1. Gölge Geçişi (Shadow Pass) - Her ışık kaynağı için ayrı derinlik çizimi yapıyoruz
      for (let i = 0; i < 4; i++) {
        const currentLight = lightsList[i];
        const currentShadowMap = shadowMaps[i];
        
        if (currentLight && currentLight.enabled) {
          currentShadowMap.bind();
          shadowShader.use();
          shadowShader.setMat4("uLightSpaceMatrix", currentLight.getLightSpaceMatrix().elements);
          scene.renderDepthPass(app.gl, shadowShader);
          currentShadowMap.unbind(app.canvas.width, app.canvas.height);
        }
      }

      // 2. Ana Çizim Geçişi (Color Pass)
      app.clear();
      shader.use();

      // Doku ünitelerine gölge haritalarını bağla ve uniform'ları yükle
      for (let i = 0; i < 4; i++) {
        const currentLight = lightsList[i];
        const currentShadowMap = shadowMaps[i];
        
        // TEXTURE1, TEXTURE2, TEXTURE3, TEXTURE4 ünitelerini kullanıyoruz
        app.gl.activeTexture(app.gl.TEXTURE1 + i);
        app.gl.bindTexture(app.gl.TEXTURE_2D, currentShadowMap.getDepthTexture());
        
        shader.setInt(`uShadowMap${i}`, 1 + i);
        shader.setMat4(`uLightSpaceMatrix${i}`, currentLight.getLightSpaceMatrix().elements);
        shader.setBool(`uShadowEnabled${i}`, currentLight.enabled);
      }

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