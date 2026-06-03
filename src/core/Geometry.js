/**
 * Owns WebGL buffers for indexed or non-indexed mesh geometry.
 */
export class Geometry {
  /**
   * Uploads geometry arrays to GPU buffers.
   *
   * @param {WebGLRenderingContext|WebGL2RenderingContext} gl - Rendering context.
   * @param {Object} [data] - Mesh data arrays.
   * @param {number[]} [data.positions] - Vertex positions as xyz triples.
   * @param {number[]} [data.normals] - Vertex normals as xyz triples.
   * @param {number[]} [data.uvs] - Texture coordinates as uv pairs.
   * @param {number[]} [data.indices] - Triangle index buffer.
   */
  constructor(gl, {
    positions = [],
    normals = [],
    uvs = [],
    indices = [],
  } = {}) {
    this.gl = gl;
    this.vertexCount = positions.length / 3;
    this.indexCount = indices.length;
    this.indexType = null;
    this.buffers = {
      position: this.createArrayBuffer(positions),
      normal: normals.length > 0 ? this.createArrayBuffer(normals) : null,
      uv: uvs.length > 0 ? this.createArrayBuffer(uvs) : null,
      index: indices.length > 0 ? this.createIndexBuffer(indices) : null,
    };
  }

  createArrayBuffer(data) {
    const buffer = this.gl.createBuffer();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

    return buffer;
  }

  /**
   * Creates an index buffer and selects the smallest supported index type.
   *
   * @param {number[]} data - Triangle indices.
   * @returns {WebGLBuffer} GPU element array buffer.
   */
  createIndexBuffer(data) {
    const buffer = this.gl.createBuffer();
    let maxIndex = 0;

    for (const index of data) {
      if (index > maxIndex) {
        maxIndex = index;
      }
    }

    const needsUint32 = maxIndex > 65535;
    const supportsUint32 = (typeof WebGL2RenderingContext !== "undefined"
      && this.gl instanceof WebGL2RenderingContext)
      || this.gl.getExtension("OES_element_index_uint");

    if (needsUint32 && !supportsUint32) {
      throw new Error("This geometry needs Uint32 indices, but the browser does not support them.");
    }

    const IndexArray = needsUint32 ? Uint32Array : Uint16Array;
    this.indexType = needsUint32 ? this.gl.UNSIGNED_INT : this.gl.UNSIGNED_SHORT;

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new IndexArray(data), this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

    return buffer;
  }

  /**
   * Binds a vertex attribute if both the buffer and shader attribute are available.
   *
   * @param {ShaderProgram} shaderProgram - Active shader program wrapper.
   * @param {string} attributeName - Attribute name in the GLSL program.
   * @param {?WebGLBuffer} buffer - GPU buffer to bind.
   * @param {number} size - Number of scalar components per vertex.
   * @param {boolean} [warnIfMissing] - Whether to warn when the attribute is absent.
   */
  bindAttribute(shaderProgram, attributeName, buffer, size, warnIfMissing = false) {
    if (!buffer) {
      return;
    }

    const location = shaderProgram.getAttribLocation(attributeName, warnIfMissing);

    if (location === -1) {
      return;
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.enableVertexAttribArray(location);
    this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
  }

  /**
   * Binds all mesh buffers required by the supplied shader program.
   *
   * @param {ShaderProgram} shaderProgram - Active shader program wrapper.
   */
  bind(shaderProgram) {
    this.bindAttribute(shaderProgram, "aPosition", this.buffers.position, 3, true);
    this.bindAttribute(shaderProgram, "aNormal", this.buffers.normal, 3);
    this.bindAttribute(shaderProgram, "aUv", this.buffers.uv, 2);

    if (this.buffers.index) {
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);
    }
  }

  /**
   * Draws the mesh using triangles.
   *
   * @param {ShaderProgram} shaderProgram - Active shader program wrapper.
   */
  draw(shaderProgram) {
    this.bind(shaderProgram);

    if (this.buffers.index) {
      this.gl.drawElements(this.gl.TRIANGLES, this.indexCount, this.indexType, 0);
    } else {
      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexCount);
    }
  }

  /**
   * Releases all GPU buffers owned by this geometry.
   */
  delete() {
    for (const buffer of Object.values(this.buffers)) {
      if (buffer) {
        this.gl.deleteBuffer(buffer);
      }
    }
  }
}
