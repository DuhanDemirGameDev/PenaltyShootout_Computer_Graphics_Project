export class WebGLApp {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);

    if (!this.canvas) {
      throw new Error(`Canvas element with id "${canvasId}" was not found.`);
    }

    this.clearColor = options.clearColor ?? [0.03, 0.06, 0.09, 1.0];
    this.pixelRatioLimit = options.pixelRatioLimit ?? 2;
    this.gl = this.createContext();
    this.isWebGL2 = typeof WebGL2RenderingContext !== "undefined"
      && this.gl instanceof WebGL2RenderingContext;

    this.handleResize = this.handleResize.bind(this);

    this.configureContext();
    this.handleResize();
    window.addEventListener("resize", this.handleResize);
  }

  createContext() {
    const contextAttributes = {
      alpha: false,
      antialias: true,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: false,
    };

    const gl = this.canvas.getContext("webgl2", contextAttributes)
      ?? this.canvas.getContext("webgl", contextAttributes)
      ?? this.canvas.getContext("experimental-webgl", contextAttributes);

    if (!gl) {
      throw new Error("WebGL is not supported by this browser or device.");
    }

    return gl;
  }

  configureContext() {
    const { gl } = this;

    gl.clearColor(...this.clearColor);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearDepth(1.0);
  }

  handleResize() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, this.pixelRatioLimit);
    const displayWidth = Math.floor(this.canvas.clientWidth * pixelRatio);
    const displayHeight = Math.floor(this.canvas.clientHeight * pixelRatio);

    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
    }

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  destroy() {
    window.removeEventListener("resize", this.handleResize);
  }
}
