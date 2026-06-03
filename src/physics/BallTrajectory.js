import { Vec3 } from "../math/Vec3.js";

/**
 * Provides deterministic ball-flight equations for penalty shots.
 */
export class BallTrajectory {
  /**
   * Computes the ball position at a normalized shot progress value.
   *
   * @param {number} t - Shot progress. Values greater than 1.0 continue the post-impact animation.
   * @param {Vec3} start - Initial ball position.
   * @param {Vec3} target - Crosshair target position.
   * @param {number} sideSpin - Horizontal spin contribution.
   * @param {number} verticalSpin - Vertical spin contribution.
   * @param {number} arcHeight - Peak trajectory height.
   * @returns {Vec3} Ball position in world space.
   */
  static computePosition(t, start, target, sideSpin, verticalSpin, arcHeight) {
    // The primary flight equation is clamped to the moment the ball reaches the goal plane.
    const tClamp = Math.min(1.0, t);
    
    // Side spin curves horizontally, while the asymmetric sine arc creates a late dip.
    let currentX = (start.x + (target.x - start.x) * tClamp) + (sideSpin * tClamp * tClamp);
    let currentZ = start.z + (target.z - start.z) * tClamp;
    
    const asymmetricArc = Math.sin(Math.pow(tClamp, 1.4) * Math.PI);
    let currentY = (start.y + (target.y - start.y) * tClamp)
      + (asymmetricArc * arcHeight)
      + (verticalSpin * tClamp * (1.0 - tClamp));

    // Post and crossbar detection must use the ball's actual computed position
    // at the moment of potential impact, not the original crosshair target.
    // Side spin can move the physical ball away from the aimed target.
    //
    // STEP 1: Absolute miss guard.
    //   If the real impact position is clearly outside the goal frame, the shot
    //   is a guaranteed miss and bounce logic is skipped.
    //
    // STEP 2: Strict post-hit margins.
    //   Left post band  : x in [-4.0, -3.4]  and y <= 3.3
    //   Right post band : x in [ 3.4,  4.0]  and y <= 3.3
    //   Crossbar band   : y in [ 2.8,  3.3]  and x in (-3.4, 3.4)
    //
    // STEP 3: Goal or free flight, handled downstream in Collision.js.

    const collisionT = 0.90;

    // Compute the real position at the impact moment, including accumulated spin.
    const xAtImpact = (start.x + (target.x - start.x) * collisionT)
                    + (sideSpin * collisionT * collisionT);
    const asymmetricArcImpact = Math.sin(Math.pow(collisionT, 1.4) * Math.PI);
    const yAtImpact = (start.y + (target.y - start.y) * collisionT)
                    + (asymmetricArcImpact * arcHeight)
                    + (verticalSpin * collisionT * (1.0 - collisionT));

    // STEP 1: the ball is clearly outside the goal frame at impact.
    const isClearMiss = xAtImpact < -4.0 || xAtImpact > 4.0 || yAtImpact > 3.3;

    // STEP 2: post and crossbar bands are mutually exclusive by priority.
    const hitLeft = !isClearMiss
                 && xAtImpact >= -4.0 && xAtImpact <= -3.4
                 && yAtImpact <= 3.3;

    const hitRight = !isClearMiss && !hitLeft
                  && xAtImpact >= 3.4 && xAtImpact <= 4.0
                  && yAtImpact <= 3.3;

    const hitCrossbar = !isClearMiss && !hitLeft && !hitRight
                     && yAtImpact >= 2.8 && yAtImpact <= 3.3
                     && xAtImpact > -3.4 && xAtImpact < 3.4;

    if (hitLeft || hitRight || hitCrossbar) {
      if (t > collisionT) {
        const tb = (t - collisionT) / (3.5 - collisionT);

        // Preserve the actual collision depth before reflecting the ball.
        const zCol = start.z + (target.z - start.z) * collisionT;

        // Reflect back toward the pitch after the frame impact.
        currentZ = zCol + 8.5 * tb;

        // Each goal-frame surface has a distinct visual rebound.
        if (hitLeft) {
          currentX = xAtImpact + 4.5 * tb;
          currentY = Math.max(0.3, yAtImpact - 3.0 * tb * tb);
        } else if (hitRight) {
          currentX = xAtImpact - 4.5 * tb;
          currentY = Math.max(0.3, yAtImpact - 3.0 * tb * tb);
        } else {
          currentY = Math.max(0.3, yAtImpact - 6.0 * tb * tb);
          currentX = xAtImpact + (target.x - start.x) * 0.5 * tb;
        }
      }
    } else if (!isClearMiss && t > 1.0) {
      // STEP 3: Ball crossed the goal line without hitting a post.
      // If it's inside the goal mouth, animate it settling into the net.
      const timeAfter = t - 1.0;
      const isGoalTarget = xAtImpact > -3.4 && xAtImpact < 3.4 && yAtImpact < 2.8;
      if (isGoalTarget) {
        currentZ = target.z + (target.z - start.z) * 0.18 * timeAfter;
        currentY = Math.max(0.3, target.y - 3.2 * timeAfter * timeAfter);
        currentX = target.x + (sideSpin * 1.05);
      } else {
        // Wide or high shots continue flying out of bounds.
        currentZ = start.z + (target.z - start.z) * t;
        currentX = (start.x + (target.x - start.x) * t) + (sideSpin * t * t);
        currentY = Math.max(0.3, currentY - 5.0 * timeAfter * timeAfter);
      }
    } else if (isClearMiss && t > 1.0) {
      // Guaranteed misses continue on the natural trajectory with no bounce.
      const timeAfter = t - 1.0;
      currentZ = start.z + (target.z - start.z) * t;
      currentX = (start.x + (target.x - start.x) * t) + (sideSpin * t * t);
      currentY = Math.max(0.3, currentY - 5.0 * timeAfter * timeAfter);
    }

    // Keep the ball resting on the pitch instead of sinking below it.
    const ballRadius = 0.3;
    const finalY = Math.max(ballRadius, currentY);

    return new Vec3(currentX, finalY, currentZ);
  }

  /**
   * Computes duration and arc parameters from shot power and vertical spin.
   *
   * @param {number} shotPower - Shot power from 0 to maxPower.
   * @param {number} maxPower - Maximum power value.
   * @param {number} verticalSpin - Vertical spin contribution.
   * @returns {{ shotDuration: number, arcHeight: number }} Shot timing parameters.
   */
  static computeShotParams(shotPower, maxPower, verticalSpin) {
    let shotDuration = 1.2 - (shotPower / maxPower) * 0.85;
    let arcHeight = 1.2 + (shotPower * 0.4);

    if (verticalSpin < -0.5) {
      arcHeight *= 0.1;
    }

    return { shotDuration, arcHeight };
  }
}
