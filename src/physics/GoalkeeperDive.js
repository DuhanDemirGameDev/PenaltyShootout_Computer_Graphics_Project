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
   * @param {number} shotPower        - Şut gücü
   * @param {number} maxPower         - Maksimum şut gücü
   * @returns {Vec3} Kalecinin dalış hedef pozisyonu
   */
  static computeTarget(gkStartPos, ballTargetPos, sideSpin, shotPower, maxPower) {
    const powerRatio = shotPower / maxPower;

    // Topun gidiş yönü boyunca Z=0'dan Z=-7'ye giderken spin (falso) etkisiyle son yatay konumu
    const realFinalX = ballTargetPos.x + sideSpin;

    // Topun gittiği yön: -1 (sol), 0 (orta), 1 (sağ)
    let ballDirection = 0;
    if (realFinalX < -0.6) ballDirection = -1;
    else if (realFinalX > 0.6) ballDirection = 1;

    let targetX = 0;
    let targetY = 1.5;

    // Kullanıcının belirttiği oranlar:
    // Zayıf şutlarda %60, Orta şutlarda %40, Sert şutlarda %20 doğru köşeyi tahmin etme ihtimali
    let guessCorrect = false;

    if (powerRatio < 0.45) { // Weak shot: higher chance to guess correctly
      guessCorrect = Math.random() < 0.60;
    } else if (powerRatio < 0.75) {
      guessCorrect = Math.random() < 0.40;
    } else {
      guessCorrect = Math.random() < 0.20;
    }

    if (guessCorrect) {
      // Doğru köşeye atlama!
      if (powerRatio < 0.45) {
        // Zayıf şut: Yüksek hassasiyetle topun gidiş noktasına yakın uzanır
        targetX = realFinalX + (Math.random() - 0.5) * 0.4;
        targetY = ballTargetPos.y + (Math.random() - 0.5) * 0.3;
      } else {
        // Orta veya Sert şut: Doğru tarafa atlar ama hedefe tam hassasiyetle ulaşamayabilir
        if (ballDirection === -1) {
          targetX = -1.5 - Math.random() * 2.0; // -1.5 ile -3.5 arası (sol köşe)
        } else if (ballDirection === 1) {
          targetX = 1.5 + Math.random() * 2.0;  // 1.5 ile 3.5 arası (sağ köşe)
        } else {
          targetX = (Math.random() - 0.5) * 1.0;
        }
        targetY = ballTargetPos.y + (Math.random() - 0.5) * 0.7;
      }
    } else {
      // Yanlış köşeye atlama (Ters köşe)
      if (ballDirection === -1) {
        targetX = 1.5 + Math.random() * 1.8; // Top sola gidiyor, sağa atlıyor
      } else if (ballDirection === 1) {
        targetX = -1.5 - Math.random() * 1.8; // Top sağa gidiyor, sola atlıyor
      } else {
        // Top ortaya gidiyor, kaleci herhangi bir yöne rastgele atlıyor
        targetX = Math.random() < 0.5 ? (-1.5 - Math.random() * 1.5) : (1.5 + Math.random() * 1.5);
      }
      targetY = 0.5 + Math.random() * 1.8;
    }

    // Kalecinin kale çizgisi dışına çıkmasını önle
    targetX = Math.max(-3.5, Math.min(3.5, targetX));
    targetY = Math.max(0.4, Math.min(2.7, targetY));

    return new Vec3(targetX, targetY, gkStartPos.z);
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
