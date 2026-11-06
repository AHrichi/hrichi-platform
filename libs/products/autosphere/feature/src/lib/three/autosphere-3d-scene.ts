import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  FogExp2,
  GridHelper,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  RingGeometry,
  Scene,
  SpotLight,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from './orbit-controls';
import { GLTFLoader } from './gltf-loader';

export type LightingMode = 'daylight' | 'cyberpunk' | 'xray';
export type CameraPreset =
  'three-quarters' | 'side' | 'interior' | 'wheels' | 'top';

export interface AutoSphere3DParams {
  modelSlug: string;
  colorHex: string;
  accentHex?: string;
  finish: 'gloss' | 'metallic' | 'matte' | 'pearl';
  wheelStyle: string;
  upholsteryHex: string;
  ambientLightHex: string;
  lightingMode: LightingMode;
  cameraPreset: CameraPreset;
  turntableSpin: boolean;
  doorsOpen?: boolean;
  suspensionLift?: boolean;
  headlightsOn: boolean;
}

export interface AutoSphere3DController {
  update(params: AutoSphere3DParams): void;
  setCameraPreset(preset: CameraPreset): void;
  setLightingMode(mode: LightingMode): void;
  dispose(): void;
}

export function createAutoSphere3DScene(
  canvas: HTMLCanvasElement,
  initialParams: AutoSphere3DParams,
): AutoSphere3DController {
  let isDisposed = false;
  let currentParams = { ...initialParams };
  let isCameraTransitioning = false;

  // 1. WebGL Renderer Setup
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const scene = new Scene();
  scene.fog = new FogExp2(0x0a0e17, 0.035);

  // 2. Camera & Interactive Controls
  const camera = new PerspectiveCamera(
    40,
    canvas.clientWidth / Math.max(1, canvas.clientHeight),
    0.1,
    100,
  );
  camera.position.set(3.8, 1.4, 3.8);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 1.8;
  controls.maxDistance = 10.0;
  controls.maxPolarAngle = Math.PI / 2 - 0.04; // Floor boundary protection
  controls.target.set(0, 0.45, 0);

  controls.addEventListener('start', () => {
    isCameraTransitioning = false;
    targetCamPos.copy(camera.position);
    targetCamLook.copy(controls.target);
  });

  // 3. Studio Lighting Rig
  const ambientLight = new AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);

  const keyLight = new DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(5, 8, 5);
  scene.add(keyLight);

  const fillLight = new DirectionalLight(0x93c5fd, 1.2);
  fillLight.position.set(-6, 4, -4);
  scene.add(fillLight);

  const rimLight = new DirectionalLight(0xffffff, 1.6);
  rimLight.position.set(0, 6, -7);
  scene.add(rimLight);

  // Cyber Neon Lights (Active in cyberpunk mode)
  const neonCyan = new PointLight(0x00f0ff, 0, 16);
  neonCyan.position.set(-4.5, 1.5, 2.5);
  scene.add(neonCyan);

  const neonMagenta = new PointLight(0xff007f, 0, 16);
  neonMagenta.position.set(4.5, 1.5, -2.5);
  scene.add(neonMagenta);

  // 4. Studio Floor Grid & Circular Turntable
  const floorGrid = new GridHelper(24, 24, 0x334155, 0x1e293b);
  floorGrid.position.y = -0.01;
  scene.add(floorGrid);

  const turntableRingGeo = new RingGeometry(2.5, 2.6, 64);
  const turntableRingMat = new MeshBasicMaterial({
    color: 0x38bdf8,
    side: DoubleSide,
    transparent: true,
    opacity: 0.35,
  });
  const turntableRing = new Mesh(turntableRingGeo, turntableRingMat);
  turntableRing.rotation.x = Math.PI / 2;
  turntableRing.position.y = 0.005;
  scene.add(turntableRing);

  // 5. Materials Registry
  const bodyMaterial = new MeshPhysicalMaterial({
    color: new Color(initialParams.colorHex),
    metalness: 0.9,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  });

  const glassMaterial = new MeshPhysicalMaterial({
    color: new Color(0x1e293b),
    metalness: 0.05,
    roughness: 0.08,
    transmission: 0.92,
    transparent: true,
    opacity: 0.35,
    ior: 1.5,
  });

  const rimMaterial = new MeshStandardMaterial({
    color: new Color(0x94a3b8),
    metalness: 0.92,
    roughness: 0.22,
  });

  const tireMaterial = new MeshStandardMaterial({
    color: new Color(0x18181b),
    roughness: 0.85,
    metalness: 0.08,
  });

  const caliperMaterial = new MeshStandardMaterial({
    color: new Color(0xe11d48),
    metalness: 0.75,
    roughness: 0.25,
  });

  const upholsteryMaterial = new MeshStandardMaterial({
    color: new Color(initialParams.upholsteryHex),
    roughness: 0.65,
    metalness: 0.1,
  });

  const trimMaterial = new MeshStandardMaterial({
    color: new Color(0x111827),
    roughness: 0.35,
    metalness: 0.6,
  });

  const headlightMaterial = new MeshStandardMaterial({
    color: new Color(initialParams.headlightsOn ? 0xffffff : 0x18181b),
    emissive: new Color(initialParams.headlightsOn ? 0xecfeff : 0x000000),
    emissiveIntensity: initialParams.headlightsOn ? 8.0 : 0,
    roughness: 0.1,
  });

  const taillightMaterial = new MeshStandardMaterial({
    color: new Color(initialParams.headlightsOn ? 0xef4444 : 0x330005),
    emissive: new Color(initialParams.headlightsOn ? 0xff0028 : 0x220005),
    emissiveIntensity: initialParams.headlightsOn ? 7.0 : 0.2,
    roughness: 0.1,
  });

  const cabinDarkMaterial = new MeshStandardMaterial({
    color: new Color(0x181c24),
    roughness: 0.88,
    metalness: 0.12,
  });

  const chromeMaterial = new MeshStandardMaterial({
    color: new Color(0xd1d5db),
    metalness: 0.95,
    roughness: 0.15,
  });

  const ambientStripMaterial = new MeshStandardMaterial({
    color: new Color(initialParams.ambientLightHex),
    emissive: new Color(initialParams.ambientLightHex),
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.1,
  });

  // 6. Car Scene Hierarchy
  const carRoot = new Group();
  scene.add(carRoot);

  // Active Vehicle Headlight Projectors & Taillights
  const initialLightsOn = Boolean(initialParams.headlightsOn);

  // Left Headlight Projector Beam
  const headlightSpotL = new SpotLight(
    0xe0f2fe,
    initialLightsOn ? 24.0 : 0,
    14,
    0.52,
    0.75,
    1.2,
  );
  headlightSpotL.position.set(-0.65, 0.62, -2.1);
  const targetL = new Object3D();
  targetL.position.set(-0.65, 0.05, -7.0);
  carRoot.add(headlightSpotL);
  carRoot.add(targetL);
  headlightSpotL.target = targetL;

  // Right Headlight Projector Beam
  const headlightSpotR = new SpotLight(
    0xe0f2fe,
    initialLightsOn ? 24.0 : 0,
    14,
    0.52,
    0.75,
    1.2,
  );
  headlightSpotR.position.set(0.65, 0.62, -2.1);
  const targetR = new Object3D();
  targetR.position.set(0.65, 0.05, -7.0);
  carRoot.add(headlightSpotR);
  carRoot.add(targetR);
  headlightSpotR.target = targetR;

  // Forward Ground Illuminator
  const headlightPuddle = new PointLight(
    0x38bdf8,
    initialLightsOn ? 5.0 : 0,
    6.0,
    1.5,
  );
  headlightPuddle.position.set(0, 0.35, -2.8);
  carRoot.add(headlightPuddle);

  // Rear Taillights
  const taillightL = new PointLight(
    0xff1122,
    initialLightsOn ? 4.5 : 0,
    5.0,
    1.8,
  );
  taillightL.position.set(-0.65, 0.75, 2.2);
  carRoot.add(taillightL);

  const taillightR = new PointLight(
    0xff1122,
    initialLightsOn ? 4.5 : 0,
    5.0,
    1.8,
  );
  taillightR.position.set(0.65, 0.75, 2.2);
  carRoot.add(taillightR);

  // Soft Cockpit Ambient Lighting
  const cockpitAmbientLight = new PointLight(
    new Color(initialParams.ambientLightHex),
    0.65,
    2.2,
    2.0,
  );
  cockpitAmbientLight.position.set(-0.3, 0.72, -0.2);
  carRoot.add(cockpitAmbientLight);

  // Ground Contact Shadow
  const shadowPlaneGeo = new PlaneGeometry(2.4, 4.8);
  const shadowPlaneMat = new MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadowPlane = new Mesh(shadowPlaneGeo, shadowPlaneMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.005;
  carRoot.add(shadowPlane);

  // Fast zero-CLS procedural placeholder while GLTF loads
  const placeholderGroup = new Group();
  carRoot.add(placeholderGroup);

  const phBodyGeo = new BoxGeometry(1.85, 0.42, 4.6);
  const phBody = new Mesh(phBodyGeo, bodyMaterial);
  phBody.position.y = 0.45;
  placeholderGroup.add(phBody);

  const phGlassGeo = new BoxGeometry(1.5, 0.48, 2.2);
  const phGlass = new Mesh(phGlassGeo, glassMaterial);
  phGlass.position.set(0, 0.85, -0.1);
  placeholderGroup.add(phGlass);

  // Real GLTF Car Model Loader
  const wheelObjects: Object3D[] = [];
  const rimMeshes: Mesh[] = [];
  let bodyMesh: Mesh | null = null;
  let glassMesh: Mesh | null = null;
  let chassisGroup: Object3D | null = null;
  let steeringGroup: Object3D | null = null;
  let baseChassisY = 0.676;
  let baseSteeringY = 0.798;

  try {
    const gltfLoader = new GLTFLoader();

    gltfLoader.load(
      '/models/car.glb',
      (gltf: { scene: Group }) => {
        if (isDisposed) return;

        const model = gltf.scene;
        model.scale.set(1.0, 1.0, 1.0);
        model.position.set(0, 0, 0);

        model.traverse((child: Object3D) => {
          if (child.name === 'main') {
            chassisGroup = child;
            baseChassisY = child.position.y;
          } else if (child.name === 'steering_wheel') {
            steeringGroup = child;
            baseSteeringY = child.position.y;
          }

          if (!(child instanceof Mesh)) {
            if (child.name && child.name.startsWith('wheel_')) {
              wheelObjects.push(child);
            }
            return;
          }

          child.castShadow = true;
          child.receiveShadow = true;

          const name = child.name ? child.name.toLowerCase() : '';

          if (name === 'body') {
            bodyMesh = child;
            child.material = bodyMaterial;
          } else if (name === 'glass') {
            glassMesh = child;
            child.material = glassMaterial;
          } else if (name.startsWith('rim_') || name === 'wheel') {
            rimMeshes.push(child);
            child.material = rimMaterial;
          } else if (
            name === 'tire' ||
            name === 'wipers' ||
            name === 'grills'
          ) {
            child.material = tireMaterial;
          } else if (name.includes('brake')) {
            child.material = caliperMaterial;
          } else if (name.includes('leather') || name === 'carpet') {
            child.material = upholsteryMaterial;
          } else if (
            name === 'trim' ||
            name === 'carbon_fibre_trim' ||
            name === 'carbon fibre' ||
            name === 'steering_carbon'
          ) {
            child.material = trimMaterial;
          } else if (
            name === 'interior_light' ||
            name === 'interior_dark' ||
            name === 'plastic_gray' ||
            name === 'steering_column' ||
            name === 'nuts'
          ) {
            // Dark cabin plastic tub, dashboard casing, column, and pillars
            child.material = cabinDarkMaterial;
          } else if (
            name === 'yellow_trim' ||
            name === 'steering_trim' ||
            name === 'steering_red_lights'
          ) {
            // True ambient LED light contour and steering shift lights
            child.material = ambientStripMaterial;
          } else if (name === 'lights' || name === 'leds') {
            child.material = headlightMaterial;
          } else if (name === 'lights_red') {
            child.material = taillightMaterial;
          } else if (
            name === 'metal' ||
            name === 'chrome' ||
            name === 'steering_metal' ||
            name === 'centre'
          ) {
            child.material = chromeMaterial;
          }
        });

        // Hide placeholder and reveal high-fidelity GLTF model
        placeholderGroup.visible = false;
        carRoot.add(model);

        // Apply initial updates
        update(currentParams);
      },
      undefined,
      (err: unknown) => {
        console.warn('AutoSphere GLTF load notice:', err);
      },
    );
  } catch (err) {
    console.warn('GLTFLoader initialization skipped in test environment:', err);
  }

  // 7. Update Function (Full State Synchronization)
  function update(params: AutoSphere3DParams): void {
    currentParams = { ...params };

    // Update Body Paint
    bodyMaterial.color.set(params.colorHex);
    if (params.finish === 'metallic') {
      bodyMaterial.metalness = 0.94;
      bodyMaterial.roughness = 0.12;
      bodyMaterial.clearcoat = 1.0;
      bodyMaterial.clearcoatRoughness = 0.03;
    } else if (params.finish === 'matte') {
      bodyMaterial.metalness = 0.25;
      bodyMaterial.roughness = 0.58;
      bodyMaterial.clearcoat = 0.08;
      bodyMaterial.clearcoatRoughness = 0.4;
    } else if (params.finish === 'pearl') {
      bodyMaterial.metalness = 0.78;
      bodyMaterial.roughness = 0.16;
      bodyMaterial.clearcoat = 1.0;
      bodyMaterial.clearcoatRoughness = 0.05;
    } else {
      // Gloss
      bodyMaterial.metalness = 0.58;
      bodyMaterial.roughness = 0.08;
      bodyMaterial.clearcoat = 1.0;
      bodyMaterial.clearcoatRoughness = 0.02;
    }

    // Update Interior Materials
    upholsteryMaterial.color.set(params.upholsteryHex);
    ambientStripMaterial.color.set(params.ambientLightHex);
    ambientStripMaterial.emissive.set(params.ambientLightHex);
    ambientStripMaterial.emissiveIntensity = 0.45;
    cockpitAmbientLight.color.set(params.ambientLightHex);

    // Update Headlights & Taillights (Visible 3D Projectors + Emissive Shaders)
    const lightsActive = Boolean(params.headlightsOn);
    headlightSpotL.intensity = lightsActive ? 24.0 : 0;
    headlightSpotR.intensity = lightsActive ? 24.0 : 0;
    headlightPuddle.intensity = lightsActive ? 5.0 : 0;
    taillightL.intensity = lightsActive ? 4.5 : 0;
    taillightR.intensity = lightsActive ? 4.5 : 0;

    headlightMaterial.emissiveIntensity = lightsActive ? 8.0 : 0;
    headlightMaterial.emissive.set(lightsActive ? 0xecfeff : 0x000000);
    headlightMaterial.color.set(lightsActive ? 0xffffff : 0x18181b);

    taillightMaterial.emissiveIntensity = lightsActive ? 7.0 : 0.2;
    taillightMaterial.emissive.set(lightsActive ? 0xff0028 : 0x220005);
    taillightMaterial.color.set(lightsActive ? 0xef4444 : 0x330005);

    // Update Wheel Styles & Rims
    if (params.wheelStyle === 'aero') {
      rimMaterial.color.set(0x334155);
      rimMaterial.metalness = 0.85;
      rimMaterial.roughness = 0.25;
    } else if (params.wheelStyle === 'sport') {
      rimMaterial.color.set(0xe2e8f0);
      rimMaterial.metalness = 0.95;
      rimMaterial.roughness = 0.18;
    } else if (params.wheelStyle === 'track') {
      rimMaterial.color.set(0xd97706);
      rimMaterial.metalness = 0.9;
      rimMaterial.roughness = 0.28;
    }

    // Update Lighting Rig Modes
    setLightingMode(params.lightingMode);
  }

  function setLightingMode(mode: LightingMode): void {
    currentParams.lightingMode = mode;

    if (mode === 'cyberpunk') {
      ambientLight.intensity = 0.35;
      keyLight.intensity = 0.9;
      fillLight.intensity = 0.4;
      neonCyan.intensity = 18;
      neonMagenta.intensity = 18;
      scene.fog = new FogExp2(0x050811, 0.045);
      turntableRingMat.color.set(0x00f0ff);
      bodyMaterial.wireframe = false;
      bodyMaterial.transparent = false;
      bodyMaterial.opacity = 1.0;
      ambientStripMaterial.emissiveIntensity = 1.2;
    } else if (mode === 'xray') {
      ambientLight.intensity = 0.7;
      keyLight.intensity = 1.2;
      fillLight.intensity = 0.8;
      neonCyan.intensity = 0;
      neonMagenta.intensity = 0;
      scene.fog = new FogExp2(0x020617, 0.035);
      turntableRingMat.color.set(0x38bdf8);
      bodyMaterial.wireframe = true;
      bodyMaterial.transparent = true;
      bodyMaterial.opacity = 0.45;
      ambientStripMaterial.emissiveIntensity = 0.9;
    } else {
      // Daylight Studio
      ambientLight.intensity = 1.0;
      keyLight.intensity = 2.4;
      fillLight.intensity = 1.2;
      neonCyan.intensity = 0;
      neonMagenta.intensity = 0;
      scene.fog = new FogExp2(0x0a0e17, 0.025);
      turntableRingMat.color.set(0x38bdf8);
      bodyMaterial.wireframe = false;
      bodyMaterial.transparent = false;
      bodyMaterial.opacity = 1.0;
      ambientStripMaterial.emissiveIntensity = 0.7;
    }
  }

  // Camera Lerp Targets
  const targetCamPos = new Vector3(3.8, 1.4, 3.8);
  const targetCamLook = new Vector3(0, 0.45, 0);

  function setCameraPreset(preset: CameraPreset): void {
    currentParams.cameraPreset = preset;
    isCameraTransitioning = true;

    if (preset === 'three-quarters') {
      controls.minDistance = 1.8;
      controls.maxDistance = 10.0;
      targetCamPos.set(3.8, 1.4, 3.8);
      targetCamLook.set(0, 0.45, 0);
    } else if (preset === 'side') {
      controls.minDistance = 1.8;
      controls.maxDistance = 10.0;
      targetCamPos.set(0.01, 1.1, 5.2);
      targetCamLook.set(0, 0.45, 0);
    } else if (preset === 'interior') {
      controls.minDistance = 0.05;
      controls.maxDistance = 3.0;
      targetCamPos.set(-0.35, 0.96, 0.12);
      targetCamLook.set(-0.35, 0.82, -1.2);
    } else if (preset === 'wheels') {
      controls.minDistance = 1.2;
      controls.maxDistance = 10.0;
      targetCamPos.set(1.9, 0.5, 1.8);
      targetCamLook.set(1.0, 0.35, 1.3);
    } else if (preset === 'top') {
      controls.minDistance = 2.5;
      controls.maxDistance = 10.0;
      targetCamPos.set(0.01, 5.8, 0.01);
      targetCamLook.set(0, 0, 0);
    }
  }

  // 8. Animation & Render Loop
  let animationFrameId: number;

  function animate(): void {
    if (isDisposed) return;
    animationFrameId = requestAnimationFrame(animate);

    // Smooth Camera Transition Lerp (only during preset transitions; yields immediately to user Orbit drag)
    if (isCameraTransitioning) {
      camera.position.lerp(targetCamPos, 0.06);
      controls.target.lerp(targetCamLook, 0.06);
      if (
        camera.position.distanceTo(targetCamPos) < 0.02 &&
        controls.target.distanceTo(targetCamLook) < 0.02
      ) {
        camera.position.copy(targetCamPos);
        controls.target.copy(targetCamLook);
        isCameraTransitioning = false;
      }
    }
    controls.update();

    // Turntable Auto-Rotation
    if (
      currentParams.turntableSpin &&
      currentParams.cameraPreset !== 'interior'
    ) {
      carRoot.rotation.y += 0.005;
      // Synchronous Wheel Rotation
      for (const w of wheelObjects) {
        w.rotation.x += 0.03;
      }
    }

    // Dynamic Pneumatic Air Suspension Lift (+50mm / Track Stance)
    const isLifted = Boolean(
      currentParams.suspensionLift ?? currentParams.doorsOpen,
    );
    const liftOffset = isLifted ? 0.05 : 0;

    if (chassisGroup) {
      const targetY = baseChassisY + liftOffset;
      chassisGroup.position.y += (targetY - chassisGroup.position.y) * 0.1;
    }
    if (steeringGroup) {
      const targetY = baseSteeringY + liftOffset;
      steeringGroup.position.y += (targetY - steeringGroup.position.y) * 0.1;
    }

    // Cyberpunk Dynamic Pulsing Ambient Lighting (subtle accent glow)
    if (currentParams.lightingMode === 'cyberpunk') {
      const time = performance.now() * 0.002;
      ambientStripMaterial.emissiveIntensity = 1.0 + Math.sin(time) * 0.4;
    }

    renderer.render(scene, camera);
  }

  animate();

  // 9. Responsive Resize Observer
  function onResize(): void {
    if (isDisposed || !canvas.parentElement) return;
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  const resizeObserver = new ResizeObserver(() => onResize());
  if (canvas.parentElement) {
    resizeObserver.observe(canvas.parentElement);
  }

  // 10. Disposal & Memory Cleanup
  function dispose(): void {
    isDisposed = true;
    cancelAnimationFrame(animationFrameId);
    resizeObserver.disconnect();
    controls.dispose();

    // Dispose Geometries and Materials
    floorGrid.geometry.dispose();
    turntableRingGeo.dispose();
    turntableRingMat.dispose();
    shadowPlaneGeo.dispose();
    shadowPlaneMat.dispose();
    phBodyGeo.dispose();
    phGlassGeo.dispose();

    bodyMaterial.dispose();
    glassMaterial.dispose();
    rimMaterial.dispose();
    tireMaterial.dispose();
    caliperMaterial.dispose();
    upholsteryMaterial.dispose();
    trimMaterial.dispose();
    cabinDarkMaterial.dispose();
    chromeMaterial.dispose();
    headlightMaterial.dispose();
    taillightMaterial.dispose();
    ambientStripMaterial.dispose();

    headlightSpotL.dispose();
    headlightSpotR.dispose();
    headlightPuddle.dispose();
    taillightL.dispose();
    taillightR.dispose();
    cockpitAmbientLight.dispose();

    renderer.dispose();
  }

  return {
    update,
    setCameraPreset,
    setLightingMode,
    dispose,
  };
}
