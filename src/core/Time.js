export class Time {
  constructor() {
    this.deltaTime = 0;
    this.elapsedTime = 0;
    this.previousTimestamp = null;
  }

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
