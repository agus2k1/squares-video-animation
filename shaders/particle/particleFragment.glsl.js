const particleFragment = /* glsl */ `
    varying vec2 vUv;

    void main() {

        gl_FragColor = vec4( 1., 1., 1., 0.6);
    }
`;

export default particleFragment;
