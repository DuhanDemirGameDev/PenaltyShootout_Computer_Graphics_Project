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

      // Oyun mantığı güncelleme
      game.update(time.deltaTime, scene, input, camera);
      cameraControls.update();

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
      shader.setBool("uShadowEnabled", true);
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