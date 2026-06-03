/**
 * Possible shot outcomes.
 *
 * @readonly
 * @enum {string}
 */
export const ShotResult = {
  GOAL: "GOAL",
  SAVE: "SAVE",
  MISS: "MISS",
};

export class Collision {
  /**
   * Classifies the shot result using keeper distance and strict goal geometry.
   *
   * @param {{ x: number, y: number, z: number }} ballPos - Evaluated ball position.
   * @param {{ x: number, y: number, z: number } | null} gkPos - Goalkeeper position.
   * @param {number} shotPower - Shot power used for save probability.
   * @param {number} maxPower - Maximum shot power.
   * @returns {string} A value from {@link ShotResult}.
   */
  static checkShotResult(ballPos, gkPos, shotPower, maxPower) {
    // Save evaluation runs before goal classification because a keeper touch
    // can legally stop an otherwise on-target shot.
    if (gkPos) {
      const dx = ballPos.x - gkPos.x;
      const dy = ballPos.y - gkPos.y;
      const dz = ballPos.z - gkPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 1.1) {
        const shotPowerRatio = shotPower / maxPower;
        if (shotPowerRatio > 0.7 && Math.random() < 0.35) {
          // Powerful shots may deflect through the keeper and continue.
        } else {
          return ShotResult.SAVE;
        }
      }
    }

    // STEP 1: Absolute miss guard, with no post or goal fallback.
    // If the ball is clearly outside the goal frame at the goal line, it is a
    // guaranteed miss. No post-bounce or goal logic should run afterward.
    // These thresholds match the outer limits used in BallTrajectory.js so the
    // two files stay consistent.
    //
    //   x < -4.0 or x > 4.0: too wide.
    //   y > 3.3: too high.
    if (ballPos.x < -4.0 || ballPos.x > 4.0 || ballPos.y > 3.3) {
      return ShotResult.MISS;
    }

    // STEP 2: Post hit zones are already handled by BallTrajectory.
    // A ball that struck a post is bouncing back toward the field (z is increasing)
    // and will not satisfy the z <= -6.4 goal-line condition below, so no extra
    // check is needed here. The zones are documented for reference:
    //
    //   Left post band  : x in [-4.0, -3.4] and y <= 3.3
    //   Right post band : x in [ 3.4,  4.0] and y <= 3.3
    //   Crossbar band   : y in [ 2.8,  3.3] and x in (-3.4, 3.4)

    // STEP 3: Goal window.
    // Ball must have crossed the goal line (z <= -6.4), be inside the inner post
    // faces (|x| < 3.4, matching BallTrajectory's inner boundary), and be between
    // the ground and the crossbar underside (y < 2.8, the crossbar band lower edge).
    const ballRadius = 0.3;
    const inGoalX = ballPos.x > -3.4 && ballPos.x < 3.4;
    const inGoalY = ballPos.y >= ballRadius && ballPos.y < 2.8;

    if (ballPos.z <= -6.4 && inGoalX && inGoalY) {
      return ShotResult.GOAL;
    }

    // Default: anything that survived Step 1 but missed the goal mouth is a miss.
    return ShotResult.MISS;
  }
}
