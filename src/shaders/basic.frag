#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec3 uColor;
uniform sampler2D uTexture;
uniform bool uUseTexture;

void main() {
  if (uUseTexture) {
      fragColor = texture(uTexture, vUv); 
  } else {
      fragColor = vec4(uColor, 1.0); 
  }
}
