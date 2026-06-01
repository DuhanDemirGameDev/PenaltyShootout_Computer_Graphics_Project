import { Vec3 } from "../math/Vec3.js";

// ============================================================
// Orbit Kamera Kontrolleri
// Sağ tıklayıp sürükleyerek kamerayı stadyum etrafında döndürür.
// Scroll ile yakınlaşma/uzaklaşma (zoom) sağlar.
// Pitch ve distance sınırlandırması (clamp) uygulanır.
// ============================================================

export class CameraControls {
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;

    // Orbit merkezi
    this.target = new Vec3(0, 1, -2);

    // Küresel koordinatlar
    this.yaw = 0;
    this.pitch = 0.32;
    this.distance = 32;

    // Sınırlar
    this.minPitch = 0.05;
    this.maxPitch = Math.PI / 2 - 0.05;
    this.minDistance = 8;
    this.maxDistance = 55;

    this.sensitivity = 0.005;
    this.zoomSpeed = 0.05;

    this._isDragging = false;
    this._lastX = 0;
    this._lastY = 0;

    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onCtx = (e) => e.preventDefault();

    canvas.addEventListener("mousedown", this._onMouseDown);
    window.addEventListener("mousemove", this._onMouseMove);
    window.addEventListener("mouseup", this._onMouseUp);
    canvas.addEventListener("wheel", this._onWheel, { passive: false });
    canvas.addEventListener("contextmenu", this._onCtx);

    this.update();
  }

  _onMouseDown(e) {
    if (e.button === 2) {
      this._isDragging = true;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
    }
  }

  _onMouseMove(e) {
    if (!this._isDragging) return;
    const dx = e.clientX - this._lastX;
    const dy = e.clientY - this._lastY;
    this._lastX = e.clientX;
    this._lastY = e.clientY;

    this.yaw -= dx * this.sensitivity;
    this.pitch += dy * this.sensitivity;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
  }

  _onMouseUp(e) {
    if (e.button === 2) this._isDragging = false;
  }

  _onWheel(e) {
    e.preventDefault();
    this.distance += e.deltaY * this.zoomSpeed;
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
  }

  update(input, deltaTime = 0.016) {
    if (input) {
      const speed = 18.0; // Kamera kaydırma hızı
      const forward = this.camera.front;
      const right = forward.cross(this.camera.up).normalize();

      // Standart oyunlardaki gibi yatay (XZ) düzlemde hareket etmek için vektörleri projekte ediyoruz
      let forwardXZ = new Vec3(forward.x, 0, forward.z);
      if (forwardXZ.length() > 0.001) {
        forwardXZ = forwardXZ.normalize();
      } else {
        forwardXZ = new Vec3(0, 0, -1);
      }

      let rightXZ = new Vec3(right.x, 0, right.z);
      if (rightXZ.length() > 0.001) {
        rightXZ = rightXZ.normalize();
      } else {
        rightXZ = new Vec3(1, 0, 0);
      }

      let moveDir = new Vec3(0, 0, 0);
      if (input.isKeyDown("KeyW")) {
        moveDir = moveDir.add(forwardXZ);
      }
      if (input.isKeyDown("KeyS")) {
        moveDir = moveDir.subtract(forwardXZ);
      }
      if (input.isKeyDown("KeyD")) {
        moveDir = moveDir.add(rightXZ);
      }
      if (input.isKeyDown("KeyA")) {
        moveDir = moveDir.subtract(rightXZ);
      }

      if (moveDir.length() > 0) {
        moveDir = moveDir.normalize();
        this.target = this.target.add(moveDir.multiply(speed * deltaTime));
      }
    }

    const x = this.distance * Math.cos(this.pitch) * Math.sin(this.yaw);
    const y = this.distance * Math.sin(this.pitch);
    const z = this.distance * Math.cos(this.pitch) * Math.cos(this.yaw);

    this.camera.position = new Vec3(
      this.target.x + x,
      this.target.y + y,
      this.target.z + z
    );
    this.camera.target = this.target;
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this._onMouseDown);
    window.removeEventListener("mousemove", this._onMouseMove);
    window.removeEventListener("mouseup", this._onMouseUp);
    this.canvas.removeEventListener("wheel", this._onWheel);
    this.canvas.removeEventListener("contextmenu", this._onCtx);
  }
}
