// ============================================================
// Shader Kaynak Kodları
// Phong Aydınlatma + Gölge Haritalama (Shadow Mapping) destekli.
// ============================================================

// ---------- ANA SHADER (Phong + Shadow) ----------

export const basicVertexShader = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aNormal;
in vec2 aUv;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uLightSpaceMatrix;

out vec2 vUv;
out vec3 vNormal;
out vec3 vWorldPos;
out vec4 vShadowCoord;

void main() {
  vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = mat3(uModelMatrix) * aNormal;
  vUv = aUv;
  vShadowCoord = uLightSpaceMatrix * worldPos;
  gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
`;

export const basicFragmentShader = `#version 300 es
precision highp float;

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPos;
in vec4 vShadowCoord;

out vec4 fragColor;

// Materyal
uniform vec3 uColor;
uniform sampler2D uTexture;
uniform bool uUseTexture;

// Aydınlatma
#define MAX_LIGHTS 4
uniform vec3 uLightPos[MAX_LIGHTS];
uniform vec3 uLightColor[MAX_LIGHTS];
uniform float uLightIntensity;
uniform int uNumLights;
uniform vec3 uCameraPos;

// Gölge
uniform sampler2D uShadowMap;
uniform bool uShadowEnabled;

float calcShadow(vec4 sc) {
  vec3 proj = sc.xyz / sc.w;
  proj = proj * 0.5 + 0.5;
  if (proj.x < 0.0 || proj.x > 1.0 ||
      proj.y < 0.0 || proj.y > 1.0 ||
      proj.z > 1.0) return 0.0;

  float closest = texture(uShadowMap, proj.xy).r;
  float current = proj.z;
  float bias = 0.005;
  return (current - bias > closest) ? 0.55 : 0.0;
}

void main() {
  // Temel renk
  vec3 baseColor;
  if (uUseTexture) {
    baseColor = texture(uTexture, vUv).rgb;
  } else {
    baseColor = uColor;
  }

  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCameraPos - vWorldPos);

  // Ambient
  vec3 ambient = 0.18 * baseColor;

  // Diffuse + Specular (tüm ışıklardan)
  vec3 diffuse = vec3(0.0);
  vec3 specular = vec3(0.0);

  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uNumLights) break;

    vec3 L = normalize(uLightPos[i] - vWorldPos);
    float diff = max(dot(N, L), 0.0);

    // Uzaklık zayıflaması
    float dist = length(uLightPos[i] - vWorldPos);
    float atten = 1.0 / (1.0 + 0.007 * dist + 0.0002 * dist * dist);

    diffuse += diff * uLightColor[i] * uLightIntensity * atten;

    // Specular (Phong yansıma)
    vec3 R = reflect(-L, N);
    float spec = pow(max(dot(V, R), 0.0), 32.0);
    specular += spec * uLightColor[i] * uLightIntensity * 0.25 * atten;
  }

  // Gölge
  float shadow = uShadowEnabled ? calcShadow(vShadowCoord) : 0.0;

  vec3 result = ambient + (1.0 - shadow) * (diffuse * baseColor + specular);
  result = min(result, vec3(1.0));

  fragColor = vec4(result, 1.0);
}
`;

// ---------- GÖLGE DERİNLİK SHADER'I ----------

export const shadowVertexShader = `#version 300 es
precision highp float;

in vec3 aPosition;

uniform mat4 uModelMatrix;
uniform mat4 uLightSpaceMatrix;

void main() {
  gl_Position = uLightSpaceMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
`;

export const shadowFragmentShader = `#version 300 es
precision highp float;

void main() {
  // Derinlik otomatik olarak depth buffer'a yazılır.
  // WebGL2 çıktı gerektirmez ama uyumluluk için boş bırakıyoruz.
}
`;
