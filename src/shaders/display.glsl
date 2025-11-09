uniform vec2 iResolution;
uniform sampler2D prevState;
uniform sampler2D iChannel0;
varying vec2 vUv;

void main() {
    vec2 uv = vUv;

    vec4 data = texture2D(prevState, uv);

    // Color = texture displaced by water height
    vec4 color = texture2D(iChannel0, uv + 0.2 * data.zw);

    // Sunlight glint
    vec3 normal = normalize(vec3(-data.z, 0.2, -data.w));
    vec3 lightDir = normalize(vec3(-3.0, 10.0, 3.0));
    color += vec4(1.0) * pow(max(0.0, dot(normal, lightDir)), 60.0);

    gl_FragColor = color;
}