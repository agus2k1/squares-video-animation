const squareFragmentShader = /* glsl */ `
    varying vec2 vUv;
    varying float vDistance;

    void main() {

        gl_FragColor = vec4( 1., 1., 1., 0.9 * vDistance);
    }
`;

export default squareFragmentShader;
