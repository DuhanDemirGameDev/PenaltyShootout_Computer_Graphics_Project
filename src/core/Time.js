/**
 * Tracks frame-to-frame timing for animation and simulation updates.
 */
export class Time {
  constructor() {
    this.deltaTime = 0;
    this.elapsedTime = 0;
    this.previousTimestamp = null;
  }

  /**
   * Advances the timer using the timestamp supplied by requestAnimationFrame.
   *
   * @param {number} currentTimestamp - Current high-resolution timestamp in milliseconds.
   */
  update(currentTimestamp) {
    const currentTime = currentTimestamp * 0.001;

    if (this.previousTimestamp === null) {
      this.previousTimestamp = currentTime;
      this.deltaTime = 0;
      return;
    }

    this.deltaTime = currentTime - this.previousTimestamp;
    this.elapsedTime += this.deltaTime;
    this.previousTimestamp = currentTime;
  }
}
