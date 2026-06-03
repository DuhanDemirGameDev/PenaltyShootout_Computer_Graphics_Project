import { Vec3 } from "../math/Vec3.js";

// ============================================================
// Top Trajektori Hesaplaması
// Şutun başlangıç ve hedef noktası arasındaki interpolasyonu,
// yay yüksekliğini ve spin etkilerini hesaplar.
// ============================================================

export class BallTrajectory {
  /**
   * Verilen ilerleme oranına (t) göre topun 3D pozisyonunu hesaplar.
   *
   * @param {number} t           - İlerleme oranı (0.0 → 1.0)
   * @param {Vec3}   start      - Başlangıç pozisyonu
   * @param {Vec3}   target     - Hedef pozisyonu (crosshair)
   * @param {number} sideSpin   - Yatay spin etkisi
   * @param {number} verticalSpin - Dikey spin etkisi
   * @param {number} arcHeight  - Yay yüksekliği
   * @returns {Vec3} Topun hesaplanan pozisyonu
   */
  static computePosition(t, start, target, sideSpin, verticalSpin, arcHeight) {
    // Top havada uçarken t değerinin 1.0'e kadar olan orijinal kısmı:
    const tClamp = Math.min(1.0, t);
    
    // Orijinal X, Z ve asimetrik Y yay formülleri:
    let currentX = (start.x + (target.x - start.x) * tClamp) + (sideSpin * tClamp * tClamp);
    let currentZ = start.z + (target.z - start.z) * tClamp;
    
    const asymmetricArc = Math.sin(Math.pow(tClamp, 1.4) * Math.PI);
    let currentY = (start.y + (target.y - start.y) * tClamp)
      + (asymmetricArc * arcHeight)
      + (verticalSpin * tClamp * (1.0 - tClamp));

    // ── Post / Crossbar Bounce Detection ─────────────────────────────────────
    // CRITICAL: Detection must use the ball's ACTUAL computed position at the
    // moment of potential impact (t = collisionT), NOT the crosshair target.
    // Using target.x/target.y was wrong because sideSpin shifts the real ball
    // position away from the target, causing false post-hits for wide shots.
    //
    // STEP 1 – Absolute MISS guard (checked first, highest priority)
    //   If the ball's real position at impact is clearly outside the goal frame,
    //   it is a guaranteed MISS. Skip all bounce logic entirely.
    //
    // STEP 2 – Strict POST HIT margins (only if survived Step 1)
    //   Left post band  : x in [-4.0, -3.4]  and y <= 3.3
    //   Right post band : x in [ 3.4,  4.0]  and y <= 3.3
    //   Crossbar band   : y in [ 2.8,  3.3]  and x in (-3.4, 3.4)
    //
    // STEP 3 – GOAL / free flight (handled downstream in Collision.js)

    const collisionT = 0.90;

    // Compute the ball's REAL position at the impact moment (includes sideSpin)
    const xAtImpact = (start.x + (target.x - start.x) * collisionT)
                    + (sideSpin * collisionT * collisionT);
    const asymmetricArcImpact = Math.sin(Math.pow(collisionT, 1.4) * Math.PI);
    const yAtImpact = (start.y + (target.y - start.y) * collisionT)
                    + (asymmetricArcImpact * arcHeight)
                    + (verticalSpin * collisionT * (1.0 - collisionT));

    // STEP 1 — Absolute MISS: ball is clearly outside the goal frame at impact
    const isClearMiss = xAtImpact < -4.0 || xAtImpact > 4.0 || yAtImpact > 3.3;

    // STEP 2 — Strict post/crossbar margins (mutually exclusive, priority order)
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
        const tb = (t - collisionT) / (3.5 - collisionT); // sekme süresini 3.5'e yay

        // Çarpışma anındaki Z konumu
        const zCol = start.z + (target.z - start.z) * collisionT;

        // Z ekseninde sahaya doğru geri fırlama
        currentZ = zCol + 8.5 * tb;

        // Her direğe özgü yansıma açısı
        if (hitLeft) {
          currentX = xAtImpact + 4.5 * tb;  // Sol direkten sağa seker
          currentY = Math.max(0.3, yAtImpact - 3.0 * tb * tb);
        } else if (hitRight) {
          currentX = xAtImpact - 4.5 * tb;  // Sağ direkten sola seker
          currentY = Math.max(0.3, yAtImpact - 3.0 * tb * tb);
        } else { // hitCrossbar
          currentY = Math.max(0.3, yAtImpact - 6.0 * tb * tb);
          currentX = xAtImpact + (target.x - start.x) * 0.5 * tb;
        }
      }
    } else if (!isClearMiss && t > 1.0) {
      // STEP 3 — Ball crossed the goal line without hitting a post.
      // If it's inside the goal mouth, animate it settling into the net.
      const timeAfter = t - 1.0;
      const isGoalTarget = xAtImpact > -3.4 && xAtImpact < 3.4 && yAtImpact < 2.8;
      if (isGoalTarget) {
        currentZ = target.z + (target.z - start.z) * 0.18 * timeAfter;
        currentY = Math.max(0.3, target.y - 3.2 * timeAfter * timeAfter);
        currentX = target.x + (sideSpin * 1.05);
      } else {
        // Wide / high shot — ball continues flying out of bounds
        currentZ = start.z + (target.z - start.z) * t;
        currentX = (start.x + (target.x - start.x) * t) + (sideSpin * t * t);
        currentY = Math.max(0.3, currentY - 5.0 * timeAfter * timeAfter);
      }
    } else if (isClearMiss && t > 1.0) {
      // Guaranteed MISS: ball continues on its natural trajectory, no bouncing
      const timeAfter = t - 1.0;
      currentZ = start.z + (target.z - start.z) * t;
      currentX = (start.x + (target.x - start.x) * t) + (sideSpin * t * t);
      currentY = Math.max(0.3, currentY - 5.0 * timeAfter * timeAfter);
    }

    // Topun zemine gömülmesini önle
    const ballRadius = 0.3;
    const finalY = Math.max(ballRadius, currentY);

    return new Vec3(currentX, finalY, currentZ);
  }

  /**
   * Şut gücü ve spin değerlerine göre süre ve yay yüksekliğini hesaplar.
   *
   * @param {number} shotPower    - Şut gücü (0 → maxPower)
   * @param {number} maxPower     - Maksimum güç değeri
   * @param {number} verticalSpin - Dikey spin
   * @returns {{ shotDuration: number, arcHeight: number }}
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
