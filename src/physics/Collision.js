// ============================================================
// Çarpışma / Sonuç Kontrolü
// Şutun sonucunu (GOL / KURTARIŞ / DIŞARI) belirler.
// ============================================================

/**
 * Olası şut sonuçları
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
   * Şutun son pozisyonuna göre sonucu hesaplar.
   *
   * @param {Object} ballPos       - Topun final pozisyonu { x, y, z }
   * @param {Object|null} gkPos    - Kalecinin final pozisyonu { x, y, z }
   * @param {number} shotPower     - Şut gücü
   * @param {number} maxPower      - Maksimum güç
   * @returns {string} ShotResult enum değeri
   */
  static checkShotResult(ballPos, gkPos, shotPower, maxPower) {
    // 1. Kaleci kurtarışı kontrolü
    if (gkPos) {
      const dx = ballPos.x - gkPos.x;
      const dy = ballPos.y - gkPos.y;
      const dz = ballPos.z - gkPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 1.1) {
        const shotPowerRatio = shotPower / maxPower;
        // Sert şutlar %35 ihtimalle kalecinin elinden kaçabilir
        if (shotPowerRatio > 0.7 && Math.random() < 0.35) {
          // Kaleci tutamadı — gol olarak devam eder
        } else {
          return ShotResult.SAVE;
        }
      }
    }

    // ── STEP 1: Absolute MISS guard — highest priority, unconditional early exit
    // If the ball is clearly outside the goal frame at the goal line, it is a
    // guaranteed MISS. Do NOT run any further logic. No post bounce, no goal.
    // These thresholds match the outer limits used in BallTrajectory.js so the
    // two files stay consistent.
    //
    //   x < -4.0  or  x > 4.0  → too wide  (ball flew past the post outer face)
    //   y > 3.3                 → too high   (ball flew over the crossbar)
    if (ballPos.x < -4.0 || ballPos.x > 4.0 || ballPos.y > 3.3) {
      return ShotResult.MISS;
    }

    // ── STEP 2: Post hit zones — post hits are already handled by BallTrajectory.
    // A ball that struck a post is bouncing back toward the field (z is increasing)
    // and will not satisfy the z <= -6.4 goal-line condition below, so no extra
    // check is needed here. The zones are documented for reference:
    //
    //   Left post band  : x in [-4.0, -3.4] and y <= 3.3
    //   Right post band : x in [ 3.4,  4.0] and y <= 3.3
    //   Crossbar band   : y in [ 2.8,  3.3] and x in (-3.4, 3.4)

    // ── STEP 3: GOAL window
    // Ball must have crossed the goal line (z <= -6.4), be inside the inner post
    // faces (|x| < 3.4, matching BallTrajectory's inner boundary), and be between
    // the ground and the crossbar underside (y < 2.8, the crossbar band lower edge).
    const ballRadius = 0.3;
    const inGoalX = ballPos.x > -3.4 && ballPos.x < 3.4;
    const inGoalY = ballPos.y >= ballRadius && ballPos.y < 2.8;

    if (ballPos.z <= -6.4 && inGoalX && inGoalY) {
      return ShotResult.GOAL;
    }

    // Default: anything that survived Step 1 but missed the goal mouth is MISS
    return ShotResult.MISS;
  }
}
