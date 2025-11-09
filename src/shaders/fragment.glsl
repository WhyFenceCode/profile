uniform sampler2D iChannel0;
uniform vec2 iResolution;
uniform float iTime;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec3 tex = texture2D(iChannel0, uv).rgb;
  // Optional: simple wave distortion
  uv.y += 0.02 * sin(10.0 * uv.x + iTime);
  tex = texture2D(iChannel0, uv).rgb;
  gl_FragColor = vec4(tex, 1.0);
}