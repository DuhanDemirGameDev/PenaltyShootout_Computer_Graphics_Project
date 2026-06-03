/**
 * Centralizes HUD and scoreboard DOM updates for the simulation.
 */
export class UIManager {
  constructor() {
    this.powerContainer = document.getElementById("powerContainer");
    this.powerFill = document.getElementById("powerFill");
    this.gameMessage = document.getElementById("gameMessage");
    this.goalScore = document.getElementById("goalScore");
    this.saveScore = document.getElementById("saveScore");
    this.resetHint = document.getElementById("resetHint");
  }

  showPowerBar() {
    if (this.powerContainer) this.powerContainer.style.display = "block";
  }

  hidePowerBar() {
    if (this.powerContainer) this.powerContainer.style.display = "none";
  }

  /**
   * Updates the visible shot-power fill.
   *
   * @param {number} ratio - Fill ratio from 0.0 to 1.0.
   */
  updatePowerFill(ratio) {
    if (this.powerFill) {
      this.powerFill.style.width = (ratio * 100) + "%";
    }
  }

  /**
   * Shows a large result message.
   *
   * @param {string} text - Message text.
   * @param {string} className - CSS class name such as msg-goal, msg-save, or msg-miss.
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

  /**
   * Updates the persistent goal/save counters.
   *
   * @param {number} goals - Total goals.
   * @param {number} saves - Total saves.
   */
  updateScore(goals, saves) {
    if (this.goalScore) this.goalScore.innerText = goals;
    if (this.saveScore) this.saveScore.innerText = saves;
  }

  showResetHint() {
    if (this.resetHint) this.resetHint.style.display = "block";
  }

  hideResetHint() {
    if (this.resetHint) this.resetHint.style.display = "none";
  }
}
