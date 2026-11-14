import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CyberSoundEngine } from '../audio/CyberSoundEngine';
import {
  ABILITIES_CATALOG,
  CAMERA_MODES,
  CONFIG,
  getActiveShipStats,
  resolveActiveSector,
} from '../data/catalogs';
import type {
  ContractType,
  GameMode,
  HudTelemetry,
  LiveryId,
  MenuView,
  PlayerProfile,
  PlayMode,
  QualityPreset,
  ShipId,
} from '../types/game';
import { triggerHaptic } from '../utils/storage';
import {
  applyLiveryColors,
  buildPlayerHoverJet,
  createShipMaterialSet,
  disposeShipGeometries,
  type ShipMaterialSet,
  type ShipParts,
} from './shipBuilder';

interface ObstacleEntity {
  group: THREE.Group;
  type: 'HURDLE' | 'PILLAR' | 'CRUSHER' | 'GATE';
  baseX: number;
  width: number;
  height: number;
  nearMissed: boolean;
  phase: number;
}

interface CollectibleEntity {
  group: THREE.Group;
  type: 'CORE' | 'PORTAL' | 'SHIELD';
}

interface ParticleEntity {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
}

export interface EngineCallbacks {
  onTelemetry: (telemetry: HudTelemetry) => void;
  onCallout: (text: string, colorClass: string) => void;
  onContractAdvance: (type: ContractType, amount: number) => void;
  onRunComplete: (result: {
    score: number;
    distance: number;
    runCredits: number;
    reason: string;
    isNewRecord: boolean;
  }) => void;
  onContextLostChange?: (lost: boolean) => void;
}

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export class HyperdriveEngine {
  private container: HTMLElement;
  private sound: CyberSoundEngine;
  private callbacks: EngineCallbacks;
  private profile: PlayerProfile;

  private readonly isSoftwareGl: boolean;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private envRenderTarget: THREE.WebGLRenderTarget | null = null;

  // Pre-allocated math helpers for zero GC in loop
  private readonly tmpFog = new THREE.Color();
  private readonly tmpGrid = new THREE.Color();
  private readonly tmpAccent = new THREE.Color();
  private readonly tmpVec = new THREE.Vector3();

  // Environment references
  private roadGridHelper: THREE.GridHelper;
  private railMat: THREE.MeshBasicMaterial;
  private archMat: THREE.MeshBasicMaterial;
  private envArches: THREE.Mesh[] = [];
  private dysonCore: THREE.Mesh;
  private dysonRing: THREE.Mesh;
  private starGeo: THREE.BufferGeometry;
  private starField: THREE.Points;
  private hangarPlatformGroup: THREE.Group;
  private shipLight: THREE.PointLight;
  private burnerLight: THREE.PointLight;

  // Player ship references
  private playerGroup = new THREE.Group();
  private shipMeshGroup = new THREE.Group();
  private shieldBubble: THREE.Mesh;
  private shipMaterials: ShipMaterialSet;
  private shipParts: ShipParts;

  // Shared obstacle / particle geometries & materials
  private readonly obstacleGlowMat = new THREE.MeshBasicMaterial({ color: 0xff2a55 });
  private readonly obstacleDarkMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.85,
    roughness: 0.25,
  });
  private readonly coreMat = new THREE.MeshBasicMaterial({ color: 0xffc800 });
  private readonly shieldItemMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa, wireframe: true });
  private readonly portalItemMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
  private readonly particleGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);

  // Active entity pools
  private obstacles: ObstacleEntity[] = [];
  private collectibles: CollectibleEntity[] = [];
  private particles: ParticleEntity[] = [];

  // Runtime state
  private mode: PlayMode = 'MENU';
  private menuView: MenuView = 'MAIN';
  private gameMode: GameMode = 'ENDLESS';
  private previewShipId: ShipId;
  private quality: QualityPreset = 'ULTRA';
  private cameraModeIdx = 0;

  private score = 0;
  private distance = 0;
  private runCredits = 0;
  private speed = 60;
  private combo = 1;
  private comboTimer = 0;
  private nitro = 100;
  private isBoosting = false;
  private portalBoostTimer = 0;
  private shieldCharges = 1;
  private maxShieldCharges = 1;
  private invulnerableTimer = 0;
  private timeRemaining = 60;
  private abilityCooldown = 0;
  private abilityMaxCooldown = 14;
  private abilityActiveTimer = 0;
  private shakeIntensity = 0;
  private spawnTimer = 0;
  private endReason = 'HULL INTEGRITY COMPROMISED';
  private isNewRecord = false;

  // Ship physics
  private shipX = 0;
  private shipY: number = CONFIG.hoverHeight;
  private shipVelX = 0;
  private shipVelY = 0;
  private shipRoll = 0;
  private shipPitch = 0;
  private wingSweep = 0;
  private isJumping = false;

  // Inputs
  private keys = { left: false, right: false, nitro: false };
  private nitroLatched = false;
  private analogSteer = 0;
  private gyroBaselineGamma: number | null = null;
  private gyroCurrentAngle = 0;
  private turntableUserYaw = 0;

  // Loop & context handling
  private frameId = 0;
  private lastTime = performance.now();
  private lastTelemetryEmit = 0;
  private disposed = false;
  private contextLost = false;

  constructor(
    container: HTMLElement,
    initialProfile: PlayerProfile,
    sound: CyberSoundEngine,
    callbacks: EngineCallbacks,
  ) {
    this.container = container;
    this.profile = initialProfile;
    this.previewShipId = initialProfile.selectedShip;
    this.sound = sound;
    this.callbacks = callbacks;

    this.isSoftwareGl = detectSoftwareWebGL();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040816);
    this.scene.fog = new THREE.FogExp2(0x040816, 0.0075);

    const width = Math.max(1, container.clientWidth || window.innerWidth);
    const height = Math.max(1, container.clientHeight || window.innerHeight);
    const aspect = width / height;

    this.camera = new THREE.PerspectiveCamera(aspect < 1 ? 72 : 65, aspect, 0.1, 520);
    this.camera.position.set(0, 4.5, 12);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    // Studio Environment Map (RoomEnvironment + PMREMGenerator)
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const roomEnv = new RoomEnvironment();
      this.envRenderTarget = pmrem.fromScene(roomEnv, 0.04);
      this.scene.environment = this.envRenderTarget.texture;
      roomEnv.dispose();
      pmrem.dispose();
    } catch {
      // Fallback gracefully if PMREM fails
    }

    // Post-Processing Bloom Composer (disabled automatically on software WebGL)
    if (!this.isSoftwareGl) {
      try {
        const renderPass = new RenderPass(this.scene, this.camera);
        this.bloomPass = new UnrealBloomPass(
          new THREE.Vector2(width, height),
          0.95,
          0.45,
          0.2,
        );
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);
        this.composer.addPass(this.bloomPass);
      } catch {
        this.composer = null;
      }
    }

    // Three-point + dynamic aerospace lighting
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.75);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff1e0, 1.45);
    dirLight.position.set(18, 35, 24);
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(-20, 12, -18);
    this.scene.add(rimLight);

    this.shipLight = new THREE.PointLight(0x00f3ff, 1.8, 22);
    this.burnerLight = new THREE.PointLight(0xffaa00, 2.2, 16);
    this.scene.add(this.shipLight, this.burnerLight);

    // Cyber Highway & Megastructure Environment
    this.roadGridHelper = new THREE.GridHelper(420, 84, 0x00f3ff, 0x00f3ff);
    this.roadGridHelper.position.set(0, 0, -140);
    const gridMat = this.roadGridHelper.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.36;
    this.scene.add(this.roadGridHelper);

    const roadMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(CONFIG.laneWidth * 1.35, 420),
      new THREE.MeshStandardMaterial({ color: 0x050a18, metalness: 0.85, roughness: 0.22 }),
    );
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0.02, -140);
    this.scene.add(roadMesh);

    const railGeo = new THREE.BoxGeometry(0.28, 0.35, 420);
    this.railMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const leftRail = new THREE.Mesh(railGeo, this.railMat);
    leftRail.position.set(-CONFIG.laneWidth * 0.65, 0.2, -140);
    const rightRail = new THREE.Mesh(railGeo, this.railMat);
    rightRail.position.set(CONFIG.laneWidth * 0.65, 0.2, -140);
    this.scene.add(leftRail, rightRail);

    const archGeo = new THREE.TorusGeometry(22, 0.32, 8, 36, Math.PI);
    this.archMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    for (let i = 0; i < 12; i++) {
      const arch = new THREE.Mesh(archGeo, this.archMat);
      arch.position.set(0, 0, -i * 35);
      this.scene.add(arch);
      this.envArches.push(arch);
    }

    const dysonGroup = new THREE.Group();
    dysonGroup.position.set(0, 48, -340);
    this.dysonCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(26, 1),
      new THREE.MeshBasicMaterial({ color: 0xff007f, wireframe: true, transparent: true, opacity: 0.45 }),
    );
    this.dysonRing = new THREE.Mesh(
      new THREE.TorusGeometry(42, 0.8, 10, 64),
      new THREE.MeshBasicMaterial({ color: 0x00f3ff }),
    );
    this.dysonRing.rotation.x = Math.PI / 3;
    dysonGroup.add(this.dysonCore, this.dysonRing);
    this.scene.add(dysonGroup);

    const starCount = 700;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 260;
      starPositions[i * 3 + 1] = Math.random() * 110 + 4;
      starPositions[i * 3 + 2] = -Math.random() * 380;
    }
    this.starGeo = new THREE.BufferGeometry();
    this.starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starField = new THREE.Points(
      this.starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.75, transparent: true, opacity: 0.8 }),
    );
    this.scene.add(this.starField);

    // Hangar Turntable Pedestal
    this.hangarPlatformGroup = new THREE.Group();
    const padDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.7, 0.28, 48),
      new THREE.MeshStandardMaterial({ color: 0x0b1328, metalness: 0.9, roughness: 0.2 }),
    );
    padDisc.position.y = -0.14;
    const padRing1 = new THREE.Mesh(
      new THREE.RingGeometry(3.85, 4.05, 48),
      new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide }),
    );
    padRing1.rotation.x = -Math.PI / 2;
    padRing1.position.y = 0.02;
    const padRing2 = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 2.75, 32),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide }),
    );
    padRing2.rotation.x = -Math.PI / 2;
    padRing2.position.y = 0.03;
    this.hangarPlatformGroup.add(padDisc, padRing1, padRing2);
    this.scene.add(this.hangarPlatformGroup);

    // Player Ship Assembly
    this.playerGroup.add(this.shipMeshGroup);
    this.shieldBubble = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.65, 2),
      new THREE.MeshBasicMaterial({
        color: 0x00ffaa,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
      }),
    );
    this.playerGroup.add(this.shieldBubble);
    this.scene.add(this.playerGroup);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.shipMaterials = createShipMaterialSet(
      initialProfile.selectedLivery,
      this.isSoftwareGl,
      maxAniso,
    );
    this.shipParts = buildPlayerHoverJet(
      this.shipMeshGroup,
      this.shipMaterials,
      initialProfile.selectedShip,
    );

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.applyQuality('ULTRA');

    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.emitTelemetry(true);
    this.lastTime = performance.now();
    this.scheduleNextFrame();
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    const w = Math.max(1, this.container.clientWidth || window.innerWidth);
    const h = Math.max(1, this.container.clientHeight || window.innerHeight);
    const aspect = w / h;
    this.camera.fov = aspect < 1 ? 72 : 65;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setSize(w, h);
    }
    if (this.bloomPass) {
      this.bloomPass.resolution.set(w, h);
    }
  };

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.contextLost = true;
    this.callbacks.onContextLostChange?.(true);
  };

  private handleContextRestored = (): void => {
    this.contextLost = false;
    this.callbacks.onContextLostChange?.(false);
    this.handleResize();
  };

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(() => {
        this.frameId = requestAnimationFrame(this.tick);
      });
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private afterDraw(cb: () => void): void {
    if (this.disposed) return;
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (status === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private renderFrame(): void {
    if (this.contextLost || this.disposed) return;
    if (this.composer && !this.isSoftwareGl && this.quality !== 'LOW') {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private tick = (now: number): void => {
    if (this.disposed) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
    this.lastTime = now;

    this.updateBiomeColors(dt);

    if (this.mode === 'MENU') {
      this.scrollEnvironment(22, dt);
      this.hangarPlatformGroup.position.set(0, 0, 0);
      this.playerGroup.position.set(0, 1.05 + Math.sin(now * 0.003) * 0.12, 0);
      this.playerGroup.rotation.y += dt * 0.55;
      this.shipMeshGroup.rotation.y = this.turntableUserYaw;
      this.shipMeshGroup.rotation.z = Math.sin(now * 0.002) * 0.08;
      this.shieldBubble.visible = false;

      const isPortrait = window.innerHeight > window.innerWidth;
      let camTargetX = 0;
      let camTargetY = isPortrait ? 3.5 : 3.0;
      let camTargetZ = isPortrait ? 9.2 : 7.2;
      let lookAtY = isPortrait ? 0.45 : 0.85;

      if (this.menuView === 'MARKETPLACE') {
        // Place the 3D ship cleanly in the upper showcase zone above the slide-up Garage drawer
        camTargetX = 0;
        camTargetY = isPortrait ? 2.4 : 2.3;
        camTargetZ = isPortrait ? 8.8 : 7.0;
        lookAtY = isPortrait ? -1.35 : -0.75;
      }

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, camTargetX, 5, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, camTargetY, 5, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, camTargetZ, 5, dt);
      this.camera.lookAt(camTargetX * 0.4, lookAtY, 0);

      this.shipLight.position.set(0, 3.5, 2.0);
      this.burnerLight.position.set(0, 1.2, 2.5);
      this.renderFrame();
      this.scheduleNextFrame();
      return;
    }

    if (this.mode === 'PAUSED' || this.mode === 'GAMEOVER') {
      this.updateParticles(dt);
      this.renderFrame();
      this.scheduleNextFrame();
      return;
    }

    // Active Flight Gameplay
    const stats = getActiveShipStats(this.profile, this.profile.selectedShip);
    const sector = resolveActiveSector(this.profile.selectedMap, this.distance);

    const wantsNitro = (this.keys.nitro || this.nitroLatched) && this.nitro > 1;
    this.isBoosting = wantsNitro || this.portalBoostTimer > 0;
    if (this.portalBoostTimer > 0) this.portalBoostTimer -= dt;

    if (wantsNitro && this.portalBoostTimer <= 0) {
      this.nitro = Math.max(0, this.nitro - stats.nitroBurnRate * dt);
      if (this.nitro <= 1 && this.nitroLatched) {
        this.nitroLatched = false;
      }
    } else if (!wantsNitro) {
      this.nitro = Math.min(100, this.nitro + stats.nitroRegenRate * dt);
    }

    const targetBase = Math.min(stats.maxSpeed, stats.baseSpeed + this.distance * 0.0085);
    const targetSpeed = this.isBoosting ? targetBase * CONFIG.nitroMultiplier : targetBase;
    this.speed = THREE.MathUtils.damp(this.speed, targetSpeed, 4.5, dt);

    const distDelta = this.speed * dt * 0.45;
    this.distance += distDelta;
    this.score += distDelta * 12 * this.combo;
    this.callbacks.onContractAdvance('distance', distDelta);

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }

    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.abilityCooldown > 0) this.abilityCooldown = Math.max(0, this.abilityCooldown - dt);
    if (this.abilityActiveTimer > 0) this.abilityActiveTimer = Math.max(0, this.abilityActiveTimer - dt);

    if (this.gameMode === 'TIME_ATTACK') {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.endGame('TIME BLITZ CLOCK EXPIRED');
        this.renderFrame();
        this.scheduleNextFrame();
        return;
      }
    }

    // Lateral & Vertical Physics
    let steerInput = this.analogSteer;
    if (this.keys.left) steerInput -= 1;
    if (this.keys.right) steerInput += 1;
    steerInput = Math.max(-1.25, Math.min(1.25, steerInput));

    this.shipVelX = THREE.MathUtils.damp(this.shipVelX, steerInput * stats.handling, 10, dt);
    this.shipX += this.shipVelX * dt;
    const maxBound = CONFIG.laneWidth * 0.56;
    this.shipX = Math.max(-maxBound, Math.min(maxBound, this.shipX));

    if (this.isJumping) {
      this.shipY += this.shipVelY * dt;
      this.shipVelY -= CONFIG.gravity * dt;
      if (this.shipY <= CONFIG.hoverHeight) {
        this.shipY = CONFIG.hoverHeight;
        this.shipVelY = 0;
        this.isJumping = false;
      }
    } else {
      this.shipY = CONFIG.hoverHeight + Math.sin(now * 0.008) * 0.08;
    }

    this.playerGroup.position.set(this.shipX, this.shipY, 0);
    this.playerGroup.rotation.set(0, 0, 0);

    this.shipRoll = THREE.MathUtils.damp(this.shipRoll, -steerInput * 0.58, 10, dt);
    this.shipPitch = THREE.MathUtils.damp(this.shipPitch, this.shipVelY * 0.025, 8, dt);
    this.shipMeshGroup.rotation.set(this.shipPitch, 0, this.shipRoll);

    const targetSweep = this.isBoosting ? 0.36 : 0;
    this.wingSweep = THREE.MathUtils.damp(this.wingSweep, targetSweep, 6, dt);
    if (this.shipParts.leftWingPivot) this.shipParts.leftWingPivot.rotation.y = this.wingSweep;
    if (this.shipParts.rightWingPivot) this.shipParts.rightWingPivot.rotation.y = -this.wingSweep;
    if (this.shipParts.omegaRing) this.shipParts.omegaRing.rotation.z += dt * 3.2;

    const plumeScale = this.isBoosting
      ? 1.65 + Math.sin(now * 0.05) * 0.25
      : 0.95 + Math.sin(now * 0.03) * 0.1;
    this.shipParts.plumes.forEach((p) => p.scale.set(1, plumeScale, 1));

    this.shieldBubble.visible =
      this.shieldCharges > 0 || this.invulnerableTimer > 0 || this.gameMode === 'ZEN';
    this.shieldBubble.rotation.y += dt * 1.4;

    this.scrollEnvironment(this.speed, dt);

    this.spawnTimer += dt * this.speed;
    if (this.spawnTimer > 38) {
      this.spawnTimer = 0;
      this.spawnObstacle(-380);
      if (Math.random() < 0.68) this.spawnCollectible(-400);
    }

    // Obstacles & Collisions
    const isCloaked = this.profile.selectedAbility === 'CLOAK' && this.abilityActiveTimer > 0;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.group.position.z += this.speed * dt;
      if (obs.type === 'CRUSHER') {
        obs.group.position.x = obs.baseX + Math.sin(now * 0.003 + obs.phase) * 3.5;
      }

      if (Math.abs(obs.group.position.z) < 1.85 && !isCloaked) {
        const dx = Math.abs(obs.group.position.x - this.shipX);
        const hitW = obs.width * 0.5 + 0.95;
        const clearedVertically = this.shipY - 0.55 > obs.height;

        if (dx < hitW && !clearedVertically) {
          if (this.gameMode === 'ZEN' || this.invulnerableTimer > 0) {
            this.spawnExplosion(obs.group.position, 0x00ffaa, 12);
            this.removeObstacleAt(i);
            continue;
          } else if (this.shieldCharges > 0) {
            this.shieldCharges--;
            this.invulnerableTimer = stats.invulnDuration;
            this.shakeIntensity = 0.55;
            this.sound.playShieldShatter();
            triggerHaptic(this.profile.haptics, [35, 30, 50]);
            this.callbacks.onCallout(
              'AEGIS SHIELD ABSORBED IMPACT!',
              'text-emerald-300 neon-text-cyan',
            );
            this.spawnExplosion(obs.group.position, 0x00ffaa, 22);
            this.removeObstacleAt(i);
            continue;
          } else {
            this.endGame('HULL INTEGRITY COMPROMISED');
            this.renderFrame();
            this.scheduleNextFrame();
            return;
          }
        } else if (dx < hitW + 2.3 && !obs.nearMissed) {
          obs.nearMissed = true;
          this.combo = Math.min(10, this.combo + 1);
          this.comboTimer = 4.5;
          this.nitro = Math.min(100, this.nitro + 12);
          this.score += 250 * this.combo;
          if (this.gameMode === 'TIME_ATTACK') this.timeRemaining += 2.0;
          this.sound.playNearMiss(this.combo);
          triggerHaptic(this.profile.haptics, 18);
          this.callbacks.onContractAdvance('nearmiss', 1);
          this.callbacks.onCallout(`NEAR MISS! x${this.combo}`, 'text-amber-300 neon-text-gold');
        }
      }

      if (obs.group.position.z > 22) {
        this.removeObstacleAt(i);
      }
    }

    // Collectibles & Magnet
    const vortexActive = this.profile.selectedAbility === 'VORTEX' && this.abilityActiveTimer > 0;
    const pullRadius = vortexActive ? 28 : stats.magnetRadius;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.group.position.z += this.speed * dt;
      col.group.rotation.y += dt * 2.8;

      const distToPlayer = Math.hypot(col.group.position.x - this.shipX, col.group.position.z);
      if (distToPlayer < pullRadius && col.group.position.z < 4) {
        col.group.position.x = THREE.MathUtils.damp(col.group.position.x, this.shipX, 8, dt);
      }

      if (
        Math.abs(col.group.position.z) < 2.1 &&
        Math.abs(col.group.position.x - this.shipX) < 2.2
      ) {
        if (col.type === 'CORE') {
          const creditGain = Math.round(
            25 * stats.creditMultiplier * sector.map.creditMult * (vortexActive ? 2 : 1),
          );
          this.runCredits += creditGain;
          this.score += 300 * this.combo;
          this.nitro = Math.min(100, this.nitro + 15);
          this.sound.playPickup('core');
          this.callbacks.onContractAdvance('cores', 1);
          this.callbacks.onCallout(`+₡ ${creditGain} ENERGY CORE`, 'text-amber-300 neon-text-gold');
        } else if (col.type === 'SHIELD') {
          this.shieldCharges = Math.min(this.maxShieldCharges + 1, this.shieldCharges + 1);
          this.sound.playPickup('shield');
          this.callbacks.onCallout('AEGIS SHIELD RECHARGED!', 'text-emerald-300 neon-text-cyan');
        } else {
          this.portalBoostTimer = 3.2;
          this.nitro = 100;
          this.sound.playPickup('portal');
          this.callbacks.onContractAdvance('portals', 1);
          this.callbacks.onCallout('HYPER-WARP PORTAL OVERDRIVE!', 'text-cyan-300 neon-text-cyan');
        }
        triggerHaptic(this.profile.haptics, 22);
        this.spawnExplosion(col.group.position, 0xffc800, 12);
        this.removeCollectibleAt(i);
        continue;
      }

      if (col.group.position.z > 20) {
        this.removeCollectibleAt(i);
      }
    }

    this.updateParticles(dt);

    // Multi-angle camera + screen shake
    const isPortrait = window.innerHeight > window.innerWidth;
    let camX = this.shipX * 0.65;
    let camY = isPortrait ? 5.2 : 4.1;
    let camZ = isPortrait ? 13.5 : 10.5;
    if (this.cameraModeIdx === 1) {
      camX = this.shipX * 0.82;
      camY = 2.6;
      camZ = 6.4;
    } else if (this.cameraModeIdx === 2) {
      camX = this.shipX;
      camY = this.shipY + 0.55;
      camZ = -0.6;
    }

    if (this.shakeIntensity > 0) {
      camX += (Math.random() - 0.5) * this.shakeIntensity;
      camY += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.2);
    }

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, camX, 8, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, camY, 8, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, camZ, 8, dt);
    this.camera.lookAt(this.shipX * 0.5, this.shipY + 0.4, -28);

    this.shipLight.position.set(this.shipX, this.shipY + 2.5, 1.5);
    this.burnerLight.position.set(this.shipX, this.shipY + 0.5, 2.5);

    this.sound.setEngineTelemetry(this.speed / stats.maxSpeed, this.isBoosting, true);

    if (now - this.lastTelemetryEmit >= 45) {
      this.emitTelemetry();
      this.lastTelemetryEmit = now;
    }

    this.renderFrame();
    this.scheduleNextFrame();
  };

  private scrollEnvironment(speed: number, dt: number): void {
    const dz = speed * dt;
    this.roadGridHelper.position.z += dz;
    if (this.roadGridHelper.position.z > -130) this.roadGridHelper.position.z -= 10;

    for (let i = 0; i < this.envArches.length; i++) {
      const arch = this.envArches[i];
      arch.position.z += dz;
      if (arch.position.z > 20) arch.position.z -= 12 * 35;
    }

    const posAttr = this.starGeo.attributes.position as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] += dz * 1.4;
      if (pos[i + 2] > 15) pos[i + 2] -= 380;
    }
    posAttr.needsUpdate = true;

    this.dysonCore.rotation.y += dt * 0.25;
    this.dysonRing.rotation.z -= dt * 0.4;
  }

  private updateBiomeColors(dt: number): void {
    const { map } = resolveActiveSector(this.profile.selectedMap, this.distance);
    this.tmpFog.setHex(map.fogColor);
    this.tmpGrid.setHex(map.gridColor);
    this.tmpAccent.setHex(map.accentColor);

    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.lerp(this.tmpFog, dt * 2.5);
    }
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.lerp(this.tmpFog, dt * 2.5);
    }
    const gridMat = this.roadGridHelper.material as THREE.LineBasicMaterial;
    gridMat.color.lerp(this.tmpGrid, dt * 3.0);
    this.railMat.color.lerp(this.tmpGrid, dt * 3.0);
    this.archMat.color.lerp(this.tmpAccent, dt * 3.0);
    (this.dysonCore.material as THREE.MeshBasicMaterial).color.lerp(this.tmpAccent, dt * 3.0);
    (this.dysonRing.material as THREE.MeshBasicMaterial).color.lerp(this.tmpGrid, dt * 3.0);
  }

  private spawnObstacle(zPos: number): void {
    const types: ObstacleEntity['type'][] = ['HURDLE', 'PILLAR', 'CRUSHER', 'GATE'];
    const type = types[Math.floor(Math.random() * types.length)];
    const group = new THREE.Group();
    const halfLane = CONFIG.laneWidth * 0.52;
    let xPos = (Math.random() - 0.5) * (halfLane * 1.75);
    let width = 3.2;
    let height = 3.2;

    if (type === 'HURDLE') {
      width = 4.6;
      height = 1.35;
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.5, 0.35), this.obstacleDarkMat);
      postL.position.set(-width / 2, 0.75, 0);
      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.5, 0.35), this.obstacleDarkMat);
      postR.position.set(width / 2, 0.75, 0);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.32, 0.32), this.obstacleGlowMat);
      beam.position.set(0, 1.05, 0);
      group.add(postL, postR, beam);
    } else if (type === 'PILLAR') {
      width = 2.1;
      height = 6.5;
      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.85, height, 12),
        this.obstacleDarkMat,
      );
      core.position.y = height / 2;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.05, 0.14, 8, 24),
        this.obstacleGlowMat,
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 2.2;
      group.add(core, ring);
    } else if (type === 'CRUSHER') {
      width = 2.6;
      height = 4.2;
      const block = new THREE.Mesh(new THREE.OctahedronGeometry(1.45, 0), this.obstacleGlowMat);
      block.position.y = 2.0;
      group.add(block);
    } else {
      xPos = (Math.random() - 0.5) * (halfLane * 1.2);
      width = 3.2;
      height = 5.2;
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.65),
        this.obstacleGlowMat,
      );
      pillar.position.y = height / 2;
      group.add(pillar);
    }

    group.position.set(xPos, 0, zPos);
    this.scene.add(group);
    this.obstacles.push({
      group,
      type,
      baseX: xPos,
      width,
      height,
      nearMissed: false,
      phase: Math.random() * Math.PI * 2,
    });
  }

  private spawnCollectible(zPos: number): void {
    const r = Math.random();
    const type: CollectibleEntity['type'] = r < 0.72 ? 'CORE' : r < 0.88 ? 'PORTAL' : 'SHIELD';
    const group = new THREE.Group();
    const halfLane = CONFIG.laneWidth * 0.5;
    const xPos = (Math.random() - 0.5) * (halfLane * 1.7);

    if (type === 'CORE') {
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), this.coreMat);
      mesh.position.y = 1.4;
      group.add(mesh);
    } else if (type === 'SHIELD') {
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 1), this.shieldItemMat);
      mesh.position.y = 1.5;
      group.add(mesh);
    } else {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.16, 10, 28), this.portalItemMat);
      ring.position.y = 2.1;
      group.add(ring);
    }

    group.position.set(xPos, 0, zPos);
    this.scene.add(group);
    this.collectibles.push({ group, type });
  }

  private spawnExplosion(pos: THREE.Vector3, colorHex = 0x00f3ff, count = 24): void {
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 26,
          Math.random() * 16 + 2,
          (Math.random() - 0.5) * 26,
        ),
        life: 0.65 + Math.random() * 0.35,
      });
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.addScaledVector(p.vel, dt);
      p.life -= dt;
      p.mesh.scale.multiplyScalar(0.95);
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  private removeObstacleAt(index: number): void {
    const obs = this.obstacles[index];
    disposeShipGeometries(obs.group);
    this.scene.remove(obs.group);
    this.obstacles.splice(index, 1);
  }

  private removeCollectibleAt(index: number): void {
    const col = this.collectibles[index];
    disposeShipGeometries(col.group);
    this.scene.remove(col.group);
    this.collectibles.splice(index, 1);
  }

  private clearWorldEntities(): void {
    while (this.obstacles.length > 0) this.removeObstacleAt(this.obstacles.length - 1);
    while (this.collectibles.length > 0) this.removeCollectibleAt(this.collectibles.length - 1);
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles = [];
  }

  private endGame(reasonText: string): void {
    this.mode = 'GAMEOVER';
    this.endReason = reasonText;
    this.nitroLatched = false;
    this.keys.nitro = false;
    this.sound.playCrash();
    this.sound.setEngineTelemetry(0, false, false);
    triggerHaptic(this.profile.haptics, [60, 50, 120]);
    this.tmpVec.copy(this.playerGroup.position);
    this.spawnExplosion(this.tmpVec, 0xff2a55, 36);

    this.isNewRecord = this.score > this.profile.highScore;
    this.callbacks.onRunComplete({
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      runCredits: Math.floor(this.runCredits),
      reason: reasonText,
      isNewRecord: this.isNewRecord,
    });
    this.emitTelemetry(true);
  }

  private emitTelemetry(_force = false): void {
    const { map, sectorIndex } = resolveActiveSector(this.profile.selectedMap, this.distance);
    this.callbacks.onTelemetry({
      mode: this.mode,
      gameMode: this.gameMode,
      cameraMode: CAMERA_MODES[this.cameraModeIdx],
      quality: this.quality,
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      runCredits: Math.floor(this.runCredits),
      speedKmh: Math.floor(this.speed * 7.8),
      combo: this.combo,
      comboTimer: this.comboTimer,
      nitro: this.nitro,
      isBoosting: this.isBoosting,
      isCloaked: this.profile.selectedAbility === 'CLOAK' && this.abilityActiveTimer > 0,
      shieldCharges: this.shieldCharges,
      maxShieldCharges: this.maxShieldCharges,
      timeRemaining: this.timeRemaining,
      abilityCooldown: this.abilityCooldown,
      abilityMaxCooldown: this.abilityMaxCooldown,
      abilityActiveTimer: this.abilityActiveTimer,
      activeBiomeName: map.name,
      sectorIndex,
      endReason: this.endReason,
      isNewRecord: this.isNewRecord,
      gyroAngle: this.gyroCurrentAngle,
      isNitroLatched: this.nitroLatched,
    });
  }

  // ==================== PUBLIC CONTROLS & API ====================

  updateProfile(nextProfile: PlayerProfile): void {
    const shipChanged = nextProfile.selectedShip !== this.profile.selectedShip;
    const liveryChanged = nextProfile.selectedLivery !== this.profile.selectedLivery;
    this.profile = nextProfile;
    if (shipChanged && this.mode !== 'MENU') {
      this.shipParts = buildPlayerHoverJet(
        this.shipMeshGroup,
        this.shipMaterials,
        nextProfile.selectedShip,
      );
    }
    if (liveryChanged) {
      applyLiveryColors(this.shipMaterials, nextProfile.selectedLivery);
    }
  }

  setMenuView(view: MenuView): void {
    this.menuView = view;
  }

  setGameMode(gm: GameMode): void {
    this.gameMode = gm;
    this.emitTelemetry(true);
  }

  setPreviewShip(shipId: ShipId): void {
    if (this.previewShipId === shipId) return;
    this.previewShipId = shipId;
    this.shipParts = buildPlayerHoverJet(this.shipMeshGroup, this.shipMaterials, shipId);
  }

  setLivery(liveryId: LiveryId): void {
    applyLiveryColors(this.shipMaterials, liveryId);
  }

  applyQuality(q: QualityPreset): void {
    this.quality = q;
    const dpr = window.devicePixelRatio || 1;
    if (this.isSoftwareGl) {
      this.renderer.setPixelRatio(1);
    } else if (q === 'LOW') {
      this.renderer.setPixelRatio(1);
    } else if (q === 'HIGH') {
      this.renderer.setPixelRatio(Math.min(dpr, 1.5));
      if (this.bloomPass) this.bloomPass.strength = 0.72;
    } else {
      this.renderer.setPixelRatio(Math.min(dpr, 2.0));
      if (this.bloomPass) this.bloomPass.strength = 1.05;
    }
    this.emitTelemetry(true);
  }

  cycleQuality(): QualityPreset {
    const order: QualityPreset[] = ['LOW', 'HIGH', 'ULTRA'];
    const next = order[(order.indexOf(this.quality) + 1) % order.length];
    this.applyQuality(next);
    return next;
  }

  cycleCamera(): void {
    this.cameraModeIdx = (this.cameraModeIdx + 1) % CAMERA_MODES.length;
    this.emitTelemetry(true);
  }

  startGame(): void {
    this.sound.init();
    this.clearWorldEntities();

    const stats = getActiveShipStats(this.profile, this.profile.selectedShip);
    const abObj =
      ABILITIES_CATALOG.find((a) => a.id === this.profile.selectedAbility) || ABILITIES_CATALOG[0];

    this.shipParts = buildPlayerHoverJet(
      this.shipMeshGroup,
      this.shipMaterials,
      this.profile.selectedShip,
    );
    this.hangarPlatformGroup.visible = false;

    this.mode = 'PLAYING';
    this.score = 0;
    this.distance = 0;
    this.runCredits = 0;
    this.speed = stats.baseSpeed;
    this.combo = 1;
    this.comboTimer = 0;
    this.nitro = 100;
    this.isBoosting = false;
    this.nitroLatched = false;
    this.keys = { left: false, right: false, nitro: false };
    this.portalBoostTimer = 0;
    this.shieldCharges = stats.maxShields;
    this.maxShieldCharges = stats.maxShields;
    this.invulnerableTimer = 0;
    this.timeRemaining = 60.0;
    this.abilityCooldown = 0;
    this.abilityMaxCooldown = abObj.cooldown;
    this.abilityActiveTimer = 0;
    this.shipX = 0;
    this.shipY = CONFIG.hoverHeight;
    this.shipVelX = 0;
    this.shipVelY = 0;
    this.shipRoll = 0;
    this.shipPitch = 0;
    this.isJumping = false;
    this.isNewRecord = false;

    this.playerGroup.position.set(0, CONFIG.hoverHeight, 0);
    this.playerGroup.rotation.set(0, 0, 0);
    this.shipMeshGroup.rotation.set(0, 0, 0);

    for (let z = -90; z >= -360; z -= 42) {
      this.spawnObstacle(z);
      if (Math.random() < 0.65) this.spawnCollectible(z - 20);
    }

    this.emitTelemetry(true);
  }

  pauseGame(): void {
    if (this.mode !== 'PLAYING') return;
    this.mode = 'PAUSED';
    this.sound.setEngineTelemetry(0, false, false);
    this.emitTelemetry(true);
  }

  resumeGame(): void {
    if (this.mode !== 'PAUSED') return;
    this.mode = 'PLAYING';
    this.lastTime = performance.now();
    this.emitTelemetry(true);
  }

  returnToMenu(view: MenuView = 'MAIN'): void {
    this.mode = 'MENU';
    this.menuView = view;
    this.nitroLatched = false;
    this.keys = { left: false, right: false, nitro: false };
    this.previewShipId = this.profile.selectedShip;
    this.shipParts = buildPlayerHoverJet(
      this.shipMeshGroup,
      this.shipMaterials,
      this.profile.selectedShip,
    );
    this.hangarPlatformGroup.visible = true;
    this.sound.setEngineTelemetry(0, false, false);
    this.emitTelemetry(true);
  }

  triggerJump(): void {
    if (this.mode !== 'PLAYING') return;
    if (!this.isJumping && this.shipY <= CONFIG.hoverHeight + 0.08) {
      this.isJumping = true;
      this.shipVelY = CONFIG.jumpVelocity;
      this.sound.playJump();
      triggerHaptic(this.profile.haptics, 15);
    }
  }

  triggerAbility(): void {
    if (this.mode !== 'PLAYING') return;
    if (this.abilityCooldown > 0 || this.abilityActiveTimer > 0) return;

    const ab =
      ABILITIES_CATALOG.find((a) => a.id === this.profile.selectedAbility) || ABILITIES_CATALOG[0];
    this.abilityActiveTimer = ab.duration;
    this.abilityMaxCooldown = ab.cooldown;
    this.abilityCooldown = ab.cooldown;

    this.sound.playAbility();
    triggerHaptic(this.profile.haptics, [25, 40, 35]);
    this.callbacks.onContractAdvance('ability', 1);

    if (ab.id === 'EMP') {
      this.callbacks.onCallout('EMP SHOCKWAVE DETONATED!', 'text-cyan-300 neon-text-cyan');
      this.shakeIntensity = 0.6;
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        if (obs.group.position.z < 12 && obs.group.position.z > -165) {
          this.spawnExplosion(obs.group.position, 0x00f3ff, 14);
          this.removeObstacleAt(i);
          this.score += 150 * this.combo;
        }
      }
    } else if (ab.id === 'CLOAK') {
      this.callbacks.onCallout('QUANTUM PHASE CLOAK ENGAGED!', 'text-purple-300 neon-text-pink');
    } else {
      this.callbacks.onCallout('GRAVITON VORTEX ACTIVE (2X ₡)!', 'text-amber-300 neon-text-gold');
    }
    this.emitTelemetry(true);
  }

  setKey(key: 'left' | 'right' | 'nitro', active: boolean): void {
    this.keys[key] = active;
  }

  toggleNitroLatch(): void {
    this.nitroLatched = !this.nitroLatched;
    this.emitTelemetry(true);
  }

  setNitroLatched(latched: boolean): void {
    this.nitroLatched = latched;
    this.emitTelemetry(true);
  }

  setAnalogSteer(value: number): void {
    this.analogSteer = value;
  }

  setGyroInput(rawAngle: number): void {
    if (this.gyroBaselineGamma === null) this.gyroBaselineGamma = rawAngle;
    const delta = rawAngle - this.gyroBaselineGamma;
    this.gyroCurrentAngle = delta;
    this.analogSteer = Math.max(-1, Math.min(1, delta / 24)) * this.profile.sensitivity;
  }

  recenterGyro(): void {
    this.gyroBaselineGamma = null;
    this.gyroCurrentAngle = 0;
    this.emitTelemetry(true);
  }

  addTurntableDrag(deltaX: number): void {
    if (this.mode !== 'MENU') return;
    this.turntableUserYaw += deltaX * 0.012;
  }

  getCurrentRunCredits(): number {
    return Math.floor(this.runCredits);
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.clearWorldEntities();
    disposeShipGeometries(this.shipMeshGroup);

    this.shipMaterials.hullPrimaryMat.dispose();
    this.shipMaterials.hullSecondaryMat.dispose();
    this.shipMaterials.hullTrimMat.dispose();
    this.shipMaterials.canopyGlassMat.dispose();
    this.shipMaterials.burnerGlowMat.dispose();
    this.shipMaterials.hullPanelTex.dispose();

    this.obstacleGlowMat.dispose();
    this.obstacleDarkMat.dispose();
    this.coreMat.dispose();
    this.shieldItemMat.dispose();
    this.portalItemMat.dispose();
    this.particleGeo.dispose();
    this.starGeo.dispose();

    this.envRenderTarget?.dispose();
    this.composer?.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
