const fragmentShader = /* glsl */ `
    varying vec2 vUv;

    uniform sampler2D uTexture;

    void main() {
        vec4 texture = texture2D(uTexture, vUv);

        // gl_FragColor = vec4( vUv, 0., 1.);
        gl_FragColor = texture;
    }
`;

export default fragmentShader;
