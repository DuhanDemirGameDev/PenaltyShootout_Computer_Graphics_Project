import { Vec3 } from "../math/Vec3.js";
import { MousePicker } from "./MousePicker.js";
import { BallTrajectory } from "../physics/BallTrajectory.js";
import { GoalkeeperDive } from "../physics/GoalkeeperDive.js";
import { Collision, ShotResult } from "../physics/Collision.js";

// ============================================================
// Oyun Durum Makinesi
// READY → CHARGING → SHOOTING → FINISHED döngüsünü yönetir.
// Tüm oyun durumu değişkenleri bu sınıfta merkezileştirilmiştir.
// ============================================================

/**
 * @readonly
 * @enum {string}
 */
export const GameState = {
  READY: "READY",
  CHARGING: "CHARGING",
  SHOOTING: "SHOOTING",
  FINISHED: "FINISHED",
};

export class GameStateMachine {
  constructor(ui) {
    /** @type {UIManager} */
    this.ui = ui;

    this.state = GameState.READY;

    // Şut parametreleri
    this.shotProgress = 0.0;
    this.shotDuration = 0.8;
    this.arcHeight = 2.0;
    this.ballStartPosition = null;
    this.ballTargetPosition = null;

    // Spin ve güç
    this.sideSpin = 0.0;
    this.verticalSpin = 0.0;
    this.shotPower = 0.0;
    this.maxPower = 3.0;

    // Kaleci
    this.gkStartPosition = null;
    this.gkTargetPosition = null;

    // Skor
    this.goalsCount = 0;
    this.savesCount = 0;

    // Kaleci kurtarma sekme fiziği değişkenleri
    this.hasSavedBall = false;
    this.saveProgressT = 0.0;
    this.saveBounceStart = null;
    this.saveBounceDirection = null;

    // Gol değerlendirme ve 3 saniyelik kutlama geciktirme değişkenleri
    this.resultEvaluated = false;
    this.shotResult = null;

    // Mouse durumu
    this.mouseReleased = false;
    window.addEventListener("mouseup", () => { this.mouseReleased = false; });
  }

  /**
   * Her frame'de çağrılır. Mevcut duruma göre uygun güncellemeyi yapar.
   */
  update(deltaTime, scene, input, camera) {
    const crosshair = this.findOrCreateCrosshair(scene);
    const ballObject = scene.objects.find(obj => obj.name && obj.name.toLowerCase().includes("ball"));
    const gkObj = scene.objects.find(obj => obj.name && obj.name.toLowerCase().includes("goalkeeper"));

    switch (this.state) {
      case GameState.READY:
        this.updateReady(deltaTime, input, camera, crosshair, ballObject, gkObj);
        break;
      case GameState.CHARGING:
        this.updateCharging(deltaTime, ballObject, crosshair, gkObj);
        break;
      case GameState.SHOOTING:
        this.updateShooting(deltaTime, ballObject, gkObj);
        break;
      case GameState.FINISHED:
        this.updateFinished(input, ballObject, crosshair);
        break;
    }
  }

  // ------------------------------------------
  // DURUM 1: HAZIRLIK VE NİŞAN ALMA (READY)
  // ------------------------------------------
  updateReady(deltaTime, input, camera, crosshair, ballObject, gkObj) {
    // Kaleci slider kontrolü
    const gkSlider = document.getElementById("goalkeeperX");
    if (gkSlider && gkObj) {
      gkObj.transform.position.x = parseFloat(gkSlider.value);
      if (typeof gkObj.setDiveProgress === "function") {
        gkObj.setDiveProgress(0, gkObj.transform.position, gkObj.transform.position);
      } else {
        gkObj.transform.rotation.z = 0;
        gkObj.transform.position.y = 0.0;
      }
    }

    // Crosshair klavye hareketi
    const moveSpeed = 4.0 * deltaTime;
    if (input.isKeyDown("ArrowLeft")) crosshair.transform.position.x -= moveSpeed;
    if (input.isKeyDown("ArrowRight")) crosshair.transform.position.x += moveSpeed;
    if (input.isKeyDown("ArrowUp")) crosshair.transform.position.y += moveSpeed;
    if (input.isKeyDown("ArrowDown")) crosshair.transform.position.y -= moveSpeed;

    // Crosshair sınırları (Standard kale sınırlarına ve 90 köşelere ulaşabilmesi için genişletildi)
    crosshair.transform.position.x = Math.max(-3.5, Math.min(3.5, crosshair.transform.position.x));
    crosshair.transform.position.y = Math.max(0.2, Math.min(2.9, crosshair.transform.position.y));

    // Topa tıklama — spin hesabı ve CHARGING'e geçiş
    if (input.wasMouseClicked()) {
      const mouse = input.getMousePosition();

      if (ballObject) {
        const rayDirection = MousePicker.calculateRayDirection(
          mouse.ndcX, mouse.ndcY,
          camera.getViewMatrix(), camera.getProjectionMatrix()
        );
        const hitPoint = MousePicker.getIntersectionPoint(
          camera.position, rayDirection,
          ballObject.transform.position, 0.5
        );

        if (hitPoint) {
          const hitOffsetX = hitPoint.x - ballObject.transform.position.x;
          const hitOffsetY = hitPoint.y - ballObject.transform.position.y;
          
          // Orijinal tıklama konumuna göre kavis katsayılarına geri dönüyoruz
          this.sideSpin = -hitOffsetX * 6.5;
          this.verticalSpin = -hitOffsetY * 3.5;

          this.shotPower = 0.0;
          this.mouseReleased = false;

          // Mouse bırakıldığında flag'i set et
          const onMouseUp = () => {
            this.mouseReleased = true;
            window.removeEventListener("mouseup", onMouseUp);
          };
          window.addEventListener("mouseup", onMouseUp);

          this.ui.showPowerBar();
          this.state = GameState.CHARGING;
        }
      }
    }
  }

  // ------------------------------------------
  // DURUM 1.5: ŞİDDETİ ŞARJ ETME (CHARGING)
  // ------------------------------------------
  updateCharging(deltaTime, ballObject, crosshair, gkObj) {
    this.shotPower += deltaTime * 2.5;
    if (this.shotPower > this.maxPower) this.shotPower = this.maxPower;

    // Güç barı güncelleme
    this.ui.updatePowerFill(this.shotPower / this.maxPower);

    if (this.mouseReleased) {
      this.ui.hidePowerBar();

      if (ballObject) {
        this.ballStartPosition = new Vec3(
          ballObject.transform.position.x,
          ballObject.transform.position.y,
          ballObject.transform.position.z
        );
        this.ballTargetPosition = new Vec3(
          crosshair.transform.position.x,
          crosshair.transform.position.y,
          crosshair.transform.position.z
        );

        // Şut parametrelerini hesapla
        const params = BallTrajectory.computeShotParams(
          this.shotPower, this.maxPower, this.verticalSpin
        );
        this.shotDuration = params.shotDuration;
        this.arcHeight = params.arcHeight;

        // Kaleci dalış hedefini hesapla
        if (gkObj) {
          this.gkStartPosition = new Vec3(
            gkObj.transform.position.x,
            gkObj.transform.position.y,
            gkObj.transform.position.z
          );
          this.gkTargetPosition = GoalkeeperDive.computeTarget(
            this.gkStartPosition, this.ballTargetPosition, this.sideSpin
          );
        }

        this.shotProgress = 0.0;
        this.state = GameState.SHOOTING;
      } else {
        this.state = GameState.READY;
      }
    }
  }

  // ------------------------------------------
  // DURUM 2: ŞUT VE ATLAYIŞ (SHOOTING)
  // ------------------------------------------
  updateShooting(deltaTime, ballObject, gkObj) {
    this.shotProgress += deltaTime / this.shotDuration;

    const t = this.shotProgress;

    // Top pozisyonunu hesapla
    const ballPos = BallTrajectory.computePosition(
      t, this.ballStartPosition, this.ballTargetPosition,
      this.sideSpin, this.verticalSpin, this.arcHeight
    );

    // Kaleci kurtarma anını sürekli havada denetle (t > 0.65 iken top kaleciye ulaşır)
    if (!this.hasSavedBall && gkObj && t > 0.65 && t < 0.95) {
      const gkPos = gkObj.transform.position;
      const dx = ballPos.x - gkPos.x;
      const dy = ballPos.y - gkPos.y;
      const dz = ballPos.z - gkPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 1.1) {
        // Güç oranına göre kurtarma şansını hesapla (Collision.js mantığı)
        const shotPowerRatio = this.shotPower / this.maxPower;
        const isGkSave = !(shotPowerRatio > 0.7 && Math.random() < 0.35);

        if (isGkSave) {
          this.hasSavedBall = true;
          this.saveProgressT = t;
          this.saveBounceStart = new Vec3(ballPos.x, ballPos.y, ballPos.z);
          // Kalecinin eline çarpıp sahaya geri sekme vektörü (Z sahanın içine doğru pozitif)
          this.saveBounceDirection = new Vec3(
            (dx + (Math.random() - 0.5) * 0.4) * 0.4,
            0.6 + Math.random() * 0.4,
            1.5 + Math.random() * 0.8
          );
        }
      }
    }

    let finalBallPos = ballPos;
    if (this.hasSavedBall) {
      // Top kaleciye çarptıysa sahanın içine sekip yerde kalır, arkaya sızmaz
      const tb = (t - this.saveProgressT) / (1.0 - this.saveProgressT + 0.001);
      const bounceX = this.saveBounceStart.x + this.saveBounceDirection.x * tb;
      const bounceY = Math.max(0.3, this.saveBounceStart.y + this.saveBounceDirection.y * Math.sin(tb * Math.PI) - 0.5 * tb);
      const bounceZ = this.saveBounceStart.z + this.saveBounceDirection.z * tb;
      finalBallPos = new Vec3(bounceX, bounceY, bounceZ);
    }

    if (ballObject) {
      ballObject.transform.position = finalBallPos;

      // Realistik Top Spini (Görsel Dönen Top Etkisi)
      const rotationSpeed = 24.0; // Dönme hızı katsayısı
      
      // Dikey spin (backspin / topspin) X eksenindeki dönüşü etkiler (ileri doğru yuvarlanma dahil)
      ballObject.transform.rotation.x += deltaTime * rotationSpeed * (1.2 + this.verticalSpin * 0.4);
      
      // Yatay spin (falso) Y ekseninde güçlü bir dönme oluşturur
      ballObject.transform.rotation.y += deltaTime * this.sideSpin * 8.0;
      
      // Z ekseninde hafif salınım (tumble) spini
      ballObject.transform.rotation.z += deltaTime * rotationSpeed * 0.15;
    }

    // Kaleci interpolasyonu
    if (gkObj && this.gkStartPosition && this.gkTargetPosition) {
      if (typeof gkObj.setDiveProgress === "function") {
        gkObj.setDiveProgress(Math.min(1.0, t), this.gkStartPosition, this.gkTargetPosition);
      } else {
        const dive = GoalkeeperDive.interpolate(Math.min(1.0, t), this.gkStartPosition, this.gkTargetPosition);
        gkObj.transform.position.x = dive.x;
        gkObj.transform.position.y = dive.y;
        gkObj.transform.rotation.z = dive.rotationZ;
      }
    }

    // Gol / kurtarış veya direkten sekme sonucunu tam çizgi geçiş anında (t = 1.0) değerlendir (FIFA gibi akıcı)
    if (!this.resultEvaluated && t >= 1.0) {
      this.resultEvaluated = true;
      
      // Direk temas kontrolü
      const target = this.ballTargetPosition;
      const hitLeft = Math.abs(target.x - (-3.66)) < 0.35 && target.y < 3.1;
      const hitRight = Math.abs(target.x - 3.66) < 0.35 && target.y < 3.1;
      const hitCrossbar = Math.abs(target.y - 3.0) < 0.35 && Math.abs(target.x) < 3.76;
      const hitPost = hitLeft || hitRight || hitCrossbar;

      if (hitPost) {
        this.shotResult = ShotResult.MISS;
        this.ui.showScreenMessage("DİREKTEN DÖNDÜ! 💥", "msg-miss");
      } else if (this.hasSavedBall) {
        this.shotResult = ShotResult.SAVE;
        this.savesCount++;
        this.ui.updateScore(this.goalsCount, this.savesCount);
        this.ui.showScreenMessage("KAPTI! 🧤", "msg-save");
      } else {
        this.shotResult = Collision.checkShotResult(
          ballPos,
          gkObj ? gkObj.transform.position : null,
          this.shotPower,
          this.maxPower
        );

        if (this.shotResult === ShotResult.GOAL) {
          this.goalsCount++;
          this.ui.updateScore(this.goalsCount, this.savesCount);
          this.ui.showScreenMessage("GOOOL! ⚽🏆", "msg-goal");
        } else {
          this.ui.showScreenMessage("DIŞARIYA! ❌", "msg-miss");
        }
      }
    }

    // Şutu anında bitirme, topun 3 saniye boyunca ağlara süzülmesini veya sahaya sekmesini sağla (t = 3.5'e kadar)
    let isFinished = false;
    if (this.shotProgress >= 3.5) {
      isFinished = true;
    }

    // Şut tamamlandıysa sonuç kontrolü
    if (isFinished) {
      this.ui.showResetHint();
      this.state = GameState.FINISHED;
    }
  }

  // ------------------------------------------
  // DURUM 3: BİTİŞ VE RESET (FINISHED)
  // ------------------------------------------
  updateFinished(input, ballObject, crosshair) {
    if (input.wasKeyPressed("Space")) {
      if (ballObject) ballObject.transform.position = new Vec3(0, 0.5, 3);
      crosshair.transform.position = new Vec3(0, 1.5, -6.5);

      this.hasSavedBall = false;
      this.saveBounceDirection = null;
      this.saveProgressT = 0.0;
      this.resultEvaluated = false;
      this.shotResult = null;

      this.ui.hideScreenMessage();
      this.ui.hideResetHint();

      this.state = GameState.READY;
    }
  }

  // ------------------------------------------
  // Yardımcı: Crosshair'i bul veya oluştur
  // ------------------------------------------
  findOrCreateCrosshair(scene) {
    let crosshair = scene.objects.find(obj => obj.name === "Crosshair");
    if (!crosshair) {
      // Lazy import yerine scene dışından gelen bir factory kullanılabilir,
      // ama şimdilik doğrudan import ediyoruz.
      const { TargetCrosshair } = this.getCrosshairModule();
      crosshair = new TargetCrosshair(this.gl);
      scene.add(crosshair);
    }
    return crosshair;
  }

  /**
   * WebGL context ve TargetCrosshair modülünü set eder.
   * main.js tarafından init sırasında çağrılır.
   */
  init(gl, crosshairModule) {
    this.gl = gl;
    this._crosshairModule = crosshairModule;
  }

  getCrosshairModule() {
    return this._crosshairModule;
  }
}
