# Penalty Shootout Simulator

![WebGL](https://img.shields.io/badge/WebGL-raw%20graphics%20pipeline-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-yellow)
![HTML5](https://img.shields.io/badge/HTML5-canvas-orange)
![Computer Graphics](https://img.shields.io/badge/Computer%20Graphics-3D%20simulation-brightgreen)

An interactive 3D penalty shootout simulation built with **pure raw WebGL and modular JavaScript**, without high-level rendering engines such as Three.js, Babylon.js, or Unity. The project implements its own rendering pipeline, mathematical foundation, scene graph, procedural geometry, lighting system, shadow mapping, input handling, gameplay state machine, and physics-inspired shot simulation.

The result is a playable computer graphics application where the user aims a penalty shot, clicks the ball to apply spin, charges shot power, watches the goalkeeper dive through a hierarchical animation system, and dynamically adjusts stadium lighting through a synchronized UI control panel.

---

## Overview

**Penalty Shootout Simulator** was developed as a complete academic WebGL project and as a portfolio-ready demonstration of low-level graphics engineering. Rather than relying on a prebuilt engine, the simulator directly manages WebGL context setup, shader compilation, vertex buffers, textures, transformation matrices, camera projection, lighting uniforms, shadow framebuffers, and real-time animation.

The scene includes a textured football pitch, procedural field lines, a textured football, a modeled goal with net planes, advertisement boards, stadium light towers, a target crosshair, a hierarchical goalkeeper, a scoreboard HUD, a shot power bar, and an interactive lighting/gameplay panel.

---

## Core Features

### Custom Engine Architecture

The project is structured as a compact custom WebGL engine:

- `src/core/WebGLApp.js` initializes the canvas, WebGL context, depth testing, resizing, and framebuffer clearing.
- `src/core/ShaderProgram.js` compiles GLSL shaders, links programs, caches uniforms/attributes, and uploads matrices, vectors, textures, booleans, and scalar values.
- `src/core/Geometry.js` manages vertex buffers, normal buffers, UV buffers, index buffers, and draw calls.
- `src/core/Scene.js` owns renderable objects and lights, performs scene updates, renders the color pass, and recursively renders the shadow depth pass.
- `src/core/GameObject.js` provides the reusable object abstraction used by the ball, goal, goalkeeper, ground, lights, crosshair, and ad boards.

The engine is supported by a proprietary math layer:

- `src/math/Vec3.js` implements vector arithmetic, normalization, dot products, and cross products.
- `src/math/Mat4.js` implements identity, translation, rotation, scaling, perspective projection, camera look-at matrices, matrix multiplication, vector transformation, and matrix inversion.
- `src/math/Transform.js` implements local/world transform composition and parent-child transform relationships.

This architecture keeps rendering, math, physics, scene objects, interaction, and UI logic separated into clear modules.

### Procedural 3D Modeling

The simulator uses procedural mesh generators instead of relying on imported engine primitives:

- `Plane` for the pitch and goal nets.
- `Sphere` for the football and goalkeeper head.
- `Cylinder` for posts, crossbars, and stadium light poles.
- `Cuboid` for body parts, field lines, boards, supports, panels, and structural elements.
- `Torus` for the red target crosshair.

Textured materials are loaded through `TextureLoader` and applied to the grass, football, goal net, and advertisement boards.

### Hierarchical Modeling

The goalkeeper is the strongest hierarchical model in the project. It is assembled as a parent-child transform cascade:

```text
Goalkeeper Root
+-- Torso
    +-- Head
    +-- Left Shoulder
    |   +-- Left Arm
    |       +-- Left Glove
    +-- Right Shoulder
    |   +-- Right Arm
    |       +-- Right Glove
    +-- Left Hip
    |   +-- Left Leg
    |       +-- Left Shoe
    +-- Right Hip
        +-- Right Leg
            +-- Right Shoe
```

Each child transform inherits the matrix of its parent. Rotating a shoulder moves the entire arm and glove; rotating a hip moves the leg and shoe. The goalkeeper dive animation combines root translation, jump arc, body roll, torso lean, shoulder extension, hip motion, and ready-pose restoration. This demonstrates a true hierarchical matrix cascade rather than independent object placement.

### Physics & Collision

The gameplay system is organized around a finite-state machine:

```text
READY -> CHARGING -> SHOOTING -> FINISHED
```

The physics and interaction pipeline includes:

- **Mouse picking:** `MousePicker` converts 2D mouse coordinates into a world-space ray using inverse projection and inverse view matrices, then solves a ray-sphere intersection against the football.
- **Spin from click position:** clicking different parts of the ball generates side spin and vertical spin from the hit offset on the sphere.
- **Shot power charging:** holding the mouse increases shot power, affecting speed and arc height.
- **Impact-time trajectory calculation:** `BallTrajectory` computes the ball's true position at impact, including interpolation, side spin, asymmetric vertical arc, and vertical spin.
- **Procedural shot animation:** the ball curves, dips, spins, and settles into the net or deflects away from the frame.
- **Goalkeeper save logic:** the goalkeeper chooses a dive target and can deflect the ball back into the field during the active save window.

Collision and result evaluation are deliberately strict and mutually exclusive:

1. **Absolute miss guard:** shots clearly outside the goal frame are immediately classified as misses.
2. **Post/crossbar bands:** only tight physical impact zones trigger a bounce from the posts or crossbar.
3. **Goal window:** only shots inside the inner frame and beyond the goal line count as goals.

This prevents overlapping states such as a shot being both wide and a post hit, and keeps the visual trajectory synchronized with the logical result.

### Lighting & Shadows

The stadium lighting system includes four dynamic `Spotlight` objects and four visible light tower models. The UI can select a tower, adjust its X/Y/Z position, control global intensity, set sweep speed, and enable or disable each tower.

Rendering uses a two-pass shadow mapping pipeline:

1. **Depth pass:** each enabled light renders the scene into its own `ShadowMap` depth framebuffer.
2. **Color pass:** the main shader samples the shadow maps while computing textured Phong lighting.

The main shader supports:

- Ambient, diffuse, and specular lighting.
- Distance attenuation.
- Texture sampling.
- Four light positions and colors.
- Four shadow maps.
- 3x3 percentage-closer filtering for softer shadow tests.
- UI-synchronized light enable states and movement parameters.

This gives the scene dynamic spatial grounding and demonstrates an advanced real-time rendering technique in raw WebGL.

---

## Team & Roles

| Team Member | Role |
|---|---|
| **Duhan Demir** | Core Engine & Architecture |
| **Zeynep Gerçekdoğan** | 3D Modeler & Scene Architect |
| **Barış Yaman** | Gameplay Programmer & Animator |

---

## Project Structure

```text
PenaltyShootout_Computer_Graphics_Project/
+-- index.html
+-- style.css
+-- README.md
+-- assets/
|   +-- textures/
+-- src/
    +-- core/          # WebGL app, shader program, scene, geometry, camera, time, GameObject
    +-- geometry/      # Procedural Plane, Sphere, Cylinder, Cuboid, Cone, Torus
    +-- interaction/   # Input, camera controls, mouse picking, game state machine
    +-- lighting/      # Light, Spotlight, ShadowMap
    +-- math/          # Vec3, Mat4, Transform
    +-- objects/       # Ball, GoalPost, Goalkeeper, Ground, StadiumLights, AdBoards, Crosshair
    +-- physics/       # Ball trajectory, collision logic, goalkeeper dive
    +-- shaders/       # GLSL shader sources
    +-- ui/            # UI manager and slider helpers
    +-- utils/         # Texture and OBJ loading utilities
```

---

## Installation & Running

No build step is required. The project runs as a static WebGL application through a local server.

### 1. Clone or open the project directory

```bash
cd PenaltyShootout_Computer_Graphics_Project
```

### 2. Start a local static server

Using Python:

```bash
python -m http.server 8000
```

If your system uses `python3`:

```bash
python3 -m http.server 8000
```

### 3. Open the simulator

```text
http://localhost:8000/
```

Do not open `index.html` directly from the file system. Browser ES modules and texture loading should be served through HTTP.

---

## Controls

### Gameplay

| Input | Action |
|---|---|
| **Arrow Keys** | Move the target crosshair inside the goal area |
| **Left Mouse Click on Ball** | Select the ball and begin charging the shot |
| **Hold Left Mouse Button** | Increase shot power |
| **Release Left Mouse Button** | Shoot |
| **Click Different Ball Regions** | Apply side spin or vertical spin |
| **Space** | Reset after a completed shot |

### Camera

| Input | Action |
|---|---|
| **W / A / S / D** | Move the camera orbit target across the field |
| **Right Mouse Drag** | Orbit the camera around the scene |
| **Mouse Wheel** | Zoom in or out |

### UI Panel

| Control | Action |
|---|---|
| **Goalkeeper Position X** | Move the goalkeeper before shooting |
| **Spotlight Intensity** | Adjust global stadium light brightness |
| **Spotlight Sweep Speed** | Control automatic light movement |
| **Select Tower** | Choose which light tower to edit |
| **Position X/Y/Z Sliders** | Move the selected light tower |
| **Active Tower Toggles** | Enable or disable individual lights |

---

## Academic Highlights

- Fully interactive 3D scene rendered with raw WebGL.
- Custom vector, matrix, and transform hierarchy implementation.
- Procedural mesh generation for multiple morphologies.
- Texture mapping across field, ball, net, and boards.
- Hierarchical goalkeeper model with joint-based animation.
- Raycasting-based mouse picking through inverse camera/projection matrices.
- Impact-time collision logic synchronized with visual ball trajectory.
- Multi-light dynamic Phong shading.
- Four-shadow-map two-pass rendering pipeline.
- Modular ES-module architecture suitable for extension and review.

---

## Technical Requirements

- A modern browser with WebGL2 support.
- A local static server for ES modules and texture loading.
- No external rendering engine required.

Recommended browsers:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox

---

## License

This project was developed for academic computer graphics coursework and portfolio demonstration. Add a repository license before public reuse or distribution.
