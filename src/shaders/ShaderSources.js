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
uniform mat4 uLightSpaceMatrix0;
uniform mat4 uLightSpaceMatrix1;
uniform mat4 uLightSpaceMatrix2;
uniform mat4 uLightSpaceMatrix3;

out vec2 vUv;
out vec3 vNormal;
out vec3 vWorldPos;
out vec4 vShadowCoord0;
out vec4 vShadowCoord1;
out vec4 vShadowCoord2;
out vec4 vShadowCoord3;

void main() {
  vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = mat3(uModelMatrix) * aNormal;
  vUv = aUv;
  
  vShadowCoord0 = uLightSpaceMatrix0 * worldPos;
  vShadowCoord1 = uLightSpaceMatrix1 * worldPos;
  vShadowCoord2 = uLightSpaceMatrix2 * worldPos;
  vShadowCoord3 = uLightSpaceMatrix3 * worldPos;
  
  gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
`;

export const basicFragmentShader = `#version 300 es
precision highp float;

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPos;
in vec4 vShadowCoord0;
in vec4 vShadowCoord1;
in vec4 vShadowCoord2;
in vec4 vShadowCoord3;

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

// Çoklu Gölgeler
uniform sampler2D uShadowMap0;
uniform sampler2D uShadowMap1;
uniform sampler2D uShadowMap2;
uniform sampler2D uShadowMap3;

uniform bool uShadowEnabled0;
uniform bool uShadowEnabled1;
uniform bool uShadowEnabled2;
uniform bool uShadowEnabled3;

float calcShadow(sampler2D shadowMap, vec4 sc) {
  vec3 proj = sc.xyz / sc.w;
  proj = proj * 0.5 + 0.5;
  if (proj.x < 0.0 || proj.x > 1.0 ||
      proj.y < 0.0 || proj.y > 1.0 ||
      proj.z > 1.0) return 0.0;

  float current = proj.z;
  float bias = 0.0015; // PCF için uygun bias değeri
  float shadow = 0.0;

  // 3x3 PCF Filtreleme
  vec2 texelSize = 1.0 / vec2(textureSize(shadowMap, 0));
  for (int x = -1; x <= 1; ++x) {
    for (int y = -1; y <= 1; ++y) {
      float closest = texture(shadowMap, proj.xy + vec2(x, y) * texelSize).r;
      if (current - bias > closest) {
        shadow += 1.0;
      }
    }
  }
  shadow /= 9.0;

  return shadow * 0.85; // Gölge şiddetini 0.85 yaparak daha belirgin ve gerçekçi gölgeler oluşturuyoruz
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
  vec3 ambient = 0.08 * baseColor;

  // Diffuse + Specular (tüm ışıklardan ayrı ayrı gölge etkisiyle toplanır)
  vec3 diffuseSum = vec3(0.0);
  vec3 specularSum = vec3(0.0);

  // Işık 0
  if (uNumLights > 0) {
    float shadow = uShadowEnabled0 ? calcShadow(uShadowMap0, vShadowCoord0) : 0.0;
    vec3 L = normalize(uLightPos[0] - vWorldPos);
    float diff = max(dot(N, L), 0.0);
    float dist = length(uLightPos[0] - vWorldPos);
    float atten = 1.0 / (1.0 + 0.007 * dist + 0.0002 * dist * dist);
    diffuseSum += (1.0 - shadow) * diff * uLightColor[0] * uLightIntensity * atten;
    
    vec3 R = reflect(-L, N);
    float spec = pow(max(dot(V, R), 0.0), 32.0);
    specularSum += (1.0 - shadow) * spec * uLightColor[0] * uLightIntensity * 0.25 * atten;
  }

  // Işık 1
  if (uNumLights > 1) {
    float shadow = uShadowEnabled1 ? calcShadow(uShadowMap1, vShadowCoord1) : 0.0;
    vec3 L = normalize(uLightPos[1] - vWorldPos);
    float diff = max(dot(N, L), 0.0);
    float dist = length(uLightPos[1] - vWorldPos);
    float atten = 1.0 / (1.0 + 0.007 * dist + 0.0002 * dist * dist);
    diffuseSum += (1.0 - shadow) * diff * uLightColor[1] * uLightIntensity * atten;
    
    vec3 R = reflect(-L, N);
    float spec = pow(max(dot(V, R), 0.0), 32.0);
    specularSum += (1.0 - shadow) * spec * uLightColor[1] * uLightIntensity * 0.25 * atten;
  }

  // Işık 2
  if (uNumLights > 2) {
    float shadow = uShadowEnabled2 ? calcShadow(uShadowMap2, vShadowCoord2) : 0.0;
    vec3 L = normalize(uLightPos[2] - vWorldPos);
    float diff = max(dot(N, L), 0.0);
    float dist = length(uLightPos[2] - vWorldPos);
    float atten = 1.0 / (1.0 + 0.007 * dist + 0.0002 * dist * dist);
    diffuseSum += (1.0 - shadow) * diff * uLightColor[2] * uLightIntensity * atten;
    
    vec3 R = reflect(-L, N);
    float spec = pow(max(dot(V, R), 0.0), 32.0);
    specularSum += (1.0 - shadow) * spec * uLightColor[2] * uLightIntensity * 0.25 * atten;
  }

  // Işık 3
  if (uNumLights > 3) {
    float shadow = uShadowEnabled3 ? calcShadow(uShadowMap3, vShadowCoord3) : 0.0;
    vec3 L = normalize(uLightPos[3] - vWorldPos);
    float diff = max(dot(N, L), 0.0);
    float dist = length(uLightPos[3] - vWorldPos);
    float atten = 1.0 / (1.0 + 0.007 * dist + 0.0002 * dist * dist);
    diffuseSum += (1.0 - shadow) * diff * uLightColor[3] * uLightIntensity * atten;
    
    vec3 R = reflect(-L, N);
    float spec = pow(max(dot(V, R), 0.0), 32.0);
    specularSum += (1.0 - shadow) * spec * uLightColor[3] * uLightIntensity * 0.25 * atten;
  }

  vec3 result = ambient + diffuseSum * baseColor + specularSum;
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
