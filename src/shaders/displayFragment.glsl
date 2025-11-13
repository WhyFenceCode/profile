uniform sampler2D textureA;
uniform sampler2D textureB;
varying vec2 vUv;

void main() {
    vec2 uv = vUv;

    vec4 data = texture2D(textureA, uv);

    vec2 distortion = 0.3 * data.zw;
    vec4 color = texture2D(textureB, uv + distortion);

    vec3 normal = normalize(vec3(-data.z * 0.2, 0.5, -data.w * 0.2));
    vec3 lightDir = normalize(vec3(-3.0, 10.0, 3.0));
    float specular = pow(max(0.0, dot(normal, lightDir)), 60.0) * 0.5;

    gl_FragColor = color + vec4(vec3(specular), 0.0);
}