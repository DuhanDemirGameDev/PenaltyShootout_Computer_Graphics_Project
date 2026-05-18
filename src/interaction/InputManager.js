export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Map();
    this.keysPressedThisFrame = new Set();
    this.mouseClickedThisFrame = false;

    this.mouse = {
      x: 0,
      y: 0,
      ndcX: 0,
      ndcY: 0,
      isDown: false,
      button: null,
    };

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
  }

  handleKeyDown(event) {
    if (!this.keys.get(event.code)) {
      this.keysPressedThisFrame.add(event.code);
    }

    this.keys.set(event.code, true);
  }

  handleKeyUp(event) {
    this.keys.set(event.code, false);
  }

  handleMouseMove(event) {
    this.updateMousePosition(event);
  }

  handleMouseDown(event) {
    this.updateMousePosition(event);
    this.mouse.isDown = true;
    this.mouse.button = event.button;
    this.mouseClickedThisFrame = true;
  }

  handleMouseUp(event) {
    this.updateMousePosition(event);
    this.mouse.isDown = false;
    this.mouse.button = event.button;
  }

  updateMousePosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.ndcX = rect.width > 0 ? (x / rect.width) * 2 - 1 : 0;
    this.mouse.ndcY = rect.height > 0 ? 1 - (y / rect.height) * 2 : 0;
  }

  isKeyDown(keyCode) {
    return this.keys.get(keyCode) === true;
  }

  wasKeyPressed(keyCode) {
    return this.keysPressedThisFrame.has(keyCode);
  }

  wasMouseClicked() {
    return this.mouseClickedThisFrame;
  }

  getMousePosition() {
    return {
      x: this.mouse.x,
      y: this.mouse.y,
      ndcX: this.mouse.ndcX,
      ndcY: this.mouse.ndcY,
    };
  }

  endFrame() {
    this.keysPressedThisFrame.clear();
    this.mouseClickedThisFrame = false;
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
  }
}
