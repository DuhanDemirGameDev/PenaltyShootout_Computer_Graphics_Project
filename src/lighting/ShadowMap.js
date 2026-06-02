// ============================================================
// Gölge Haritası (Shadow Map)
// Depth-only FBO oluşturur.
// Light pass'ta sahne bu FBO'ya çizilir, normal pass'ta
// derinlik texture'ı gölge testi için örneklenir.
// ============================================================

export class ShadowMap {
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {number} width  — Gölge haritası çözünürlüğü
   * @param {number} height
   */
  constructor(gl, width = 1024, height = 1024) {
    this.gl = gl;
    this.width = width;
    this.height = height;

    // Depth Texture
    this.depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24,
      width, height, 0,
      gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Framebuffer
    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D, this.depthTexture, 0
    );

    // Renk çıktısı yok — sadece derinlik yazılacak
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error("Shadow FBO incomplete:", status);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /** Light pass başlangıcı: FBO'ya bağlan ve temizle */
  bind() {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.viewport(0, 0, this.width, this.height);
    gl.clear(gl.DEPTH_BUFFER_BIT);
  }

  /** Light pass sonu: varsayılan framebuffer'a dön */
  unbind(canvasWidth, canvasHeight) {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvasWidth, canvasHeight);
  }

  /** Fragment shader'a gönderilecek derinlik texture'ı */
  getDepthTexture() {
    return this.depthTexture;
  }
}
