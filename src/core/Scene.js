export class Scene {
  constructor({ camera = null } = {}) {
    this.objects = [];
    this.lights = [];
    this.camera = camera;
  }

  add(object) {
    this.objects.push(object);
    return object;
  }

  addLight(light) {
    this.lights.push(light);
    return light;
  }

  update(deltaTime) {
    for (const object of this.objects) {
      object.update?.(deltaTime);
    }
  }

  /** Işık uniform'larını shader'a gönder */
  _applyLightUniforms(shaderProgram) {
    shaderProgram.setInt("uNumLights", this.lights.length);

    for (let i = 0; i < this.lights.length; i++) {
      this.lights[i].setUniforms(shaderProgram, i);
    }

    // Global intensity — tüm ışıklar tek slider ile kontrol edilir
    if (this.lights.length > 0) {
      shaderProgram.setFloat("uLightIntensity", this.lights[0].intensity);
    }

    // Kamera pozisyonu (specular hesabı için)
    if (this.camera) {
      shaderProgram.setVec3("uCameraPos", this.camera.position);
    }
  }

  /** Normal render pass */
  render(gl, shaderProgram) {
    if (this.camera && shaderProgram) {
      shaderProgram.setMat4("uViewMatrix", this.camera.getViewMatrix().elements);
      shaderProgram.setMat4("uProjectionMatrix", this.camera.getProjectionMatrix().elements);
      this._applyLightUniforms(shaderProgram);
    }

    for (const object of this.objects) {
      object.render?.(gl, shaderProgram, this.camera);
    }
  }

  /** Shadow depth pass — sadece derinlik yazılır */
  renderDepthPass(gl, depthShader) {
    for (const object of this.objects) {
      this._renderObjectDepth(gl, depthShader, object);
    }
  }

  /** @private Recursive depth render */
  _renderObjectDepth(gl, shader, object) {
    if (!object.visible) return;

    object.transform.updateWorldMatrix();

    if (object.geometry) {
      shader.setMat4("uModelMatrix", object.transform.worldMatrix.elements);
      object.geometry.draw(shader);
    }

    // Alt nesneleri de çiz (StadiumLights, GoalPost, Goalkeeper gibi hiyerarşik objeler)
    if (object.childrenObjects) {
      for (const child of object.childrenObjects) {
        this._renderObjectDepth(gl, shader, child);
      }
    }
  }
}
