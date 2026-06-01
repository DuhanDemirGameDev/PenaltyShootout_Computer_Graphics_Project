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

    // 2. Kale sınırları içinde mi? (gol kontrolü)
    // Standard FIFA kalesi iç alan ölçüleri: Direkler X: -3.66 ile 3.66 arasındadır. Direk kalınlıklarını düşerek [-3.55, 3.55] yapıyoruz.
    // Üst direk yüksekliği 3.0m, kalınlığı düşerek [0.15, 2.9] yapıyoruz.
    const inGoalX = ballPos.x > -3.55 && ballPos.x < 3.55;
    const inGoalY = ballPos.y > 0.15 && ballPos.y < 2.9;

    if (ballPos.z <= -6.4 && inGoalX && inGoalY) {
      return ShotResult.GOAL;
    }

    // 3. Hiçbiri değilse: dışarı
    return ShotResult.MISS;
  }
}
