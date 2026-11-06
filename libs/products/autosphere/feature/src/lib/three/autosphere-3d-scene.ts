import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  FogExp2,
  GridHelper,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  RingGeometry,
  Scene,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from './orbit-controls';

export type LightingMode = 'daylight' | 'cyberpunk' | 'xray';
export type CameraPreset =
  'three-quarters' | 'side' | 'interior' | 'wheels' | 'top';

export interface AutoSphere3DParams {
  modelSlug: string;
  colorHex: string;
  accentHex?: string;
  finish: 'gloss' | 'metallic' | 'matte' | 'pearl';
  wheelStyle: 'Aero Efficiency' | 'Sport Forged' | 'Track Centerlock';
  upholsteryHex: string;
  ambientLightHex: string;
  lightingMode: LightingMode;
  cameraPreset: CameraPreset;
  turntableSpin: boolean;
  doorsOpen: boolean;
  headlightsOn: boolean;
}

export interface AutoSphere3DController {
  update(params: AutoSphere3DParams): void;
  setCameraPreset(preset: CameraPreset): void;
  dispose(): void;
}

export function createAutoSphere3DScene(
  canvas: HTMLCanvasElement,
  initialParams: AutoSphere3DParams,
): AutoSphere3DController {
  let isDisposed = false;
  let currentParams = { ...initialParams };

  // 1. Renderer Setup
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

  // 2. Camera & Controls
  const camera = new PerspectiveCamera(
    42,
    canvas.clientWidth / Math.max(1, canvas.clientHeight),
    0.1,
    100,
  );
  camera.position.set(4.6, 2.0, 4.8);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 2.4;
  controls.maxDistance = 11.0;
  controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't go below studio floor
  controls.target.set(0, 0.65, 0);

  // 3. Lighting Rig Setup
  const ambientLight = new AmbientLight(0xffffff, 0.8);
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
  const neonCyan = new PointLight(0x00f0ff, 0, 15);
  neonCyan.position.set(-4.5, 1.5, 2.5);
  scene.add(neonCyan);

  const neonMagenta = new PointLight(0xff007f, 0, 15);
  neonMagenta.position.set(4.5, 1.5, -2.5);
  scene.add(neonMagenta);

  // 4. Studio Floor & Circular Turntable
  const floorGrid = new GridHelper(24, 24, 0x334155, 0x1e293b);
  floorGrid.position.y = -0.01;
  scene.add(floorGrid);

  const turntableRingGeo = new RingGeometry(2.6, 2.7, 64);
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
    metalness: 0.88,
    roughness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    reflectivity: 0.95,
  });

  const glassMaterial = new MeshPhysicalMaterial({
    color: new Color(0x0f172a),
    transmission: 0.7,
    opacity: 0.85,
    transparent: true,
    roughness: 0.08,
    ior: 1.52,
  });

  const tireMaterial = new MeshStandardMaterial({
    color: new Color(0x18181b),
    roughness: 0.82,
    metalness: 0.1,
  });

  const rimMaterial = new MeshStandardMaterial({
    color: new Color(0x94a3b8),
    roughness: 0.25,
    metalness: 0.9,
  });

  const caliperMaterial = new MeshStandardMaterial({
    color: new Color(0xe11d48),
    roughness: 0.3,
    metalness: 0.7,
  });

  const discMaterial = new MeshStandardMaterial({
    color: new Color(0x64748b),
    roughness: 0.35,
    metalness: 0.92,
  });

  const headlightMaterial = new MeshStandardMaterial({
    color: new Color(0xf8fafc),
    emissive: new Color(0x38bdf8),
    emissiveIntensity: initialParams.headlightsOn ? 3.5 : 0.2,
    roughness: 0.1,
  });

  const taillightMaterial = new MeshStandardMaterial({
    color: new Color(0xef4444),
    emissive: new Color(0xff1e27),
    emissiveIntensity: initialParams.headlightsOn ? 3.2 : 1.2,
    roughness: 0.1,
  });

  const upholsteryMaterial = new MeshStandardMaterial({
    color: new Color(initialParams.upholsteryHex),
    roughness: 0.7,
    metalness: 0.15,
  });

  const ambientStripMaterial = new MeshStandardMaterial({
    color: new Color(initialParams.ambientLightHex),
    emissive: new Color(initialParams.ambientLightHex),
    emissiveIntensity: 2.2,
  });

  const chassisXrayMaterial = new MeshBasicMaterial({
    color: 0x0ea5e9,
    wireframe: true,
    transparent: true,
    opacity: 0.65,
  });

  // 6. 3D Car Hierarchy
  const carRoot = new Group();
  scene.add(carRoot);

  // --- Main Fuselage Group ---
  const bodyGroup = new Group();
  carRoot.add(bodyGroup);

  // Sculpted Lower Body
  const lowerBodyGeo = new BoxGeometry(1.9, 0.42, 4.75, 4, 2, 8);
  const lowerBody = new Mesh(lowerBodyGeo, bodyMaterial);
  lowerBody.position.y = 0.48;
  bodyGroup.add(lowerBody);

  // Sculpted Hood & Nose
  const noseGeo = new BoxGeometry(1.85, 0.22, 1.3);
  const nose = new Mesh(noseGeo, bodyMaterial);
  nose.position.set(0, 0.58, 1.75);
  nose.rotation.x = -0.15;
  bodyGroup.add(nose);

  // Rear Fastback / Diffuser section
  const rearDiffuserGeo = new BoxGeometry(1.88, 0.28, 1.1);
  const rearDiffuser = new Mesh(rearDiffuserGeo, bodyMaterial);
  rearDiffuser.position.set(0, 0.52, -1.8);
  rearDiffuser.rotation.x = 0.18;
  bodyGroup.add(rearDiffuser);

  // Carbon Fiber Lower Side Splitters
  const splitterGeo = new BoxGeometry(1.96, 0.06, 4.6);
  const splitterMat = new MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.5,
  });
  const splitter = new Mesh(splitterGeo, splitterMat);
  splitter.position.y = 0.25;
  bodyGroup.add(splitter);

  // --- Panoramic Glass Canopy ---
  const canopyGeo = new BoxGeometry(1.55, 0.56, 2.3, 4, 2, 4);
  const canopy = new Mesh(canopyGeo, glassMaterial);
  canopy.position.set(0, 0.94, -0.1);
  bodyGroup.add(canopy);

  // --- Interior Cabin Elements ---
  const interiorGroup = new Group();
  interiorGroup.position.set(0, 0.6, -0.1);
  bodyGroup.add(interiorGroup);

  // Seats (Left & Right bucket seats)
  const seatGeo = new BoxGeometry(0.5, 0.6, 0.55);
  const leftSeat = new Mesh(seatGeo, upholsteryMaterial);
  leftSeat.position.set(-0.42, 0.15, -0.15);
  interiorGroup.add(leftSeat);

  const rightSeat = new Mesh(seatGeo, upholsteryMaterial);
  rightSeat.position.set(0.42, 0.15, -0.15);
  interiorGroup.add(rightSeat);

  // Headrests
  const headrestGeo = new BoxGeometry(0.24, 0.2, 0.14);
  const leftHeadrest = new Mesh(headrestGeo, upholsteryMaterial);
  leftHeadrest.position.set(-0.42, 0.52, -0.12);
  interiorGroup.add(leftHeadrest);

  const rightHeadrest = new Mesh(headrestGeo, upholsteryMaterial);
  rightHeadrest.position.set(0.42, 0.52, -0.12);
  interiorGroup.add(rightHeadrest);

  // Dashboard & Curved Panoramic Touchscreen
  const dashGeo = new BoxGeometry(1.4, 0.18, 0.45);
  const dash = new Mesh(dashGeo, splitterMat);
  dash.position.set(0, 0.32, 0.7);
  interiorGroup.add(dash);

  const screenGeo = new BoxGeometry(0.9, 0.14, 0.04);
  const screenMat = new MeshBasicMaterial({ color: 0x38bdf8 });
  const screen = new Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.42, 0.62);
  interiorGroup.add(screen);

  // Ambient Interior LED Light Pipe
  const lightPipeGeo = new BoxGeometry(1.42, 0.02, 0.03);
  const lightPipe = new Mesh(lightPipeGeo, ambientStripMaterial);
  lightPipe.position.set(0, 0.35, 0.64);
  interiorGroup.add(lightPipe);

  // --- Headlights & Cyber Taillight ---
  const headlampLeftGeo = new BoxGeometry(0.35, 0.06, 0.3);
  const headlampLeft = new Mesh(headlampLeftGeo, headlightMaterial);
  headlampLeft.position.set(-0.68, 0.58, 2.3);
  bodyGroup.add(headlampLeft);

  const headlampRight = headlampLeft.clone();
  headlampRight.position.x = 0.68;
  bodyGroup.add(headlampRight);

  const taillightBarGeo = new BoxGeometry(1.8, 0.06, 0.1);
  const taillightBar = new Mesh(taillightBarGeo, taillightMaterial);
  taillightBar.position.set(0, 0.64, -2.36);
  bodyGroup.add(taillightBar);

  // --- 800V Underfloor Battery Pack (Visible in X-ray mode) ---
  const batteryPackGeo = new BoxGeometry(1.65, 0.14, 2.8);
  const batteryPack = new Mesh(batteryPackGeo, chassisXrayMaterial);
  batteryPack.position.set(0, 0.28, 0);
  batteryPack.visible = false;
  carRoot.add(batteryPack);

  // --- 4 Wheel Assemblies ---
  const wheelGroups: Group[] = [];
  const rimMeshes: Mesh[] = [];

  function createWheel(x: number, y: number, z: number): Group {
    const wheelAssembly = new Group();
    wheelAssembly.position.set(x, y, z);

    // Tire
    const tireGeo = new CylinderGeometry(0.38, 0.38, 0.26, 32);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new Mesh(tireGeo, tireMaterial);
    wheelAssembly.add(tire);

    // Brake Rotor Disc
    const rotorGeo = new CylinderGeometry(0.26, 0.26, 0.04, 28);
    rotorGeo.rotateZ(Math.PI / 2);
    const rotor = new Mesh(rotorGeo, discMaterial);
    rotor.position.x = x > 0 ? -0.05 : 0.05;
    wheelAssembly.add(rotor);

    // Brake Caliper
    const caliperGeo = new BoxGeometry(0.08, 0.18, 0.1);
    const caliper = new Mesh(caliperGeo, caliperMaterial);
    caliper.position.set(x > 0 ? -0.06 : 0.06, 0.15, 0);
    wheelAssembly.add(caliper);

    // Dynamic Rim Style Mesh
    const rimGeo = createRimGeometry(initialParams.wheelStyle);
    const rim = new Mesh(rimGeo, rimMaterial);
    wheelAssembly.add(rim);
    rimMeshes.push(rim);

    carRoot.add(wheelAssembly);
    wheelGroups.push(wheelAssembly);
    return wheelAssembly;
  }

  function createRimGeometry(
    style: AutoSphere3DParams['wheelStyle'],
  ): BufferGeometry {
    if (style === 'Sport Forged') {
      const geo = new TorusGeometry(0.28, 0.035, 12, 32);
      geo.rotateY(Math.PI / 2);
      return geo;
    } else if (style === 'Track Centerlock') {
      const geo = new CylinderGeometry(0.29, 0.29, 0.12, 10);
      geo.rotateZ(Math.PI / 2);
      return geo;
    }
    // Aero Efficiency default
    const geo = new CylinderGeometry(0.29, 0.29, 0.14, 24);
    geo.rotateZ(Math.PI / 2);
    return geo;
  }

  const trackWidth = 0.95;
  const wheelBaseHalf = 1.48;
  const wheelHeight = 0.38;

  createWheel(-trackWidth, wheelHeight, wheelBaseHalf); // Front Left
  createWheel(trackWidth, wheelHeight, wheelBaseHalf); // Front Right
  createWheel(-trackWidth, wheelHeight, -wheelBaseHalf); // Rear Left
  createWheel(trackWidth, wheelHeight, -wheelBaseHalf); // Rear Right

  // --- Interactive Left Door Pivot ---
  const leftDoorGroup = new Group();
  leftDoorGroup.position.set(-0.95, 0.55, 0.35); // A-pillar hinge
  bodyGroup.add(leftDoorGroup);

  const doorPanelGeo = new BoxGeometry(0.08, 0.44, 1.35);
  const doorPanel = new Mesh(doorPanelGeo, bodyMaterial);
  doorPanel.position.set(0, 0, -0.65);
  leftDoorGroup.add(doorPanel);

  // 7. Update Routine
  function update(params: AutoSphere3DParams): void {
    currentParams = { ...params };

    // Update body paint
    bodyMaterial.color.set(params.colorHex);
    if (params.finish === 'metallic') {
      bodyMaterial.metalness = 0.92;
      bodyMaterial.roughness = 0.14;
      bodyMaterial.clearcoat = 1.0;
    } else if (params.finish === 'matte') {
      bodyMaterial.metalness = 0.3;
      bodyMaterial.roughness = 0.55;
      bodyMaterial.clearcoat = 0.1;
    } else if (params.finish === 'pearl') {
      bodyMaterial.metalness = 0.75;
      bodyMaterial.roughness = 0.18;
      bodyMaterial.clearcoat = 1.0;
    } else {
      // Gloss
      bodyMaterial.metalness = 0.6;
      bodyMaterial.roughness = 0.08;
      bodyMaterial.clearcoat = 1.0;
    }

    // Update Interior materials
    upholsteryMaterial.color.set(params.upholsteryHex);
    ambientStripMaterial.color.set(params.ambientLightHex);
    ambientStripMaterial.emissive.set(params.ambientLightHex);

    // Update Headlights
    headlightMaterial.emissiveIntensity = params.headlightsOn ? 3.8 : 0.2;
    taillightMaterial.emissiveIntensity = params.headlightsOn ? 3.5 : 1.2;

    // Update Lighting Modes
    if (params.lightingMode === 'cyberpunk') {
      ambientLight.intensity = 0.3;
      keyLight.intensity = 0.8;
      neonCyan.intensity = 18;
      neonMagenta.intensity = 18;
      scene.fog = new FogExp2(0x050811, 0.045);
      turntableRingMat.color.set(0x00f0ff);
      batteryPack.visible = false;
      bodyMaterial.wireframe = false;
    } else if (params.lightingMode === 'xray') {
      ambientLight.intensity = 0.6;
      keyLight.intensity = 1.2;
      neonCyan.intensity = 0;
      neonMagenta.intensity = 0;
      scene.fog = new FogExp2(0x020617, 0.035);
      turntableRingMat.color.set(0x38bdf8);
      batteryPack.visible = true;
      bodyMaterial.wireframe = true;
    } else {
      // Daylight Studio
      ambientLight.intensity = 1.0;
      keyLight.intensity = 2.4;
      fillLight.intensity = 1.2;
      neonCyan.intensity = 0;
      neonMagenta.intensity = 0;
      scene.fog = new FogExp2(0x0a0e17, 0.025);
      turntableRingMat.color.set(0x38bdf8);
      batteryPack.visible = false;
      bodyMaterial.wireframe = false;
    }

    // Update Wheels Geometry if changed
    rimMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.geometry = createRimGeometry(params.wheelStyle);
    });
  }

  // Camera lerp targets
  const targetCamPos = new Vector3(4.6, 2.0, 4.8);
  const targetCamLook = new Vector3(0, 0.65, 0);

  function setCameraPreset(preset: CameraPreset): void {
    if (preset === 'three-quarters') {
      targetCamPos.set(4.6, 2.0, 4.8);
      targetCamLook.set(0, 0.65, 0);
    } else if (preset === 'side') {
      targetCamPos.set(0.01, 1.4, 6.2);
      targetCamLook.set(0, 0.65, 0);
    } else if (preset === 'interior') {
      targetCamPos.set(-0.4, 1.25, 0.5);
      targetCamLook.set(0, 0.95, -0.4);
    } else if (preset === 'wheels') {
      targetCamPos.set(-2.2, 0.6, 2.4);
      targetCamLook.set(-0.95, 0.38, 1.48);
    } else if (preset === 'top') {
      targetCamPos.set(0.05, 6.8, 0.05);
      targetCamLook.set(0, 0, 0);
    }
  }

  // 8. Animation & Render Loop
  let animationFrameId: number;

  function animate(): void {
    if (isDisposed) return;
    animationFrameId = requestAnimationFrame(animate);

    // Smooth camera transition
    camera.position.lerp(targetCamPos, 0.05);
    controls.target.lerp(targetCamLook, 0.05);
    controls.update();

    // Turntable Auto-Spin
    if (
      currentParams.turntableSpin &&
      currentParams.cameraPreset !== 'interior'
    ) {
      carRoot.rotation.y += 0.006;
    }

    // Animate Doors
    const targetDoorAngle = currentParams.doorsOpen ? -0.65 : 0;
    leftDoorGroup.rotation.y +=
      (targetDoorAngle - leftDoorGroup.rotation.y) * 0.1;

    // Animate Wheels
    if (currentParams.turntableSpin) {
      wheelGroups.forEach((w) => {
        w.children[0].rotation.x += 0.02; // Rotate tire
      });
    }

    // Dynamic Pulsing Ambient Lighting
    if (currentParams.lightingMode === 'cyberpunk') {
      const time = performance.now() * 0.002;
      ambientStripMaterial.emissiveIntensity = 2.0 + Math.sin(time) * 0.6;
    }

    renderer.render(scene, camera);
  }

  animate();

  // Resize Listener
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

  // 9. Disposal
  function dispose(): void {
    isDisposed = true;
    cancelAnimationFrame(animationFrameId);
    resizeObserver.disconnect();
    controls.dispose();

    // Dispose geometries & materials
    [
      turntableRingGeo,
      lowerBodyGeo,
      noseGeo,
      rearDiffuserGeo,
      splitterGeo,
      canopyGeo,
      seatGeo,
      headrestGeo,
      dashGeo,
      screenGeo,
      lightPipeGeo,
      headlampLeftGeo,
      taillightBarGeo,
      batteryPackGeo,
      doorPanelGeo,
    ].forEach((geo) => geo.dispose());

    rimMeshes.forEach((mesh) => mesh.geometry.dispose());

    [
      bodyMaterial,
      glassMaterial,
      tireMaterial,
      rimMaterial,
      caliperMaterial,
      discMaterial,
      headlightMaterial,
      taillightMaterial,
      upholsteryMaterial,
      ambientStripMaterial,
      chassisXrayMaterial,
      turntableRingMat,
      splitterMat,
      screenMat,
    ].forEach((mat) => mat.dispose());

    renderer.dispose();
  }

  return {
    update,
    setCameraPreset,
    dispose,
  };
}
