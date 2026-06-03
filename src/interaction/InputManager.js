/**
 * Normalizes keyboard and mouse input for per-frame gameplay systems.
 */
export class InputManager {
  /**
   * Registers input listeners for the supplied canvas.
   *
   * @param {HTMLCanvasElement} canvas - Canvas receiving pointer input.
   */
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

  /**
   * Records an active key and marks first-frame key presses.
   *
   * @param {KeyboardEvent} event - Browser keyboard event.
   */
  handleKeyDown(event) {
    if (!this.keys.get(event.code)) {
      this.keysPressedThisFrame.add(event.code);
    }

    this.keys.set(event.code, true);
  }

  /**
   * Records a released key.
   *
   * @param {KeyboardEvent} event - Browser keyboard event.
   */
  handleKeyUp(event) {
    this.keys.set(event.code, false);
  }

  /**
   * Updates pointer coordinates after mouse movement.
   *
   * @param {MouseEvent} event - Browser mouse event.
   */
  handleMouseMove(event) {
    this.updateMousePosition(event);
  }

  /**
   * Begins a mouse-button interaction and stores the click for this frame.
   *
   * @param {MouseEvent} event - Browser mouse event.
   */
  handleMouseDown(event) {
    this.updateMousePosition(event);
    this.mouse.isDown = true;
    this.mouse.button = event.button;
    this.mouseClickedThisFrame = true;
  }

  /**
   * Ends the active mouse-button interaction.
   *
   * @param {MouseEvent} event - Browser mouse event.
   */
  handleMouseUp(event) {
    this.updateMousePosition(event);
    this.mouse.isDown = false;
    this.mouse.button = event.button;
  }

  /**
   * Updates canvas-local and normalized device coordinates for the mouse.
   *
   * @param {MouseEvent} event - Browser mouse event.
   */
  updateMousePosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.ndcX = rect.width > 0 ? (x / rect.width) * 2 - 1 : 0;
    this.mouse.ndcY = rect.height > 0 ? 1 - (y / rect.height) * 2 : 0;
  }

  /**
   * @param {string} keyCode - KeyboardEvent.code value.
   * @returns {boolean} True when the key is currently held down.
   */
  isKeyDown(keyCode) {
    return this.keys.get(keyCode) === true;
  }

  /**
   * @param {string} keyCode - KeyboardEvent.code value.
   * @returns {boolean} True only on the first frame of a key press.
   */
  wasKeyPressed(keyCode) {
    return this.keysPressedThisFrame.has(keyCode);
  }

  /**
   * @returns {boolean} True only on the frame when a mouse button was pressed.
   */
  wasMouseClicked() {
    return this.mouseClickedThisFrame;
  }

  /**
   * @returns {{x: number, y: number, ndcX: number, ndcY: number}} Current mouse position.
   */
  getMousePosition() {
    return {
      x: this.mouse.x,
      y: this.mouse.y,
      ndcX: this.mouse.ndcX,
      ndcY: this.mouse.ndcY,
    };
  }

  /**
   * Clears transient input state after the frame has been processed.
   */
  endFrame() {
    this.keysPressedThisFrame.clear();
    this.mouseClickedThisFrame = false;
  }

  /**
   * Removes all browser event listeners owned by the input manager.
   */
  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
  }
}
