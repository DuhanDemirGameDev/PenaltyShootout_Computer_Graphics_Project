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
    // FIX (Issue 2): Sınırlar GoalPost.js fiziksel boyutlarıyla eşleştirildi.
    // GoalPost kökü Z = -7.0 konumundadır.
    // Sol direk merkezi X = -3.66, Sağ direk merkezi X = 3.66 (yarıçap = 0.1)
    // Üst direk merkezi Y = 3.0 (yarıçap = 0.1)
    // Top yarıçapı (0.3) hesaba katılarak iç kenarlar kullanılıyor:
    //   X sınırı: -(3.66 - 0.1 - 0.3) = -3.26 ile +(3.66 - 0.1 - 0.3) = +3.26
    //   Y sınırı: (0.3) ile (3.0 - 0.1 - 0.3) = 2.6
    // GoalPost root Z = -7.0, top Z bu noktayı geçtiğinde (< -7.0'e yakın) gol
    const ballRadius = 0.3;
    const postRadius = 0.1;
    const goalLineZ = -7.0;
    const goalHalfWidth = 3.66;  // GoalPost.js: crossbarWidth / 2 = 7.32 / 2
    const crossbarHeight = 3.0;  // GoalPost.js: postHeight

    const inGoalX = ballPos.x > -(goalHalfWidth - postRadius - ballRadius)
                 && ballPos.x < (goalHalfWidth - postRadius - ballRadius);
    const inGoalY = ballPos.y > ballRadius
                 && ballPos.y < (crossbarHeight - postRadius - ballRadius);

    if (ballPos.z <= -6.4 && inGoalX && inGoalY) {
      return ShotResult.GOAL;
    }



    // 3. Hiçbiri değilse: dışarı
    return ShotResult.MISS;
  }
}
