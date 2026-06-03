import { Vec3 } from "../math/Vec3.js";
import { MousePicker } from "./MousePicker.js";
import { BallTrajectory } from "../physics/BallTrajectory.js";
import { GoalkeeperDive } from "../physics/GoalkeeperDive.js";
import { Collision, ShotResult } from "../physics/Collision.js";

/**
 * Gameplay state machine phases.
 *
 * @readonly
 * @enum {string}
 */
export const GameState = {
  READY: "READY",
  CHARGING: "CHARGING",
  SHOOTING: "SHOOTING",
  FINISHED: "FINISHED",
};

/**
 * Coordinates the complete penalty-shot lifecycle: aiming, charging, shooting,
 * result evaluation, scoring, and reset.
 */
export class GameStateMachine {
  constructor(ui) {
    /** @type {UIManager} */
    this.ui = ui;

    this.state = GameState.READY;

    // Shot parameters.
    this.shotProgress = 0.0;
    this.shotDuration = 0.8;
    this.arcHeight = 2.0;
    this.ballStartPosition = null;
    this.ballTargetPosition = null;

    // Spin and power.
    this.sideSpin = 0.0;
    this.verticalSpin = 0.0;
    this.shotPower = 0.0;
    this.maxPower = 3.0;

    // Goalkeeper positions.
    this.gkStartPosition = null;
    this.gkTargetPosition = null;

    // Score counters.
    this.goalsCount = 0;
    this.savesCount = 0;

    // Save deflection state.
    this.hasSavedBall = false;
    this.saveProgressT = 0.0;
    this.saveBounceStart = null;
    this.saveBounceDirection = null;

    // Result evaluation is delayed so the post-shot animation can continue.
    this.resultEvaluated = false;
    this.shotResult = null;

    // Mouse release is captured as a transient state during shot charging.
    this.mouseReleased = false;
    window.addEventListener("mouseup", () => { this.mouseReleased = false; });
  }

  /**
   * Advances the active gameplay state for the current frame.
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

  /**
   * Handles aiming, goalkeeper placement, and mouse picking before the shot.
   */
  updateReady(deltaTime, input, camera, crosshair, ballObject, gkObj) {
    // The goalkeeper may be repositioned only before the shot starts.
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

    // Arrow keys move the aiming target inside the goal frame.
    const moveSpeed = 4.0 * deltaTime;
    if (input.isKeyDown("ArrowLeft")) crosshair.transform.position.x -= moveSpeed;
    if (input.isKeyDown("ArrowRight")) crosshair.transform.position.x += moveSpeed;
    if (input.isKeyDown("ArrowUp")) crosshair.transform.position.y += moveSpeed;
    if (input.isKeyDown("ArrowDown")) crosshair.transform.position.y -= moveSpeed;

    // Clamp the target to a playable region around the goal mouth.
    crosshair.transform.position.x = Math.max(-3.5, Math.min(3.5, crosshair.transform.position.x));
    crosshair.transform.position.y = Math.max(0.2, Math.min(2.9, crosshair.transform.position.y));

    // A valid ray-sphere hit on the ball starts charging and stores spin.
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
          
          // Click offset controls the shot curve and vertical spin.
          this.sideSpin = -hitOffsetX * 6.5;
          this.verticalSpin = -hitOffsetY * 3.5;

          this.shotPower = 0.0;
          this.mouseReleased = false;

          // Mouseup ends the charging phase and commits the shot.
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

  /**
   * Accumulates shot power while the mouse is held, then launches the shot.
   */
  updateCharging(deltaTime, ballObject, crosshair, gkObj) {
    this.shotPower += deltaTime * 2.5;
    if (this.shotPower > this.maxPower) this.shotPower = this.maxPower;

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

        // Convert charged power and spin into timing and arc parameters.
        const params = BallTrajectory.computeShotParams(
          this.shotPower, this.maxPower, this.verticalSpin
        );
        this.shotDuration = params.shotDuration;
        this.arcHeight = params.arcHeight;

        // The keeper chooses a target before the shot animation begins.
        if (gkObj) {
          this.gkStartPosition = new Vec3(
            gkObj.transform.position.x,
            gkObj.transform.position.y,
            gkObj.transform.position.z
          );
          this.gkTargetPosition = GoalkeeperDive.computeTarget(
            this.gkStartPosition, this.ballTargetPosition, this.sideSpin, this.shotPower, this.maxPower
          );
        }

        this.shotProgress = 0.0;
        this.state = GameState.SHOOTING;
      } else {
        this.state = GameState.READY;
      }
    }
  }

  /**
   * Animates the ball, goalkeeper, save deflections, and final result evaluation.
   */
  updateShooting(deltaTime, ballObject, gkObj) {
    this.shotProgress += deltaTime / this.shotDuration;

    const t = this.shotProgress;

    // The trajectory function owns all spin, arc, and post-bounce motion.
    const ballPos = BallTrajectory.computePosition(
      t, this.ballStartPosition, this.ballTargetPosition,
      this.sideSpin, this.verticalSpin, this.arcHeight
    );

    // During the active save window, proximity to the keeper can trigger a deflection.
    if (!this.hasSavedBall && gkObj && t > 0.65 && t < 0.95) {
      const gkPos = gkObj.transform.position;
      const dx = ballPos.x - gkPos.x;
      const dy = ballPos.y - gkPos.y;
      const dz = ballPos.z - gkPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 1.1) {
        // Powerful shots have a chance to pass through the keeper's reach.
        const shotPowerRatio = this.shotPower / this.maxPower;
        const isGkSave = !(shotPowerRatio > 0.7 && Math.random() < 0.35);

        if (isGkSave) {
          this.hasSavedBall = true;
          this.saveProgressT = t;
          this.saveBounceStart = new Vec3(ballPos.x, ballPos.y, ballPos.z);
          // Positive Z sends the deflected ball back into the field.
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
      // Saved shots bounce back into the field rather than leaking into the net.
      const tb = (t - this.saveProgressT) / (1.0 - this.saveProgressT + 0.001);
      const bounceX = this.saveBounceStart.x + this.saveBounceDirection.x * tb;
      const bounceY = Math.max(0.3, this.saveBounceStart.y + this.saveBounceDirection.y * Math.sin(tb * Math.PI) - 0.5 * tb);
      const bounceZ = this.saveBounceStart.z + this.saveBounceDirection.z * tb;
      finalBallPos = new Vec3(bounceX, bounceY, bounceZ);
    }

    if (ballObject) {
      ballObject.transform.position = finalBallPos;

      // Visual ball rotation reinforces the selected spin and shot speed.
      const rotationSpeed = 24.0;
      
      // Vertical spin affects forward rolling and topspin/backspin appearance.
      ballObject.transform.rotation.x += deltaTime * rotationSpeed * (1.2 + this.verticalSpin * 0.4);
      
      // Side spin produces visible rotation around the vertical axis.
      ballObject.transform.rotation.y += deltaTime * this.sideSpin * 8.0;
      
      // A small tumble component avoids perfectly mechanical rotation.
      ballObject.transform.rotation.z += deltaTime * rotationSpeed * 0.15;
    }

    // Use the hierarchical animation when available; otherwise use fallback interpolation.
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

    // Result evaluation runs once when the ball reaches the goal plane.
    // This block must use the same impact-point calculation as
    // BallTrajectory.js.  The ball's real position at impact includes sideSpin,
    // which shifts the ball away from target.x/target.y.  Checking target.*
    // directly would desynchronize the visual path and logical result.
    if (!this.resultEvaluated && t >= 1.0) {
      this.resultEvaluated = true;

      // Replicate BallTrajectory's impact coordinates exactly so all modules
      // share the same frame of reference.
      const collisionT   = 0.90;
      const st           = this.ballStartPosition;
      const tg           = this.ballTargetPosition;
      const xAtImpact    = (st.x + (tg.x - st.x) * collisionT)
                         + (this.sideSpin * collisionT * collisionT);
      const arcImpact    = Math.sin(Math.pow(collisionT, 1.4) * Math.PI);
      const yAtImpact    = (st.y + (tg.y - st.y) * collisionT)
                         + (arcImpact * this.arcHeight)
                         + (this.verticalSpin * collisionT * (1.0 - collisionT));

      // STEP 1: absolute miss when the impact point is outside the goal frame.
      // Mirrors BallTrajectory.js isClearMiss and Collision.js STEP 1.
      const isClearMiss = xAtImpact < -4.0 || xAtImpact > 4.0 || yAtImpact > 3.3;

      // STEP 2: strict post and crossbar bands.
      const hitLeft     = !isClearMiss
                       && xAtImpact >= -4.0 && xAtImpact <= -3.4
                       && yAtImpact <= 3.3;
      const hitRight    = !isClearMiss && !hitLeft
                       && xAtImpact >= 3.4 && xAtImpact <= 4.0
                       && yAtImpact <= 3.3;
      const hitCrossbar = !isClearMiss && !hitLeft && !hitRight
                       && yAtImpact >= 2.8 && yAtImpact <= 3.3
                       && xAtImpact > -3.4 && xAtImpact < 3.4;
      const hitPost = hitLeft || hitRight || hitCrossbar;

      if (isClearMiss) {
        // Clear misses bypass post-bounce messaging.
        this.shotResult = ShotResult.MISS;
        this.ui.showScreenMessage("DIŞARIYA! ❌", "msg-miss");
      } else if (hitPost) {
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

    // Let the post-shot animation continue before allowing reset.
    let isFinished = false;
    if (this.shotProgress >= 3.5) {
      isFinished = true;
    }

    if (isFinished) {
      this.ui.showResetHint();
      this.state = GameState.FINISHED;
    }
  }

  /**
   * Waits for reset input after the result animation has completed.
   */
  updateFinished(input, ballObject, crosshair) {
    if (input.wasKeyPressed("Space")) {
      if (ballObject) {
        // Reset the ball to the penalty spot and rest it on the grass.
        ballObject.transform.position = new Vec3(0, 0.3, 0);
        // Clear residual rotation from the previous shot.
        ballObject.transform.rotation  = new Vec3(Math.PI * 0.75, 0, 0);
      }

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

  /**
   * Finds the existing crosshair or creates it lazily when the scene lacks one.
   */
  findOrCreateCrosshair(scene) {
    let crosshair = scene.objects.find(obj => obj.name === "Crosshair");
    if (!crosshair) {
      const { TargetCrosshair } = this.getCrosshairModule();
      crosshair = new TargetCrosshair(this.gl);
      scene.add(crosshair);
    }
    return crosshair;
  }

  /**
   * Supplies dependencies that are created by the application entry point.
   */
  init(gl, crosshairModule) {
    this.gl = gl;
    this._crosshairModule = crosshairModule;
  }

  getCrosshairModule() {
    return this._crosshairModule;
  }
}
