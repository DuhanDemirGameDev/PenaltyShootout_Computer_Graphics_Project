import { Vec3 } from "../math/Vec3.js";

/**
 * Computes goalkeeper dive targets and fallback interpolation values.
 */
export class GoalkeeperDive {

  /**
   * Computes a plausible dive target for the goalkeeper.
   *
   * The keeper does not perfectly know the final ball position. Instead, the
   * decision combines shot power, spin-adjusted direction, and controlled
   * randomness to produce believable saves and wrong-footed dives.
   *
   * @param {Vec3} gkStartPos - Goalkeeper position before the shot.
   * @param {Vec3} ballTargetPos - Crosshair target position.
   * @param {number} sideSpin - Horizontal spin contribution.
   * @param {number} shotPower - Current shot power.
   * @param {number} maxPower - Maximum possible shot power.
   * @returns {Vec3} Goalkeeper dive target in world space.
   */
  static computeTarget(gkStartPos, ballTargetPos, sideSpin, shotPower, maxPower) {
    const powerRatio = shotPower / maxPower;

    // Approximate the horizontal endpoint after spin has curved the shot.
    const realFinalX = ballTargetPos.x + sideSpin;

    // Quantize direction so the keeper can choose a side before the ball arrives.
    let ballDirection = 0;
    if (realFinalX < -0.6) ballDirection = -1;
    else if (realFinalX > 0.6) ballDirection = 1;

    let targetX = 0;
    let targetY = 1.5;

    // More powerful shots give the keeper less time to read the correct corner.
    let guessCorrect = false;

    if (powerRatio < 0.45) {
      guessCorrect = Math.random() < 0.60;
    } else if (powerRatio < 0.75) {
      guessCorrect = Math.random() < 0.40;
    } else {
      guessCorrect = Math.random() < 0.20;
    }

    if (guessCorrect) {
      if (powerRatio < 0.45) {
        // Slow shots allow a more accurate reach toward the real ball path.
        targetX = realFinalX + (Math.random() - 0.5) * 0.4;
        targetY = ballTargetPos.y + (Math.random() - 0.5) * 0.3;
      } else {
        // Faster shots are read by side but not by exact coordinate.
        if (ballDirection === -1) {
          targetX = -1.5 - Math.random() * 2.0;
        } else if (ballDirection === 1) {
          targetX = 1.5 + Math.random() * 2.0;
        } else {
          targetX = (Math.random() - 0.5) * 1.0;
        }
        targetY = ballTargetPos.y + (Math.random() - 0.5) * 0.7;
      }
    } else {
      // Wrong guesses intentionally dive away from the ball direction.
      if (ballDirection === -1) {
        targetX = 1.5 + Math.random() * 1.8;
      } else if (ballDirection === 1) {
        targetX = -1.5 - Math.random() * 1.8;
      } else {
        targetX = Math.random() < 0.5 ? (-1.5 - Math.random() * 1.5) : (1.5 + Math.random() * 1.5);
      }
      targetY = 0.5 + Math.random() * 1.8;
    }

    // Clamp to the modeled goal mouth so the dive remains visually credible.
    targetX = Math.max(-3.5, Math.min(3.5, targetX));
    targetY = Math.max(0.4, Math.min(2.7, targetY));

    return new Vec3(targetX, targetY, gkStartPos.z);
  }

  /**
   * Computes a simple dive interpolation for callers that do not use the full
   * hierarchical goalkeeper animation.
   *
   * @param {number} t - Normalized progress from 0.0 to 1.0.
   * @param {Vec3} start - Initial goalkeeper position.
   * @param {Vec3} target - Dive target position.
   * @returns {{ x: number, y: number, rotationZ: number }} Interpolated pose.
   */
  static interpolate(t, start, target) {
    const x = start.x + (target.x - start.x) * t;
    const y = start.y + (target.y - start.y) * t;
    const diveAngle = (target.x - start.x) * 0.4;
    const rotationZ = -diveAngle * t;

    return { x, y, rotationZ };
  }
}
