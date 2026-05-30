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
    const currentX = (start.x + (target.x - start.x) * t) + (sideSpin * t * t);
    const currentZ = start.z + (target.z - start.z) * t;

    // Asimetrik yay — topun yükselişi ve düşüşü doğal görünsün
    const asymmetricArc = Math.sin(Math.pow(t, 1.4) * Math.PI);
    const currentY = (start.y + (target.y - start.y) * t)
      + (asymmetricArc * arcHeight)
      + (verticalSpin * t * (1 - t));

    return new Vec3(currentX, currentY, currentZ);
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
