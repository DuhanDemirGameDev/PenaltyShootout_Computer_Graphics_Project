import { Vec3 } from "../math/Vec3.js";

// ============================================================
// Kaleci Dalış Hesaplaması
// Kalecinin hedef pozisyonunu ve dalış interpolasyonunu yönetir.
// ============================================================

export class GoalkeeperDive {
  /**
   * Kalecinin dalış hedef pozisyonunu hesaplar.
   * Topun hedefine göre tahmin hatası ekleyerek gerçekçi bir hedef belirler.
   *
   * @param {Vec3}   gkStartPos       - Kalecinin başlangıç pozisyonu
   * @param {Vec3}   ballTargetPos    - Topun hedef pozisyonu
   * @param {number} sideSpin         - Topun yatay spin değeri
   * @returns {Vec3} Kalecinin dalış hedef pozisyonu
   */
  static computeTarget(gkStartPos, ballTargetPos, sideSpin) {
    // FIX (Issue 1): Kaleci topu tahmin ETMEZ — kale sınırları içinde tamamen rastgele
    // bir konuma dalış yapar. Bu, gerçekçi bir "tahmin" davranışı simüle eder.
    // X: Kale genişliği içinde rastgele bir nokta (-3.0 ile 3.0 arası)
    const randomX = -3.0 + Math.random() * 6.0;

    // Y: Kale yüksekliği içinde rastgele bir nokta (0.5 ile 2.5 arası)
    const randomY = 0.5 + Math.random() * 2.0;

    return new Vec3(randomX, randomY, gkStartPos.z);
  }

  /**
   * Kalecinin dalış sırasındaki pozisyon ve rotasyonunu hesaplar.
   *
   * @param {number} t          - İlerleme oranı (0.0 → 1.0)
   * @param {Vec3}   start     - Başlangıç pozisyonu
   * @param {Vec3}   target    - Hedef pozisyonu
   * @returns {{ x: number, y: number, rotationZ: number }}
   */
  static interpolate(t, start, target) {
    const x = start.x + (target.x - start.x) * t;
    const y = start.y + (target.y - start.y) * t;
    const diveAngle = (target.x - start.x) * 0.4;
    const rotationZ = -diveAngle * t;

    return { x, y, rotationZ };
  }
}
