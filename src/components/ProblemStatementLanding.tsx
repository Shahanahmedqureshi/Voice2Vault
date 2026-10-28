import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  FileText,
  AlertTriangle,
  Cpu,
  ShieldCheck,
  Play,
  RotateCcw,
  Maximize2,
  ChevronRight,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  Layers,
  Mic,
  Database,
  ExternalLink
} from 'lucide-react';

interface ProblemStatementLandingProps {
  onEnterWorkspace: () => void;
  onRunDemoScenario: (index: number) => void;
}

// Stage configuration for 3D Camera & Highlights
interface StageInfo {
  id: number;
  title: string;
  shortTitle: string;
  tag: string;
  cameraPos: [number, number, number];
  targetPos: [number, number, number];
  stat: string;
  statLabel: string;
  summary: string;
  problemDetails: string[];
  solutionDetails: string[];
}

const STAGES: StageInfo[] = [
  {
    id: 0,
    title: 'The MSME Kirana Supply Chain Dilemma',
    shortTitle: 'Full Pipeline',
    tag: 'Macro Overview',
    cameraPos: [0, 8, 22],
    targetPos: [0, 0, 0],
    stat: '₹42,000 Cr+',
    statLabel: 'Annual MSME Reconciliation & Credit Leakage in India',
    summary:
      'Across 6.3+ crore Indian retailers and field distributors, 90%+ of orders and udhaar (credit) happen via verbal voice notes and handwritten "kachha" bills. High-frequency trade creates silent arithmetic leaks and unverified credit buildup.',
    problemDetails: [
      'Field sales agents dictate orders in rapid Hindi/Hinglish while driving or unloading crates.',
      'Paper receipts are scribbled on informal slips without GSTIN or standardized item codes.',
      'Back-office entry takes 2–14 days, during which disputed udhaar turns into bad debt.'
    ],
    solutionDetails: [
      'Voice2Vault executes an autonomous 4-agent DAG pipeline directly from voice or bill photo.',
      'Every number is checked against strict arithmetic rules before writing to double-entry ledger.',
      'Zero hallucinations: human-in-the-loop gates protect against unauthorized credit limit breaches.'
    ]
  },
  {
    id: 1,
    title: 'Stage 1: Informal Voice Notes & Kachha Bills',
    shortTitle: '1. Kachha Orders',
    tag: 'Data Ingestion Chaos',
    cameraPos: [-9, 3, 9],
    targetPos: [-9, 0, 0],
    stat: '94%',
    statLabel: 'Field orders placed via WhatsApp voice or paper chits',
    summary:
      'Field agents speak in mixed vernacular: "Sharma Kirana pe 20 peti oil utaara, 42000 bill, 15000 mila, baaki 29000". Traditional ERPs require rigid keyboard entry, so agents delay logging until the weekend.',
    problemDetails: [
      'Speech recognition often hallucinates or translates colloquial terms into wrong catalog items.',
      'Paper chits are easily stained, lost, or misinterpreted by accounting staff.',
      'No instant confirmation counterfoil is delivered to the retailer at delivery time.'
    ],
    solutionDetails: [
      'VyaparAI preserves the exact verbatim quote with evidentiary citations.',
      'Multimodal OCR parses handwritten chits into itemized line items.',
      'Catalog matching uses deterministic Levenshtein fuzzy matching with user confirmation gates.'
    ]
  },
  {
    id: 2,
    title: 'Stage 2: The Silent Mathematical & Credit Leak',
    shortTitle: '2. Math & Udhaar Trap',
    tag: 'Financial Exposure',
    cameraPos: [-3, 3, 8],
    targetPos: [-3, 0, 0],
    stat: '₹2,000 / bill',
    statLabel: 'Typical unverified arithmetic discrepancy that slips into ledgers',
    summary:
      'Notice the math in the order: Bill was ₹42,000. Paid was ₹15,000. Balance was verbally stated as ₹29,000. But mathematically 42,000 - 15,000 = ₹27,000! That is a ₹2,000 discrepancy that creates customer disputes or lost inventory.',
    problemDetails: [
      'Mental math errors by exhausted field reps cause compounding ledger discrepancies.',
      'Retailers default on informal credit because neither side can prove the transaction breakdown.',
      'Distributors unknowingly exceed customer credit limits because ledgers are out of sync.'
    ],
    solutionDetails: [
      'Deterministic Math Auditor compares Stated Balance vs Computed Balance instantaneously.',
      'Flagged anomalies trigger a mandatory human-in-the-loop approval gate before ledger write.',
      'Credit Risk Agent enforces strict credit limit ceiling policies (e.g. max ₹50,000 exposure).'
    ]
  },
  {
    id: 3,
    title: 'Stage 3: Autonomous 4-Agent Orchestration',
    shortTitle: '3. 4-Agent Mesh',
    tag: 'AI Architecture',
    cameraPos: [3.5, 3.5, 9],
    targetPos: [3.5, 0, 0],
    stat: '850ms',
    statLabel: 'End-to-end DAG execution time on open-weight Gemma-4',
    summary:
      'Instead of an opaque single-prompt chatbot, Voice2Vault splits business logic into a directed acyclic graph (DAG) executed by four specialized autonomous agents with independent validation gates.',
    problemDetails: [
      'Single LLM prompts frequently invent prices, forget tax calculations, or hallucinate customers.',
      'Failure in one step in traditional systems breaks the entire accounting workflow.',
      'No audit trail of which model took what business action.'
    ],
    solutionDetails: [
      'Intake Parser -> Math Auditor -> Credit Risk Agent -> Master Ledger Agent.',
      'Self-healing automated tool retries for transient database or network glitches.',
      'Complete cryptographic SHA-256 state tracking and transparent activity logs.'
    ]
  },
  {
    id: 4,
    title: 'Stage 4: Verified Double-Entry Vault & Instant Trust',
    shortTitle: '4. Reconciled Vault',
    tag: 'Audit-Proof Resolution',
    cameraPos: [9.5, 3, 9],
    targetPos: [9.5, 0, 0],
    stat: '100%',
    statLabel: 'T-Account Balance & Instant WhatsApp Parchi Delivery',
    summary:
      'The verified transaction is committed to immutable dual-entry T-accounts (Sales Dr/Cr and Party Udhaar) with an instant Hinglish WhatsApp parchi counterfoil queued for the shopkeeper.',
    problemDetails: [
      'End-of-month reconciliations take weeks of phone calls and ledger comparisons.',
      'Shopkeepers dispute verbal balances claimed by distributors weeks later.',
      'Loss of merchant trust and high churn of wholesale accounts.'
    ],
    solutionDetails: [
      'Instant WhatsApp counterfoil: "शर्मा किराना: आज का बिल ₹42,000, जमा ₹15,000, बाकी ₹27,000"।',
      'Dual-entry accounting compliant with standard Tally Prime and Zoho Books export.',
      'Complete zero-discrepancy ledger audit trail accessible anytime.'
    ]
  }
];

// Helper to detect SwiftShader or software rendering
function checkSoftwareGl(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) return false;
  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
  return /swiftshader|llvmpipe|softpipe|mesa.*software/i.test(renderer);
}

// Procedural texture for the Kachha Bill Paper
function createKachhaBillTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 700;
  const ctx = canvas.getContext('2d')!;

  // Warm parchment background
  ctx.fillStyle = '#F4EEDB';
  ctx.fillRect(0, 0, 512, 700);

  // Subtle paper grain/grid lines
  ctx.strokeStyle = '#E3D7BA';
  ctx.lineWidth = 1;
  for (let y = 50; y < 700; y += 32) {
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(482, y);
    ctx.stroke();
  }

  // Margin line in light red
  ctx.strokeStyle = '#E89085';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(90, 20);
  ctx.lineTo(90, 680);
  ctx.stroke();

  // Header Title
  ctx.fillStyle = '#2B231D';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('SHARMA KIRANA STORE', 110, 80);

  ctx.fillStyle = '#6E5D4F';
  ctx.font = '14px sans-serif';
  ctx.fillText('Indore Mandi Hub · Kachha Parchi #941', 110, 105);

  // Bill items (Handwritten style simulation)
  ctx.fillStyle = '#1F2A38';
  ctx.font = '16px monospace';
  ctx.fillText('1. Fortune Oil 15L (20 peti) = ₹42,000', 110, 175);
  ctx.fillText('2. Cash Received on Spot     = ₹15,000', 110, 240);

  // Math Discrepancy Alert in red handwritten style
  ctx.fillStyle = '#B3261E';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('Baaki Udhaar = ₹29,000 (??)', 110, 305);

  ctx.fillStyle = '#6E5D4F';
  ctx.font = '13px sans-serif';
  ctx.fillText('(Actual: 42,000 - 15,000 = ₹27,000)', 110, 335);
  ctx.fillText('Discrepancy: +₹2,000 Error in chit!', 110, 355);

  // Stamp: UNVERIFIED / KACHHA
  ctx.save();
  ctx.translate(330, 480);
  ctx.rotate(-0.25);
  ctx.strokeStyle = '#D32F2F';
  ctx.lineWidth = 4;
  ctx.strokeRect(-110, -35, 220, 70);
  ctx.fillStyle = '#D32F2F';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('कच्चा बिल / NO GST', 0, 5);
  ctx.font = '12px sans-serif';
  ctx.fillText('AUDIT REQUIRED', 0, 24);
  ctx.restore();

  // Signature line
  ctx.strokeStyle = '#3E2F26';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(110, 620);
  ctx.bezierCurveTo(150, 605, 200, 640, 260, 615);
  ctx.stroke();
  ctx.fillStyle = '#6E5D4F';
  ctx.font = '12px sans-serif';
  ctx.fillText('Field Agent Signature (Unchecked)', 110, 645);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Procedural texture for the Reconciled Double-Entry Vault
function createVaultTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Brushed steel base
  ctx.fillStyle = '#234E7D';
  ctx.fillRect(0, 0, 512, 512);

  // Circular dial ring
  ctx.strokeStyle = '#F4EEDB';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(256, 256, 180, 0, Math.PI * 2);
  ctx.stroke();

  // Dial ticks
  ctx.strokeStyle = '#8A8F96';
  ctx.lineWidth = 3;
  for (let i = 0; i < 360; i += 15) {
    const angle = (i * Math.PI) / 180;
    const x1 = 256 + Math.cos(angle) * 165;
    const y1 = 256 + Math.sin(angle) * 165;
    const x2 = 256 + Math.cos(angle) * 180;
    const y2 = 256 + Math.sin(angle) * 180;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Safe logo and text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VOICE 2 VAULT', 256, 220);

  ctx.fillStyle = '#81C784';
  ctx.font = '16px monospace';
  ctx.fillText('T-ACCOUNT RECONCILED', 256, 255);
  ctx.fillText('₹27,000 VERIFIED', 256, 280);

  ctx.fillStyle = '#CFC9BC';
  ctx.font = '13px sans-serif';
  ctx.fillText('ZERO-DISCREPANCY AUDIT', 256, 310);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const ProblemStatementLanding: React.FC<ProblemStatementLandingProps> = ({
  onEnterWorkspace,
  onRunDemoScenario
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeStageId, setActiveStageId] = useState<number>(0);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Camera transition target refs
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 8, 22));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  const currentStage = useMemo(
    () => STAGES.find((s) => s.id === activeStageId) || STAGES[0],
    [activeStageId]
  );

  const handleStageSelect = (stageId: number) => {
    setActiveStageId(stageId);
    const stage = STAGES.find((s) => s.id === stageId) || STAGES[0];
    targetCamPos.current.set(...stage.cameraPos);
    targetLookAt.current.set(...stage.targetPos);
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 600;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F6F4EF'); // Warm paper aesthetic matching the app
    scene.fog = new THREE.FogExp2('#F6F4EF', 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 8, 22);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    container.appendChild(renderer.domElement);

    // Check Software GL
    const isSoftware = checkSoftwareGl(renderer.getContext());
    if (isSoftware) {
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
    }

    // 3. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Keep above floor
    controls.minDistance = 4;
    controls.maxDistance = 35;
    controls.target.set(0, 0, 0);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight('#FFFFFF', 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#FFFFFF', '#E4E0D6', 0.6);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight('#FFF9EE', 1.4);
    dirLight.position.set(12, 18, 14);
    dirLight.castShadow = !isSoftware;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Colored accent spot lights for the stages
    const blueSpot = new THREE.PointLight('#234E7D', 2.0, 12);
    blueSpot.position.set(3.5, 4, 2);
    scene.add(blueSpot);

    const redWarningSpot = new THREE.PointLight('#A7321F', 1.5, 10);
    redWarningSpot.position.set(-3, 3, 2);
    scene.add(redWarningSpot);

    const goldSpot = new THREE.PointLight('#2F6B3F', 1.8, 10);
    goldSpot.position.set(9.5, 3.5, 2);
    scene.add(goldSpot);

    // 5. Floor Ground with subtle engineering grid
    const floorGeo = new THREE.PlaneGeometry(60, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#ECE8DE',
      roughness: 0.9,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.2;
    floor.receiveShadow = !isSoftware;
    scene.add(floor);

    // Architectural Grid Lines
    const grid = new THREE.GridHelper(50, 50, '#CFC9BC', '#E4E0D6');
    grid.position.y = -2.19;
    scene.add(grid);

    // 6. Interactive Raycasting Targets Group
    const interactiveObjects: THREE.Object3D[] = [];

    // --- NODE 1: Kachha Bill Paper & Broken Voice Waves (x = -9) ---
    const node1Group = new THREE.Group();
    node1Group.position.set(-9, 0, 0);
    node1Group.name = 'node_kachha';

    // Kachha Bill Mesh
    const billTexture = createKachhaBillTexture();
    const billGeo = new THREE.PlaneGeometry(2.4, 3.2, 16, 16);
    // Add subtle bend to paper
    const posAttr = billGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      posAttr.setZ(i, Math.sin(x * 1.5) * 0.12 + Math.cos(y * 1.2) * 0.08);
    }
    billGeo.computeVertexNormals();

    const billMat = new THREE.MeshStandardMaterial({
      map: billTexture,
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    const billMesh = new THREE.Mesh(billGeo, billMat);
    billMesh.castShadow = !isSoftware;
    billMesh.receiveShadow = !isSoftware;
    billMesh.rotation.y = 0.2;
    node1Group.add(billMesh);
    interactiveObjects.push(billMesh);

    // Sound wave pulsating rings (Voice Note)
    const waveRings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(1.6 + i * 0.45, 0.02, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: '#234E7D',
        transparent: true,
        opacity: 0.4 - i * 0.1
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = -1.2;
      node1Group.add(ringMesh);
      waveRings.push(ringMesh);
    }

    // Pedestal for Node 1
    const pedGeo1 = new THREE.CylinderGeometry(1.6, 1.8, 0.4, 32);
    const pedMat = new THREE.MeshStandardMaterial({ color: '#E4E0D6', roughness: 0.7 });
    const ped1 = new THREE.Mesh(pedGeo1, pedMat);
    ped1.position.y = -2.0;
    ped1.receiveShadow = !isSoftware;
    node1Group.add(ped1);

    scene.add(node1Group);

    // --- NODE 2: Mathematical Leakage & Udhaar Imbalance (x = -3) ---
    const node2Group = new THREE.Group();
    node2Group.position.set(-3, 0, 0);
    node2Group.name = 'node_math_leak';

    // Balance Scale Central Pillar
    const scalePillarGeo = new THREE.CylinderGeometry(0.12, 0.15, 2.6, 16);
    const scalePillarMat = new THREE.MeshStandardMaterial({ color: '#5B6168', metalness: 0.7, roughness: 0.3 });
    const scalePillar = new THREE.Mesh(scalePillarGeo, scalePillarMat);
    scalePillar.position.y = -0.6;
    scalePillar.castShadow = !isSoftware;
    node2Group.add(scalePillar);

    // Scale Beam (Tilted significantly due to ₹2,000 discrepancy)
    const beamGeo = new THREE.BoxGeometry(3.0, 0.1, 0.15);
    const beamMat = new THREE.MeshStandardMaterial({ color: '#234E7D', metalness: 0.5, roughness: 0.4 });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = 0.7;
    beamMesh.rotation.z = -0.28; // Visibly tilted to show math imbalance
    node2Group.add(beamMesh);

    // Left Pan: Stated Baaki ₹29,000 (Overweight & Erroneous)
    const panGeo = new THREE.CylinderGeometry(0.65, 0.55, 0.15, 24);
    const panMatError = new THREE.MeshStandardMaterial({ color: '#FAE8E4', roughness: 0.4 });
    const leftPan = new THREE.Mesh(panGeo, panMatError);
    leftPan.position.set(-1.3, 0.2, 0);
    leftPan.castShadow = !isSoftware;
    node2Group.add(leftPan);
    interactiveObjects.push(leftPan);

    // Red Discrepancy Beacon
    const leakGeo = new THREE.OctahedronGeometry(0.35);
    const leakMat = new THREE.MeshStandardMaterial({
      color: '#A7321F',
      emissive: '#A7321F',
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const leakMesh = new THREE.Mesh(leakGeo, leakMat);
    leakMesh.position.set(-1.3, 0.7, 0);
    node2Group.add(leakMesh);
    interactiveObjects.push(leakMesh);

    // Right Pan: Actual Balance ₹27,000
    const panMatNormal = new THREE.MeshStandardMaterial({ color: '#E8EFF7', roughness: 0.4 });
    const rightPan = new THREE.Mesh(panGeo, panMatNormal);
    rightPan.position.set(1.3, 1.1, 0);
    rightPan.castShadow = !isSoftware;
    node2Group.add(rightPan);

    // Pedestal for Node 2
    const ped2 = new THREE.Mesh(pedGeo1, pedMat);
    ped2.position.y = -2.0;
    ped2.receiveShadow = !isSoftware;
    node2Group.add(ped2);

    scene.add(node2Group);

    // --- NODE 3: The 4-Agent Autonomous Mesh (x = 3.5) ---
    const node3Group = new THREE.Group();
    node3Group.position.set(3.5, 0, 0);
    node3Group.name = 'node_agents';

    // Central DAG Supervisor Core (Rotating crystalline polyhedron)
    const coreGeo = new THREE.IcosahedronGeometry(1.0, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: '#234E7D',
      emissive: '#1B4068',
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: false
    });
    const supervisorCore = new THREE.Mesh(coreGeo, coreMat);
    supervisorCore.position.y = 0.2;
    supervisorCore.castShadow = !isSoftware;
    node3Group.add(supervisorCore);
    interactiveObjects.push(supervisorCore);

    // Outer Wireframe Cage
    const cageGeo = new THREE.IcosahedronGeometry(1.3, 1);
    const cageMat = new THREE.MeshBasicMaterial({ color: '#CFC9BC', wireframe: true, transparent: true, opacity: 0.6 });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    cageMesh.position.y = 0.2;
    node3Group.add(cageMesh);

    // 4 Orbiting Agent Satellites
    const agentColors = ['#234E7D', '#9A5B00', '#A7321F', '#2F6B3F'];
    const agentNames = ['Intake Parser', 'Math Auditor', 'Credit Risk Agent', 'Master Ledger Agent'];
    const agentSatellites: THREE.Mesh[] = [];

    agentColors.forEach((color, i) => {
      const satGeo = new THREE.SphereGeometry(0.28, 16, 16);
      const satMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        metalness: 0.6,
        roughness: 0.3
      });
      const satMesh = new THREE.Mesh(satGeo, satMat);
      satMesh.castShadow = !isSoftware;
      satMesh.name = `agent_${i}_${agentNames[i]}`;
      node3Group.add(satMesh);
      agentSatellites.push(satMesh);
      interactiveObjects.push(satMesh);
    });

    // Orbit Ring
    const orbitGeo = new THREE.TorusGeometry(2.1, 0.015, 16, 80);
    const orbitMat = new THREE.MeshBasicMaterial({ color: '#CFC9BC', transparent: true, opacity: 0.7 });
    const orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
    orbitMesh.position.y = 0.2;
    orbitMesh.rotation.x = Math.PI / 2.3;
    node3Group.add(orbitMesh);

    // Pedestal for Node 3
    const ped3 = new THREE.Mesh(pedGeo1, pedMat);
    ped3.position.y = -2.0;
    ped3.receiveShadow = !isSoftware;
    node3Group.add(ped3);

    scene.add(node3Group);

    // --- NODE 4: The Reconciled Vault & Instant WhatsApp Trust (x = 9.5) ---
    const node4Group = new THREE.Group();
    node4Group.position.set(9.5, 0, 0);
    node4Group.name = 'node_vault';

    // Digital Bank Safe Door
    const vaultTexture = createVaultTexture();
    const vaultDoorGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.45, 32);
    const vaultDoorMat = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      map: vaultTexture,
      metalness: 0.6,
      roughness: 0.25
    });
    const vaultDoor = new THREE.Mesh(vaultDoorGeo, vaultDoorMat);
    vaultDoor.rotation.x = Math.PI / 2;
    vaultDoor.position.y = 0.3;
    vaultDoor.castShadow = !isSoftware;
    node4Group.add(vaultDoor);
    interactiveObjects.push(vaultDoor);

    // Outer Heavy Frame
    const frameGeo = new THREE.BoxGeometry(3.2, 3.2, 0.5);
    const frameMat = new THREE.MeshStandardMaterial({ color: '#E4E0D6', metalness: 0.3, roughness: 0.6 });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(0, 0.3, -0.25);
    frameMesh.castShadow = !isSoftware;
    node4Group.add(frameMesh);

    // Green Verification Halo
    const haloGeo = new THREE.TorusGeometry(1.6, 0.04, 16, 64);
    const haloMat = new THREE.MeshStandardMaterial({
      color: '#2F6B3F',
      emissive: '#2F6B3F',
      emissiveIntensity: 0.7,
      roughness: 0.3
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.set(0, 0.3, 0.25);
    node4Group.add(haloMesh);

    // WhatsApp Counterfoil Tablet Floating Nearby
    const tabGeo = new THREE.BoxGeometry(0.9, 1.5, 0.06);
    const tabMat = new THREE.MeshStandardMaterial({ color: '#E7F1EA', roughness: 0.3 });
    const tabMesh = new THREE.Mesh(tabGeo, tabMat);
    tabMesh.position.set(1.6, 1.0, 0.6);
    tabMesh.rotation.y = -0.35;
    tabMesh.rotation.z = 0.1;
    node4Group.add(tabMesh);
    interactiveObjects.push(tabMesh);

    // Pedestal for Node 4
    const ped4 = new THREE.Mesh(pedGeo1, pedMat);
    ped4.position.y = -2.0;
    ped4.receiveShadow = !isSoftware;
    node4Group.add(ped4);

    scene.add(node4Group);

    // --- PIPELINE DATA CONDUIT (Glowing flow between stages) ---
    const curvePoints = [
      new THREE.Vector3(-9, -0.8, 0),
      new THREE.Vector3(-6, -0.5, 0.8),
      new THREE.Vector3(-3, -0.8, 0),
      new THREE.Vector3(0.2, -0.3, -0.6),
      new THREE.Vector3(3.5, -0.8, 0),
      new THREE.Vector3(6.5, -0.4, 0.7),
      new THREE.Vector3(9.5, -0.8, 0)
    ];
    const conduitCurve = new THREE.CatmullRomCurve3(curvePoints);

    const conduitGeo = new THREE.TubeGeometry(conduitCurve, 100, 0.04, 8, false);
    const conduitMat = new THREE.MeshBasicMaterial({ color: '#CFC9BC' });
    const conduitMesh = new THREE.Mesh(conduitGeo, conduitMat);
    scene.add(conduitMesh);

    // Flowing particles along the conduit
    const particleCount = 28;
    const particleGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: '#234E7D' });
    const particles: { mesh: THREE.Mesh; t: number; speed: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const pMesh = new THREE.Mesh(particleGeo, particleMat);
      scene.add(pMesh);
      particles.push({
        mesh: pMesh,
        t: i / particleCount,
        speed: 0.0035 + (i % 3) * 0.001
      });
    }

    // --- RAYCASTING FOR INTERACTIVITY ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects, false);

      if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
        const hit = intersects[0].object;
        let parent = hit.parent;
        while (parent && !parent.name) {
          parent = parent.parent;
        }
        if (parent?.name) {
          setHoveredNode(parent.name);
        }
      } else {
        renderer.domElement.style.cursor = 'default';
        setHoveredNode(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        let parent = hit.parent;
        while (parent && !parent.name) {
          parent = parent.parent;
        }
        if (parent?.name === 'node_kachha') handleStageSelect(1);
        else if (parent?.name === 'node_math_leak') handleStageSelect(2);
        else if (parent?.name === 'node_agents') handleStageSelect(3);
        else if (parent?.name === 'node_vault') handleStageSelect(4);
      }
    };

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    // --- RESIZE HANDLER ---
    const handleResize = () => {
      if (!mountRef.current) return;
      width = mountRef.current.clientWidth;
      height = mountRef.current.clientHeight || 600;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // --- ANIMATION LOOP ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth camera interpolation towards target
      camera.position.lerp(targetCamPos.current, 0.05);
      currentLookAt.current.lerp(targetLookAt.current, 0.05);
      controls.target.copy(currentLookAt.current);
      controls.update();

      // Node 1: Wave pulsation
      waveRings.forEach((ring, idx) => {
        const scale = 1 + Math.sin(time * 3 + idx * 1.2) * 0.12;
        ring.scale.set(scale, scale, scale);
      });
      billMesh.rotation.y = 0.2 + Math.sin(time * 0.8) * 0.08;

      // Node 2: Red leak beacon pulsing
      leakMesh.rotation.y += delta * 1.5;
      leakMesh.rotation.x = Math.sin(time * 2) * 0.3;
      const pulse = 0.8 + Math.sin(time * 5) * 0.25;
      leakMesh.scale.set(pulse, pulse, pulse);

      // Node 3: Core rotation & orbiting satellites
      supervisorCore.rotation.x += delta * 0.4;
      supervisorCore.rotation.y += delta * 0.6;
      cageMesh.rotation.y -= delta * 0.2;

      agentSatellites.forEach((sat, i) => {
        const angle = time * 0.8 + (i * Math.PI) / 2;
        const radius = 2.1;
        sat.position.x = Math.cos(angle) * radius;
        sat.position.z = Math.sin(angle) * radius * 0.4; // elliptical
        sat.position.y = 0.2 + Math.sin(time * 2 + i) * 0.2;
      });

      // Node 4: Vault safe door slow breathing & counterfoil tablet float
      vaultDoor.rotation.z += delta * 0.05;
      tabMesh.position.y = 1.0 + Math.sin(time * 1.5) * 0.1;

      // Conduit particles movement
      particles.forEach((p) => {
        p.t = (p.t + p.speed) % 1;
        const pt = conduitCurve.getPointAt(p.t);
        p.mesh.position.copy(pt);
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);

      // Dispose Three.js resources
      billGeo.dispose();
      billMat.dispose();
      billTexture.dispose();
      vaultTexture.dispose();
      vaultDoorGeo.dispose();
      vaultDoorMat.dispose();
      frameGeo.dispose();
      frameMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      conduitGeo.dispose();
      conduitMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="w-full bg-[#F6F4EF] min-h-[calc(100vh-56px)] flex flex-col justify-between select-none">
      {/* 1. Header Banner & Problem Summary */}
      <div className="border-b border-[#E4E0D6] bg-white px-6 py-5">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] font-semibold text-[#234E7D] bg-[#E8EFF7] px-2 py-0.5 rounded-[4px] uppercase tracking-wider">
                Problem Statement & Architecture
              </span>
              <span className="text-[12px] text-[#8A8F96]">·</span>
              <span className="text-[12px] text-[#5B6168]">
                Indian MSME Kirana & FMCG Distribution Diagnosis
              </span>
            </div>
            <h1 className="text-[22px] md:text-[26px] font-semibold text-[#1F2328] tracking-tight leading-tight">
              The ₹42,000 Cr Invisible Leak in Informal Field Sales
            </h1>
            <p className="text-[14px] text-[#5B6168] mt-1 max-w-3xl">
              Why traditional enterprise accounting breaks when orders are spoken in Hinglish and written on kachha slips — and how Voice2Vault’s deterministic 4-agent DAG closes the reconciliation gap.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onRunDemoScenario(2)}
              className="px-3.5 py-2 text-[13px] font-medium text-[#234E7D] bg-[#E8EFF7] hover:bg-[#D5E3F2] border border-[#234E7D]/20 rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-[#234E7D]" />
              <span>Simulate Sharma Kirana Math Leak</span>
            </button>

            <button
              onClick={onEnterWorkspace}
              className="px-4 py-2 text-[14px] font-medium text-white bg-[#234E7D] hover:bg-[#1B4068] rounded-[6px] shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Open Live Agent Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main 3D Canvas Area with Overlaid Information HUD */}
      <div className="relative flex-1 w-full min-h-[580px] bg-[#F6F4EF] overflow-hidden">
        {/* Three.js Canvas Container */}
        <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top Left HUD: Selected Stage Narrative Card */}
        <div className="absolute top-6 left-6 max-w-[420px] w-full bg-white/95 backdrop-blur-xs border border-[#E4E0D6] rounded-[8px] p-5 shadow-xs pointer-events-auto">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold text-[#234E7D] bg-[#E8EFF7] px-2 py-0.5 rounded-[4px] uppercase tracking-wider">
              {currentStage.tag}
            </span>
            <span className="text-[12px] font-mono text-[#8A8F96]">
              Stage {currentStage.id} / 4
            </span>
          </div>

          <h2 className="text-[17px] font-semibold text-[#1F2328] mb-1 leading-snug">
            {currentStage.title}
          </h2>

          <div className="my-3 p-3 bg-[#FBFAF7] border border-[#E4E0D6] rounded-[6px]">
            <div className="text-[20px] font-bold text-[#1F2328] tabular-nums leading-tight">
              {currentStage.stat}
            </div>
            <div className="text-[12px] text-[#5B6168] mt-0.5">
              {currentStage.statLabel}
            </div>
          </div>

          <p className="text-[13px] text-[#5B6168] leading-relaxed mb-3">
            {currentStage.summary}
          </p>

          <div className="border-t border-[#E4E0D6] pt-3 flex flex-col gap-1.5 text-[12px]">
            <div className="font-semibold text-[#A7321F] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Core Vulnerability:</span>
            </div>
            <ul className="list-disc pl-4 text-[#5B6168] space-y-1">
              {currentStage.problemDetails.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            <div className="font-semibold text-[#2F6B3F] flex items-center gap-1.5 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Voice2Vault Resolution:</span>
            </div>
            <ul className="list-disc pl-4 text-[#5B6168] space-y-1">
              {currentStage.solutionDetails.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Top Right HUD: 3D Guide & Stage Quick Controls */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-xs border border-[#E4E0D6] rounded-[6px] px-3 py-2 text-[12px] text-[#5B6168] shadow-xs flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#234E7D] animate-ping" />
              <span>Interactive 3D Stage</span>
            </span>
            <span>·</span>
            <span>Drag to rotate · Scroll to zoom</span>
            <button
              onClick={() => handleStageSelect(0)}
              title="Reset View"
              className="p-1 hover:text-[#1F2328] rounded-[4px] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Hover Callout if hovering a node */}
          {hoveredNode && (
            <div className="bg-[#1F2328] text-white text-[12px] px-3 py-1.5 rounded-[4px] shadow-md animate-fade-in flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E8EFF7]" />
              <span>Click to inspect {hoveredNode.replace('node_', '').toUpperCase()} in detail</span>
            </div>
          )}
        </div>

        {/* Bottom Interactive Stage Dock */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-sm border border-[#E4E0D6] rounded-[8px] p-2 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 pt-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#234E7D]" />
                <span className="text-[13px] font-medium text-[#1F2328]">
                  Supply Chain Breakdown & Pipeline Stages
                </span>
              </div>
              <button
                onClick={() => setIsDockCollapsed(!isDockCollapsed)}
                className="text-[12px] text-[#5B6168] hover:text-[#1F2328] cursor-pointer"
              >
                {isDockCollapsed ? 'Show Details' : 'Minimize'}
              </button>
            </div>

            {!isDockCollapsed && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {STAGES.map((stage) => {
                  const isSelected = stage.id === activeStageId;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => handleStageSelect(stage.id)}
                      className={`px-3 py-2 text-left rounded-[6px] border text-[12px] transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#234E7D] text-white border-[#234E7D] font-medium shadow-xs'
                          : 'bg-[#FBFAF7] text-[#5B6168] border-[#E4E0D6] hover:bg-white hover:text-[#1F2328]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{stage.shortTitle}</span>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white ml-1" />}
                      </div>
                      <div
                        className={`text-[10px] mt-0.5 truncate ${
                          isSelected ? 'text-white/80' : 'text-[#8A8F96]'
                        }`}
                      >
                        {stage.tag}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Problem vs Solution Detailed Matrix Row */}
      <div className="border-t border-[#E4E0D6] bg-white px-6 py-8">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-semibold text-[#1F2328]">
                Why Traditional Systems Fail In Indian Mandis & Retail
              </h2>
              <p className="text-[13px] text-[#5B6168] mt-1">
                Comparing manual paper entry, generic LLM chatbots, and Voice2Vault's deterministic agent architecture.
              </p>
            </div>
            <button
              onClick={onEnterWorkspace}
              className="h-[36px] px-4 text-[13px] font-medium text-white bg-[#234E7D] hover:bg-[#1B4068] rounded-[6px] transition-colors flex items-center gap-1.5 self-start cursor-pointer"
            >
              <span>Test Live in Console</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1: The Manual Status Quo */}
            <div className="border border-[#FAE8E4] bg-[#FFFBFB] rounded-[8px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-[4px] bg-[#FAE8E4] text-[#A7321F] flex items-center justify-center font-semibold text-xs">
                  01
                </div>
                <h3 className="text-[15px] font-semibold text-[#A7321F]">
                  Manual Kachha Paper & Diary
                </h3>
              </div>
              <ul className="text-[13px] text-[#5B6168] space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-[#A7321F] font-bold">✕</span>
                  <span><strong>Math Inaccuracies:</strong> 15-20% of handwritten additions or stated balances have math discrepancies.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#A7321F] font-bold">✕</span>
                  <span><strong>Disputed Credit:</strong> Shopkeepers claim "I paid ₹15,000 on Tuesday", with no verifiable proof or timestamp.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#A7321F] font-bold">✕</span>
                  <span><strong>High Reconciliation Lag:</strong> Weekly or monthly audits cause cash flow freezes and bad debt write-offs.</span>
                </li>
              </ul>
            </div>

            {/* Column 2: Generic LLM Chatbots */}
            <div className="border border-[#FBF0DC] bg-[#FFFCF7] rounded-[8px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-[4px] bg-[#FBF0DC] text-[#9A5B00] flex items-center justify-center font-semibold text-xs">
                  02
                </div>
                <h3 className="text-[15px] font-semibold text-[#9A5B00]">
                  Generic LLM Chatbots
                </h3>
              </div>
              <ul className="text-[13px] text-[#5B6168] space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-[#9A5B00] font-bold">✕</span>
                  <span><strong>Hallucinatory Math:</strong> Single-pass LLMs routinely produce subtle arithmetic errors in multistep deductions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9A5B00] font-bold">✕</span>
                  <span><strong>No Audit Trail:</strong> One giant output with no verifiable provenance, citations, or tool execution logs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9A5B00] font-bold">✕</span>
                  <span><strong>Silent Failure:</strong> When credit limits are exceeded, conversational bots write the sale anyway without safeguards.</span>
                </li>
              </ul>
            </div>

            {/* Column 3: Voice2Vault Agent Mesh */}
            <div className="border border-[#E8EFF7] bg-[#FBFCFE] rounded-[8px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-[4px] bg-[#E8EFF7] text-[#234E7D] flex items-center justify-center font-semibold text-xs">
                  03
                </div>
                <h3 className="text-[15px] font-semibold text-[#234E7D]">
                  Voice2Vault Autonomous Mesh
                </h3>
              </div>
              <ul className="text-[13px] text-[#5B6168] space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-[#2F6B3F] font-bold">✓</span>
                  <span><strong>Verbatim Evidence Quotes:</strong> Every customer name and item is tied directly to the exact spoken/OCR quote.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2F6B3F] font-bold">✓</span>
                  <span><strong>Deterministic Math Auditor:</strong> Code verifies total bill - paid = pending before touching the master ledger.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2F6B3F] font-bold">✓</span>
                  <span><strong>Human-in-the-Loop Safeguards:</strong> Discrepancies and credit limit breaches pause for manual approval with 1 click.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
