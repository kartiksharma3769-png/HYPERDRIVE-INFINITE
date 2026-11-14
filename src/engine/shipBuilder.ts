import * as THREE from 'three';
import { LIVERIES_CATALOG } from '../data/catalogs';
import type { LiveryId, ShipId } from '../types/game';

export interface ShipParts {
  leftWingPivot: THREE.Group | null;
  rightWingPivot: THREE.Group | null;
  plumes: THREE.Mesh[];
  shockRings: THREE.Mesh[];
  omegaRing: THREE.Mesh | null;
}

export interface ShipMaterialSet {
  hullPrimaryMat: THREE.MeshPhysicalMaterial;
  hullSecondaryMat: THREE.MeshStandardMaterial;
  hullTrimMat: THREE.MeshBasicMaterial;
  canopyGlassMat: THREE.MeshPhysicalMaterial;
  burnerGlowMat: THREE.MeshBasicMaterial;
  hullPanelTex: THREE.CanvasTexture;
}

export function createHullBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#383838';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

export function createShipMaterialSet(
  liveryId: LiveryId,
  isSoftwareGl: boolean,
  maxAnisotropy: number,
): ShipMaterialSet {
  const hullPanelTex = createHullBumpTexture(maxAnisotropy);

  const hullPrimaryMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.22,
    clearcoat: 0.65,
    clearcoatRoughness: 0.15,
    bumpMap: hullPanelTex,
    bumpScale: 0.015,
  });

  const hullSecondaryMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.72,
    roughness: 0.45,
  });

  const hullTrimMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

  const canopyGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x06162e,
    metalness: 0.15,
    roughness: 0.08,
    transmission: isSoftwareGl ? 0 : 0.55,
    transparent: true,
    opacity: isSoftwareGl ? 0.55 : 0.78,
    clearcoat: 1.0,
  });

  const burnerGlowMat = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.88,
  });

  const materials: ShipMaterialSet = {
    hullPrimaryMat,
    hullSecondaryMat,
    hullTrimMat,
    canopyGlassMat,
    burnerGlowMat,
    hullPanelTex,
  };

  applyLiveryColors(materials, liveryId);
  return materials;
}

export function applyLiveryColors(materials: ShipMaterialSet, liveryId: LiveryId): void {
  const liv = LIVERIES_CATALOG.find((l) => l.id === liveryId) || LIVERIES_CATALOG[0];
  materials.hullPrimaryMat.color.setHex(liv.primary);
  materials.hullPrimaryMat.metalness = liv.metalness;
  materials.hullPrimaryMat.roughness = liv.roughness;
  materials.hullSecondaryMat.color.setHex(liv.secondary);
  materials.hullTrimMat.color.setHex(liv.trim);
  materials.burnerGlowMat.color.setHex(liv.trim);
}

export function disposeShipGeometries(group: THREE.Group): void {
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
    }
  });
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
}

function buildCockpitAndExhaust(
  root: THREE.Group,
  materials: ShipMaterialSet,
  parts: ShipParts,
  nozzlePositions: Array<[number, number, number]>,
): void {
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.56, 20, 14), materials.canopyGlassMat);
  canopy.scale.set(0.82, 0.58, 2.35);
  canopy.position.set(0, 0.38, -0.35);
  root.add(canopy);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), materials.hullSecondaryMat);
  helmet.position.set(0, 0.42, -0.25);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.16), materials.hullTrimMat);
  visor.position.set(0, 0.43, -0.34);
  root.add(helmet, visor);

  nozzlePositions.forEach((pos) => {
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.3, 0.45, 16),
      materials.hullSecondaryMat,
    );
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(pos[0], pos[1], pos[2]);
    root.add(nozzle);

    const plume = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.65, 16), materials.burnerGlowMat);
    plume.rotation.x = Math.PI / 2;
    plume.position.set(pos[0], pos[1], pos[2] + 0.95);
    root.add(plume);
    parts.plumes.push(plume);

    const ring = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.19, 16), materials.hullTrimMat);
    ring.position.set(pos[0], pos[1], pos[2] + 0.55);
    root.add(ring);
    parts.shockRings.push(ring);
  });
}

export function buildPlayerHoverJet(
  shipMeshGroup: THREE.Group,
  materials: ShipMaterialSet,
  shipId: ShipId,
): ShipParts {
  disposeShipGeometries(shipMeshGroup);

  const parts: ShipParts = {
    leftWingPivot: null,
    rightWingPivot: null,
    plumes: [],
    shockRings: [],
    omegaRing: null,
  };

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.68, 2.9, 6), materials.hullPrimaryMat);
  nose.rotation.x = -Math.PI / 2;
  nose.scale.set(1.15, 0.55, 1.0);
  nose.position.set(0, 0.1, -2.05);
  shipMeshGroup.add(nose);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.85, 2.8, 8), materials.hullPrimaryMat);
  body.rotation.x = -Math.PI / 2;
  body.scale.set(1.25, 0.58, 1.0);
  body.position.set(0, 0.12, 0.25);
  shipMeshGroup.add(body);

  if (shipId === 'PHANTOM') {
    ([-1, 1] as const).forEach((dir) => {
      const pivot = new THREE.Group();
      pivot.position.set(dir * 0.7, 0.08, 0.45);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.09, 1.15), materials.hullPrimaryMat);
      wing.position.set(dir * 1.05, 0, -0.35);
      wing.rotation.y = dir * 0.38;
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 1.4), materials.hullTrimMat);
      tip.position.set(dir * 2.15, 0.05, -0.55);
      pivot.add(wing, tip);
      shipMeshGroup.add(pivot);
      if (dir === -1) parts.leftWingPivot = pivot;
      else parts.rightWingPivot = pivot;
    });
    buildCockpitAndExhaust(shipMeshGroup, materials, parts, [
      [-0.48, 0.1, 1.65],
      [0, 0.14, 1.75],
      [0.48, 0.1, 1.65],
    ]);
  } else if (shipId === 'TITAN') {
    ([-1, 1] as const).forEach((dir) => {
      const boom = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.36, 3.6, 8),
        materials.hullSecondaryMat,
      );
      boom.rotation.x = -Math.PI / 2;
      boom.position.set(dir * 1.25, 0.12, 0.1);
      const armorWing = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.16, 1.7),
        materials.hullPrimaryMat,
      );
      armorWing.position.set(dir * 1.55, 0.1, 0.35);
      const trimStrip = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.05, 0.14),
        materials.hullTrimMat,
      );
      trimStrip.position.set(dir * 1.55, 0.2, -0.35);
      shipMeshGroup.add(boom, armorWing, trimStrip);
    });
    buildCockpitAndExhaust(shipMeshGroup, materials, parts, [
      [-1.25, 0.12, 1.85],
      [-0.45, 0.1, 1.68],
      [0.45, 0.1, 1.68],
      [1.25, 0.12, 1.85],
    ]);
  } else if (shipId === 'SERAPHIM') {
    const ringWing = new THREE.Mesh(
      new THREE.TorusGeometry(1.85, 0.11, 10, 40),
      materials.hullPrimaryMat,
    );
    ringWing.rotation.x = Math.PI / 2;
    ringWing.scale.set(1.15, 0.72, 1.0);
    ringWing.position.set(0, 0.15, 0.35);
    const glowRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.86, 0.04, 8, 40),
      materials.hullTrimMat,
    );
    glowRing.rotation.x = Math.PI / 2;
    glowRing.scale.set(1.15, 0.72, 1.0);
    glowRing.position.set(0, 0.18, 0.35);
    shipMeshGroup.add(ringWing, glowRing);
    parts.omegaRing = glowRing;
    buildCockpitAndExhaust(shipMeshGroup, materials, parts, [
      [-0.38, 0.12, 1.7],
      [0.38, 0.12, 1.7],
    ]);
  } else if (shipId === 'OMEGA') {
    ([-1, 1] as const).forEach((dir) => {
      const pivot = new THREE.Group();
      pivot.position.set(dir * 0.9, 0.15, 0.2);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 1.25), materials.hullPrimaryMat);
      blade.position.set(dir * 1.05, 0, 0.1);
      blade.rotation.y = -dir * 0.28;
      const energyEdge = new THREE.Mesh(
        new THREE.BoxGeometry(2.15, 0.05, 0.12),
        materials.hullTrimMat,
      );
      energyEdge.position.set(dir * 1.05, 0.04, -0.48);
      energyEdge.rotation.y = -dir * 0.28;
      pivot.add(blade, energyEdge);
      shipMeshGroup.add(pivot);
      if (dir === -1) parts.leftWingPivot = pivot;
      else parts.rightWingPivot = pivot;
    });
    const coreRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.06, 10, 32),
      materials.hullTrimMat,
    );
    coreRing.position.set(0, 0.52, 0.65);
    shipMeshGroup.add(coreRing);
    parts.omegaRing = coreRing;
    buildCockpitAndExhaust(shipMeshGroup, materials, parts, [
      [-0.58, 0.12, 1.7],
      [0, 0.15, 1.82],
      [0.58, 0.12, 1.7],
    ]);
  } else {
    ([-1, 1] as const).forEach((dir) => {
      const pivot = new THREE.Group();
      pivot.position.set(dir * 0.65, 0.08, 0.25);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.09, 1.25), materials.hullPrimaryMat);
      wing.position.set(dir * 1.0, 0, 0.15);
      wing.rotation.y = -dir * 0.26;
      const strake = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.04, 0.12), materials.hullTrimMat);
      strake.position.set(dir * 1.0, 0.05, -0.35);
      strake.rotation.y = -dir * 0.26;
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.72, 0.95),
        materials.hullSecondaryMat,
      );
      fin.position.set(dir * 0.62, 0.42, 0.95);
      fin.rotation.z = -dir * 0.28;
      shipMeshGroup.add(fin);
      pivot.add(wing, strake);
      shipMeshGroup.add(pivot);
      if (dir === -1) parts.leftWingPivot = pivot;
      else parts.rightWingPivot = pivot;
    });
    buildCockpitAndExhaust(shipMeshGroup, materials, parts, [
      [-0.45, 0.1, 1.68],
      [0.45, 0.1, 1.68],
    ]);
  }

  return parts;
}
