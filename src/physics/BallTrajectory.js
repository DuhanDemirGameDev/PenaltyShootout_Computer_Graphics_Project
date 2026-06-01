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

    // Direk ve Üst Direğe Çarpma Fiziği (Post Bounce Simulation)
    // Direk konumları: Sol direk X = -3.66, Sağ direk X = 3.66, Üst direk Y = 3.0.
    // Topun hedef noktası bu direklere çarpmaya yakınsa sekme tetiklenir:
    const hitLeft = Math.abs(target.x - (-3.66)) < 0.35 && target.y < 3.1;
    const hitRight = Math.abs(target.x - 3.66) < 0.35 && target.y < 3.1;
    const hitCrossbar = Math.abs(target.y - 3.0) < 0.35 && Math.abs(target.x) < 3.76;

    if (hitLeft || hitRight || hitCrossbar) {
      const collisionT = 0.90; // Şutun direğe çarpma zaman dilimi
      if (t > collisionT) {
        const tb = (t - collisionT) / (3.5 - collisionT); // Sekme süresini 3.5'e yayıyoruz
        
        // Çarpışma anındaki tam konumlar (t = 0.90 değerleriyle)
        const xCol = (start.x + (target.x - start.x) * collisionT) + (sideSpin * collisionT * collisionT);
        const zCol = start.z + (target.z - start.z) * collisionT;
        const asymmetricArcCol = Math.sin(Math.pow(collisionT, 1.4) * Math.PI);
        const yCol = (start.y + (target.y - start.y) * collisionT)
          + (asymmetricArcCol * arcHeight)
          + (verticalSpin * collisionT * (1.0 - collisionT));

        // 1. Z ekseninde sahaya doğru geri fırlama yansıması
        currentZ = zCol + 8.5 * tb;

        // 2. Çarpılan direğe göre yansıma açısı (X ve Y sekmeleri)
        if (hitLeft) {
          currentX = xCol + 4.5 * tb; // Sol direkten sağa doğru geri seker
          currentY = Math.max(0.3, yCol - 3.0 * tb * tb); // Yerçekimiyle yere düşer
        } else if (hitRight) {
          currentX = xCol - 4.5 * tb; // Sağ direkten sola doğru geri seker
          currentY = Math.max(0.3, yCol - 3.0 * tb * tb);
        } else if (hitCrossbar) {
          // Üst direğe çarpıp hızla yere doğru fırlar
          currentY = Math.max(0.3, yCol - 6.0 * tb * tb);
          currentX = xCol + (target.x - start.x) * 0.5 * tb;
        }
      }
    } else if (t > 1.0) {
      // Direğe çarpmadıysa ve gol olduysa: kale ağlarının içine süzülür ve yerde yuvarlanır
      const timeAfter = t - 1.0;
      
      const isGoalTarget = target.x > -3.55 && target.x < 3.55 && target.y < 2.9;
      if (isGoalTarget) {
        // Ağların içine süzülüş: Z ekseninde geriye süzülür, Y ekseninde yere süzülüp yuvarlanır
        currentZ = target.z + (target.z - start.z) * 0.18 * timeAfter;
        currentY = Math.max(0.3, target.y - 3.2 * timeAfter * timeAfter);
        currentX = target.x + (sideSpin * 1.05);
      } else {
        // Avuta gidiş: kale dışına uçmaya ve yere düşmeye devam eder
        currentZ = start.z + (target.z - start.z) * t;
        currentX = (start.x + (target.x - start.x) * t) + (sideSpin * t * t);
        currentY = Math.max(0.3, currentY - 5.0 * timeAfter * timeAfter);
      }
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
