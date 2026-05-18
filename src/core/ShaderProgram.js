export class ShaderProgram {
  constructor(gl, vertexSource, fragmentSource) {
    this.gl = gl;
    this.program = null;
    this.uniformLocations = new Map();
    this.attribLocations = new Map();

    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource, "vertex");
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource, "fragment");

    this.program = this.linkProgram(vertexShader, fragmentShader);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  }

  compileShader(type, source, label) {
    const { gl } = this;
    const shader = gl.createShader(type);

    if (!shader) {
      throw new Error(`Could not create ${label} shader.`);
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const infoLog = gl.getShaderInfoLog(shader) || "No shader info log available.";
      console.error(`Failed to compile ${label} shader:\n${infoLog}`);
      console.error(`Source for failed ${label} shader:\n${source}`);
      gl.deleteShader(shader);
      throw new Error(`Shader compilation failed for ${label} shader.`);
    }

    return shader;
  }

  linkProgram(vertexShader, fragmentShader) {
    const { gl } = this;
    const program = gl.createProgram();

    if (!program) {
      throw new Error("Could not create WebGL shader program.");
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const infoLog = gl.getProgramInfoLog(program) || "No program info log available.";
      console.error(`Failed to link shader program:\n${infoLog}`);
      gl.deleteProgram(program);
      throw new Error("Shader program linking failed.");
    }

    return program;
  }

  use() {
    this.gl.useProgram(this.program);
  }

  getUniformLocation(name) {
    if (!this.uniformLocations.has(name)) {
      const location = this.gl.getUniformLocation(this.program, name);

      if (location === null) {
        console.warn(`Uniform "${name}" was not found in the active shader program.`);
      }

      this.uniformLocations.set(name, location);
    }

    return this.uniformLocations.get(name);
  }

  getAttribLocation(name, warnIfMissing = true) {
    if (!this.attribLocations.has(name)) {
      const location = this.gl.getAttribLocation(this.program, name);

      if (location === -1 && warnIfMissing) {
        console.warn(`Attribute "${name}" was not found in the active shader program.`);
      }

      this.attribLocations.set(name, location);
    }

    return this.attribLocations.get(name);
  }

  setMat4(name, matrix) {
    const location = this.getUniformLocation(name);

    if (location !== null) {
      this.gl.uniformMatrix4fv(location, false, matrix);
    }
  }

  setVec3(name, vector) {
    const location = this.getUniformLocation(name);

    if (location !== null) {
      if (Array.isArray(vector) || vector instanceof Float32Array) {
        this.gl.uniform3fv(location, vector);
      } else {
        this.gl.uniform3f(location, vector.x, vector.y, vector.z);
      }
    }
  }

  setFloat(name, value) {
    const location = this.getUniformLocation(name);

    if (location !== null) {
      this.gl.uniform1f(location, value);
    }
  }

  setInt(name, value) {
    const location = this.getUniformLocation(name);

    if (location !== null) {
      this.gl.uniform1i(location, value);
    }
  }

  delete() {
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
      this.uniformLocations.clear();
      this.attribLocations.clear();
    }
  }
}
