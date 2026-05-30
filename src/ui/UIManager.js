// ============================================================
// UI Yöneticisi
// HTML arayüz elemanlarının tüm DOM işlemlerini merkezi olarak yönetir.
// ============================================================

export class UIManager {
  constructor() {
    this.powerContainer = document.getElementById("powerContainer");
    this.powerFill = document.getElementById("powerFill");
    this.gameMessage = document.getElementById("gameMessage");
    this.goalScore = document.getElementById("goalScore");
    this.saveScore = document.getElementById("saveScore");
    this.resetHint = document.getElementById("resetHint");
  }

  // --- Güç Barı ---

  showPowerBar() {
    if (this.powerContainer) this.powerContainer.style.display = "block";
  }

  hidePowerBar() {
    if (this.powerContainer) this.powerContainer.style.display = "none";
  }

  /**
   * Güç barının doluluk oranını günceller.
   * @param {number} ratio - 0.0 ile 1.0 arası doluluk oranı
   */
  updatePowerFill(ratio) {
    if (this.powerFill) {
      this.powerFill.style.width = (ratio * 100) + "%";
    }
  }

  // --- Ekran Mesajları ---

  /**
   * Ekrana büyük popup yazı basar.
   * @param {string} text      - Gösterilecek metin
   * @param {string} className - CSS sınıfı (msg-goal, msg-save, msg-miss)
   */
  showScreenMessage(text, className) {
    if (this.gameMessage) {
      this.gameMessage.innerText = text;
      this.gameMessage.className = className + " show";
    }
  }

  hideScreenMessage() {
    if (this.gameMessage) {
      this.gameMessage.className = "";
    }
  }

  // --- Skor Tabelası ---

  /**
   * Gol ve kurtarış sayılarını günceller.
   * @param {number} goals - Toplam gol sayısı
   * @param {number} saves - Toplam kurtarış sayısı
   */
  updateScore(goals, saves) {
    if (this.goalScore) this.goalScore.innerText = goals;
    if (this.saveScore) this.saveScore.innerText = saves;
  }

  // --- Reset İpucu ---

  showResetHint() {
    if (this.resetHint) this.resetHint.style.display = "block";
  }

  hideResetHint() {
    if (this.resetHint) this.resetHint.style.display = "none";
  }
}
