"use client";
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import WebGPU from "three/examples/jsm/capabilities/WebGPU.js";
// import WebGPURenderer from "three/examples/jsm/renderers/webgpu/WebGPURenderer";
import * as S from "styles/components/gameControls";

const ThreeComponent: React.FC = () => {
  const mountRef = useRef<HTMLCanvasElement>(null);
  const [movementV, setMovementV] = useState(0.05);
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // 렌더러
    const renderer = new THREE.WebGLRenderer({
      canvas: mountRef.current,
      antialias: true,
    });
    renderer.shadowMap.enabled = true;
    // const renderer = new WebGPURenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);
    const controls = new OrbitControls(camera, renderer.domElement);

    type Position = {
      x: number;
      y: number;
      z: number;
    };

    type Velocity = Position;

    class Box extends THREE.Mesh {
      boxWidth: number;
      boxHeight: number;
      boxDepth: number;
      bottom: number;
      top: number;
      left: number;
      right: number;
      front: number;
      back: number;
      velocity: Velocity;
      gravity: number;
      zAcceleration: boolean;

      constructor({
        width,
        height,
        depth,
        color = "#00ff00",
        velocity = {
          x: 0,
          y: 0,
          z: 0,
        },
        position = {
          x: 0,
          y: 0,
          z: 0,
        },
        zAcceleration = false,
      }: {
        width: number;
        height: number;
        depth: number;
        color?: string;
        velocity?: Velocity;
        position?: Position;
        zAcceleration?: boolean;
      }) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ color });
        super(geometry, material);

        this.boxWidth = width;
        this.boxHeight = height;
        this.boxDepth = depth;

        this.position.set(position.x, position.y, position.z);

        this.bottom = this.position.y - this.boxHeight / 2;
        this.top = this.position.y + this.boxHeight / 2;

        this.left = this.position.x - this.boxWidth / 2;
        this.right = this.position.x + this.boxWidth / 2;

        this.front = this.position.z + this.boxDepth / 2;
        this.back = this.position.z - this.boxDepth / 2;

        this.velocity = velocity;
        this.gravity = -0.002;

        this.zAcceleration = zAcceleration;
      }
      updateSides() {
        this.bottom = this.position.y - this.boxHeight / 2;
        this.top = this.position.y + this.boxHeight / 2;

        this.left = this.position.x - this.boxWidth / 2;
        this.right = this.position.x + this.boxWidth / 2;

        this.front = this.position.z + this.boxDepth / 2;
        this.back = this.position.z - this.boxDepth / 2;
      }
      update(ground: Box) {
        this.updateSides();
        if (this.zAcceleration) this.velocity.z += 0.0003;
        this.position.x += this.velocity.x;
        this.position.z += this.velocity.z;

        this.applyGravity(ground);
      }
      applyGravity(ground: Box) {
        this.velocity.y += this.gravity;

        //ground 상호작용
        if (
          boxCollision({
            box1: this,
            box2: ground,
          })
        ) {
          this.velocity.y *= 0.7;
          this.velocity.y = -this.velocity.y;
        } else {
          this.position.y += this.velocity.y;
        }
      }
    }
    type BoxInstance = {
      box1: Box;
      box2: Box;
    };
    const boxCollision = ({ box1, box2 }: BoxInstance): boolean => {
      const xCollision = box1.right >= box2.left && box1.left <= box2.right;
      const yCollision =
        box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;
      const zCollision = box1.front >= box2.back && box1.back <= box2.front;
      //추락 감지
      //   if (xCollision && yCollision && zCollision) {
      //     console.log("collison");
      //   }
      return xCollision && yCollision && zCollision;
    };
    //object
    const cube = new Box({
      width: 1,
      height: 1,
      depth: 1,
      velocity: {
        x: 0,
        y: -0.01,
        z: 0,
      },
    });
    cube.castShadow = true;
    scene.add(cube);

    const ground = new Box({
      width: 5,
      height: 0.5,
      depth: 10,
      color: "#ffffff",
      position: {
        x: 0,
        y: -2,
        z: 0,
      },
    });

    ground.receiveShadow = true;
    scene.add(ground);
    // light
    const dLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dLight.position.set(0, 3, 2);
    dLight.castShadow = true;
    scene.add(dLight);
    // camera
    camera.position.setZ(5);

    const keys = {
      a: {
        pressed: false,
      },
      d: {
        pressed: false,
      },
      w: {
        pressed: false,
      },
      s: {
        pressed: false,
      },
    };
    window.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "KeyA":
          keys.a.pressed = true;
          break;
        case "KeyD":
          keys.d.pressed = true;
          break;
        case "KeyW":
          keys.w.pressed = true;
          break;
        case "KeyS":
          keys.s.pressed = true;
          break;
      }
    });
    window.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyA":
          keys.a.pressed = false;
          break;
        case "KeyD":
          keys.d.pressed = false;
          break;
        case "KeyW":
          keys.w.pressed = false;
          break;
        case "KeyS":
          keys.s.pressed = false;
          break;
      }
    });
    const enemy = new Box({
      width: 1,
      height: 1,
      depth: 1,
      position: {
        x: 0,
        y: 0,
        z: -4,
      },
      velocity: {
        x: 0,
        y: 0,
        z: 0.005,
      },
      color: "red",
      zAcceleration: true,
    });

    enemy.castShadow = true;
    scene.add(enemy);
    const enemies = [enemy];

    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      renderer.render(scene, camera);

      cube.velocity.x = 0;
      cube.velocity.z = 0;
      if (keys.a.pressed) cube.velocity.x = -movementV;
      else if (keys.d.pressed) cube.velocity.x = movementV;
      if (keys.w.pressed) cube.velocity.z = -movementV;
      else if (keys.s.pressed) cube.velocity.z = movementV;

      cube.update(ground);

      enemies.forEach((enemy) => {
        enemy.update(ground);
        if (boxCollision({ box1: cube, box2: enemy })) {
          cancelAnimationFrame(animationId);
        }
      });
    };
    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);
  }, []);

  return <S.ContainerCanvas ref={mountRef}></S.ContainerCanvas>;
};

export default ThreeComponent;
