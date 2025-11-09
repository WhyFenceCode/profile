uniform sampler2D iChannel1;
uniform vec2 iResolution;
uniform vec4 iMouse;
uniform int iFrame;
varying vec2 vUv;

const float delta = 1.0;

void main() {
    vec2 fragCoord = vUv * iResolution;

    if (iFrame == 0) {
        gl_FragColor = vec4(0.0);
        return;
    }

    vec2 texel = vec2(1.0) / iResolution;

    float pressure = texture(iChannel1, vUv).x;
    float pVel = texture(iChannel1, vUv).y;

    float p_right = texture(iChannel1, vUv + vec2(2.0 * texel.x, 0.0)).x;
    float p_left = texture(iChannel1, vUv - vec2(2.0 * texel.x, 0.0)).x;
    float p_up = texture(iChannel1, vUv + vec2(0.0, 2.0 * texel.y)).x;
    float p_down = texture(iChannel1, vUv - vec2(0.0, 2.0 * texel.y)).x;

    // Apply horizontal wave function
    pVel += delta * (-2.0 * pressure + p_right + p_left) / 4.0;
    // Apply vertical wave function
    pVel += delta * (-2.0 * pressure + p_up + p_down) / 4.0;

    // Update pressure
    pressure += delta * pVel;

    // Spring motion
    pVel -= 0.005 * delta * pressure;

    // Velocity damping
    pVel *= 0.99;

    // Pressure damping
    pressure *= 0.999;

    // Gradient calculation
    vec2 grad = vec2((p_right - p_left) / 2.0, (p_up - p_down) / 2.0);

    // Mouse interaction
    if (iMouse.z > 1.0) {
        float dist = distance(fragCoord, iMouse.xy);
        if (dist <= 20.0) {
            pressure += 1.0 - dist / 20.0;
        }
    }

    gl_FragColor = vec4(pressure, pVel, grad.x, grad.y);
}