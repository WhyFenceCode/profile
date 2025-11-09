uniform sampler2D prevState;   // simulation texture (pressure + velocity)
uniform sampler2D iChannel0;   // captured canvas
uniform vec2 iResolution;
uniform float iTime;
uniform vec4 iMouse;
varying vec2 vUv;

const float delta = 1.0;

void main() {
    vec2 texel = 1.0 / iResolution;

    // --- Simulation: read neighboring pixels ---
    vec4 center = texture2D(prevState, vUv);
    vec4 right  = texture2D(prevState, vUv + vec2(texel.x*2.0, 0.0));
    vec4 left   = texture2D(prevState, vUv - vec2(texel.x*2.0, 0.0));
    vec4 up     = texture2D(prevState, vUv + vec2(0.0, texel.y*2.0));
    vec4 down   = texture2D(prevState, vUv - vec2(0.0, texel.y*2.0));

    float pressure = center.x;
    float pVel     = center.y;

    // Update velocity based on neighbors
    pVel += delta * (-2.0 * pressure + right.x + left.x) / 4.0;
    pVel += delta * (-2.0 * pressure + up.x + down.x) / 4.0;

    // Update pressure
    pressure += delta * pVel;

    // Damping / spring
    pVel -= 0.005 * delta * pressure;
    pVel *= 0.99;
    pressure *= 0.999;

    // --- Mouse disturbance ---
    vec2 mouseUV = iMouse.xy / iResolution.xy;
    if (iMouse.z > 0.0) {
        float dist = distance(vUv, mouseUV);
        if (dist < 0.02) {
            pressure += 0.02 * (0.02 - dist);
        }
    }

    // --- Compute gradient for smooth displacement ---
    float gradX = (right.x - left.x) * 0.5;
    float gradY = (up.x - down.x) * 0.5;
    vec2 displacement = vec2(gradX, gradY);

    // --- Distort the captured canvas ---
    vec2 uv = vUv + displacement * 0.03; // tweak amplitude for effect
    vec3 color = texture2D(iChannel0, uv).rgb;

    // Output: display + store simulation in .xy
    gl_FragColor = vec4(pressure, pVel, color.r, 1.0); 
}
