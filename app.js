import './main.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import fragment from './shaders/fragment.glsl.js';
import vertex from './shaders/vertex.glsl.js';
import squareFragmentShader from './shaders/square/squareFragment.glsl.js';
import squareVertexShader from './shaders/square/squareVertex.glsl.js';
import particleFragment from './shaders/particle/particleFragment.glsl.js';
import particleVertex from './shaders/particle/particleVertex.glsl.js';

export default class Sketch {
  constructor() {
    this.scene = new THREE.Scene();
    this.container = document.getElementById('container');
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.useLegacyLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();

    this.time = 0;
    this.count = 40;
    this.pointer = { x: 0, y: 0 };

    this.mouseEvents();
    this.addMesh();
    this.addSquares();
    this.addPoints();
    this.addLines();
    this.setupResize();
    this.resize();
    this.render();
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    // image cover
    this.imageAspect = 1080 / 1920;
    let a1;
    let a2;
    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = this.height / this.width / this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    // optional - cover with quad
    const distance = this.camera.position.z;
    const height = 0.9;
    this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * distance));

    // if (w/h > 1)
    if (this.width / this.height > 1) {
      this.plane.scale.x = this.camera.aspect;
    } else {
      this.plane.scale.y = 1 / this.camera.aspect;
    }

    this.camera.updateProjectionMatrix();
  }

  mouseEvents() {
    window.addEventListener('pointermove', (e) => {
      // calculate pointer position in normalized device coordinates
      // (-1 to +1) for both components

      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  addPoints() {
    this.pointsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        resolution: { value: new THREE.Vector4() },
      },
      fragmentShader: particleFragment,
      vertexShader: particleVertex,
      side: THREE.DoubleSide,
      transparent: true,
      // wireframe: true,
    });

    this.pointsGeometry = new THREE.BufferGeometry();
    let vertices = [];

    for (let x = -this.count / 2; x < this.count / 2; x++) {
      for (let y = -this.count / 2; y < this.count / 2; y++) {
        vertices.push(x / 10 + 0.05, y / 10 + 0.05, 0);
      }
    }

    this.pointsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    this.particles = new THREE.Points(this.pointsGeometry, this.pointsMaterial);
    this.particles.position.z = 0.01;
    this.scene.add(this.particles);
  }

  addLines() {
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
    });
    let points = [];

    for (let i = -this.count / 2; i < this.count / 2; i++) {
      points.push(new THREE.Vector3(-5, i / 10 + 0.05, 0));
      points.push(new THREE.Vector3(5, i / 10 + 0.05, 0));
    }

    for (let i = -this.count / 2; i < this.count / 2; i++) {
      points.push(new THREE.Vector3(i / 10 + 0.05, -5, 0));
      points.push(new THREE.Vector3(i / 10 + 0.05, 5, 0));
    }

    this.lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

    this.lines = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
    this.lines.position.z = 0.005;
    this.scene.add(this.lines);
  }

  addSquares() {
    this.squareMaterial = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable',
      },
      uniforms: {
        uTime: { value: 0 },
        resolution: { value: new THREE.Vector4() },
        uMouse: { value: new THREE.Vector3() },
      },
      fragmentShader: squareFragmentShader,
      vertexShader: squareVertexShader,
      side: THREE.DoubleSide,
      transparent: true,
      // wireframe: true,
    });

    this.squareGeometry = new THREE.PlaneGeometry(0.1, 0.1);

    this.squares = new THREE.InstancedMesh(
      this.squareGeometry,
      this.squareMaterial,
      this.count ** 2
    );

    this.squares.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    let dummy = new THREE.Object3D();
    let index = 0;

    for (let x = -this.count / 2; x < this.count / 2; x++) {
      for (let y = -this.count / 2; y < this.count / 2; y++) {
        dummy.position.set(x / 10, y / 10, 0);

        dummy.updateMatrix();

        this.squares.setMatrixAt(index++, dummy.matrix);
      }
    }

    this.squares.instanceMatrix.needsUpdate = true;
    this.squares.computeBoundingSphere();

    this.squares.position.z = 0.006;
    this.scene.add(this.squares);
  }

  addMesh() {
    const video = document.getElementById('video');
    const texture = new THREE.VideoTexture(video);

    video.play();

    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable',
      },
      uniforms: {
        uTime: { value: 0 },
        resolution: { value: new THREE.Vector4() },
        uTexture: { value: texture },
      },
      fragmentShader: fragment,
      vertexShader: vertex,
      side: THREE.DoubleSide,
      // wireframe: true,
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  render() {
    this.time += 0.05;

    // update the picking ray with the camera and pointer position
    this.raycaster.setFromCamera(this.pointer, this.camera);

    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects([this.plane]);

    if (intersects.length > 0) {
      // console.log(intersects[0].point);
      this.squareMaterial.uniforms.uMouse.value = intersects[0].point;
    } else {
      this.squareMaterial.uniforms.uMouse.value = [0, 0, 0];
    }

    // Scene rotation
    this.scene.rotation.x = -this.pointer.y / 10;
    this.scene.rotation.y = this.pointer.x / 10;

    this.material.uniforms.uTime.value = this.time;
    this.squareMaterial.uniforms.uTime.value = this.time;
    this.pointsMaterial.uniforms.uTime.value = this.time;
    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch();
