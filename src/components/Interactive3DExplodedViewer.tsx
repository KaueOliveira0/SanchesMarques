import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCw,
  Play,
  Pause,
  Layers,
  Maximize2,
  Minimize2,
  Eye,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Shield,
  Box,
} from 'lucide-react';
import {
  ARModelConfig,
  buildWindowDoor3DGroup,
  setExplodedViewProgress,
} from '../utils/arModelGenerator';

interface Interactive3DExplodedViewerProps {
  config: ARModelConfig;
  heightClass?: string;
  showTechnicalBadges?: boolean;
  onExplodeChange?: (progress: number) => void;
  initialAutoRotate?: boolean;
}

export const Interactive3DExplodedViewer: React.FC<Interactive3DExplodedViewerProps> = ({
  config,
  heightClass = 'h-[440px]',
  showTechnicalBadges = true,
  onExplodeChange,
  initialAutoRotate = true,
}) => {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);

  // Estados de controle interativo
  const [explodedProgress, setExplodedProgress] = useState<number>(0);
  const [targetExplodedProgress, setTargetExplodedProgress] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(initialAutoRotate);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [activeCameraView, setActiveCameraView] = useState<'ISO' | 'FRONT' | 'TOP' | 'SIDE'>('ISO');

  // Inicialização Three.js
  useEffect(() => {
    if (!canvasMountRef.current) return;
    const mount = canvasMountRef.current;
    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 440;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16); // slate-950 sofisticado
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(2.4, 1.8, 3.4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 0.5;
    controls.maxDistance = 12;

    // Otimização para celular / touch screens (1 dedo orbita, 2 dedos zoom/pan)
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    renderer.domElement.style.touchAction = 'none';

    // Autostart 360° turntable suave
    controls.autoRotate = initialAutoRotate;
    controls.autoRotateSpeed = 1.6;
    controlsRef.current = controls;

    // Pausa rotação automática caso o usuário faça arraste manual
    const onControlsStart = () => {
      if (controls.autoRotate) {
        controls.autoRotate = false;
        setIsAutoRotating(false);
      }
    };
    controls.addEventListener('start', onControlsStart);

    // Iluminação PBR balanceada
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.3);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(3.5, 5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.9);
    fillLight.position.set(-4, 3, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfef08a, 0.4);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Grid do chão
    const grid = new THREE.GridHelper(6, 16, 0x334155, 0x1e293b);
    grid.position.y = -0.001;
    scene.add(grid);

    // Loop de animação com interpolação suave da vista explodida
    let animationFrameId: number;
    let currentExp = 0;

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Interpolação exponencial suave do fator de explosão (sem solavancos)
      if (Math.abs(currentExp - targetExplodedProgress) > 0.001) {
        currentExp = THREE.MathUtils.damp(currentExp, targetExplodedProgress, 12, delta);
        if (modelGroupRef.current) {
          setExplodedViewProgress(modelGroupRef.current, currentExp);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount) return;
      const newW = mount.clientWidth;
      const newH = mount.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      controls.removeEventListener('start', onControlsStart);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      mount.innerHTML = '';
    };
  }, []);

  // Reconstrói a esquadria 3D quando a tipologia, medidas ou acabamentos mudam
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (modelGroupRef.current) {
      scene.remove(modelGroupRef.current);
      modelGroupRef.current = null;
    }

    const group = buildWindowDoor3DGroup(config);
    scene.add(group);
    modelGroupRef.current = group;

    // Aplica o progresso atual de explosão ao novo grupo
    setExplodedViewProgress(group, targetExplodedProgress);

    // Ajusta o ponto focal dos controles
    if (controlsRef.current) {
      const centerY = (config.heightMm / 1000) / 2;
      controlsRef.current.target.set(0, centerY, 0);
      controlsRef.current.update();
    }
  }, [config]);

  // Sincroniza estado de auto-rotação com os controles Three.js
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
    }
  }, [isAutoRotating]);

  // Altera o progresso de explosão
  const handleSliderChange = (val: number) => {
    setExplodedProgress(val);
    setTargetExplodedProgress(val / 100);
    onExplodeChange?.(val / 100);
  };

  // Alterna auto-rotação 360°
  const toggleAutoRotate = () => {
    setIsAutoRotating((prev) => !prev);
  };

  // Reseta câmera para ponto inicial e reativa 360°
  const handleResetCamera = (view: 'ISO' | 'FRONT' | 'TOP' | 'SIDE' = 'ISO') => {
    if (!cameraRef.current || !controlsRef.current) return;
    setActiveCameraView(view);
    const centerY = (config.heightMm / 1000) / 2;
    controlsRef.current.target.set(0, centerY, 0);

    const dist = Math.max(config.widthMm, config.heightMm) / 1000 * 1.8;

    switch (view) {
      case 'FRONT':
        cameraRef.current.position.set(0, centerY, dist);
        break;
      case 'SIDE':
        cameraRef.current.position.set(dist, centerY, 0);
        break;
      case 'TOP':
        cameraRef.current.position.set(0, centerY + dist, 0.05);
        break;
      case 'ISO':
      default:
        cameraRef.current.position.set(dist * 0.7, centerY + dist * 0.45, dist * 0.9);
        break;
    }

    controlsRef.current.update();
    setIsAutoRotating(true);
  };

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl flex flex-col select-none`}>
      {/* Canvas 3D Principal */}
      <div ref={canvasMountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Badges Superiores Flutuantes (Minimalistas) */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 shadow-lg">
          <Box className="w-4 h-4 text-blue-400" />
          <span>{config.typologyName}</span>
          <span className="text-slate-400 font-mono text-[11px] font-normal">
            ({config.widthMm} × {config.heightMm} mm)
          </span>
        </div>

        {isAutoRotating && (
          <div className="bg-blue-600/20 backdrop-blur-md border border-blue-500/40 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-300 flex items-center gap-1.5 shadow-md">
            <RotateCw className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Autostart 360° Ativo</span>
          </div>
        )}

        {targetExplodedProgress > 0 && (
          <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/40 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-amber-300 flex items-center gap-1.5 shadow-md">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Vista Explodida ({Math.round(targetExplodedProgress * 100)}%)</span>
          </div>
        )}
      </div>

      {/* Legenda Técnica de Componentes Explodidos (Aparece quando exploded > 0) */}
      {showTechnicalBadges && targetExplodedProgress > 0.1 && (
        <div className="absolute top-14 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 text-[11px] space-y-1.5 shadow-xl max-w-xs animate-in fade-in duration-300">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">
            Componentes Desmembrados:
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span>
              <strong>Marco:</strong> Soleira, cabeçalho e montantes
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>
              <strong>Folha:</strong> Travessas e montantes verticais
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
            <span>
              <strong>Vidro:</strong> Chapa autoportante ({config.glassTint})
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span>
              <strong>Acessórios:</strong> Puxadores inox e fechos
            </span>
          </div>
        </div>
      )}

      {/* Dica de Interação no Canto Superior Direito */}
      <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 shadow-sm pointer-events-none">
        <span>Arraste / Toque p/ orbitar • Pinça p/ zoom</span>
      </div>

      {/* Botão de Recolher/Expandir Dock Inferior (Zero Viewport Occlusion) */}
      <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-20">
        <button
          type="button"
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-[11px] font-semibold text-slate-300 hover:text-white transition-all shadow-lg flex items-center gap-1.5 cursor-pointer hover:border-slate-500"
        >
          {isDockCollapsed ? (
            <>
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Mostrar Controles</span>
            </>
          ) : (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Ocultar Controles (Zen)</span>
            </>
          )}
        </button>
      </div>

      {/* Dock Inferior Unificado de Controles (Conforme Three.js Skill) */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl p-2.5 sm:p-3.5 shadow-2xl transition-all duration-300 z-10 ${
          isDockCollapsed ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="flex flex-col gap-2">
          {/* Linha 1: Slider de Vista Explodida */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-slate-200">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span className="hidden sm:inline">Vista Explodida:</span>
              <span className="sm:hidden">Explodir:</span>
              <span className="text-amber-400 font-mono">{explodedProgress}%</span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={explodedProgress}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="flex-1 accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleSliderChange(0)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  explodedProgress === 0
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Esquadria Totalmente Montada"
              >
                0%
              </button>
              <button
                type="button"
                onClick={() => handleSliderChange(50)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  explodedProgress === 50
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Separação Intermediária"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleSliderChange(100)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  explodedProgress === 100
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Totalmente Explodida"
              >
                100%
              </button>
            </div>
          </div>

          {/* Linha 2: Controles de Autostart 360°, Câmera e Reset */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs gap-1.5 flex-wrap">
            {/* Botão Autostart / Rotação 360° */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleAutoRotate}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAutoRotating
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                }`}
              >
                {isAutoRotating ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Pausar Giro 360°</span>
                    <span className="xs:hidden">Pausar 360°</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden xs:inline">Autostart 360°</span>
                    <span className="xs:hidden">Giro 360°</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleResetCamera('ISO')}
                className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                title="Resetar visão e reiniciar órbita suave"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Resetar</span>
              </button>
            </div>

            {/* Presets de Ângulo de Câmera */}
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400 mr-0.5 hidden md:inline">Câmera:</span>
              <button
                type="button"
                onClick={() => handleResetCamera('ISO')}
                className={`px-1.5 sm:px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeCameraView === 'ISO' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">Perspectiva</span>
                <span className="sm:hidden">ISO</span>
              </button>
              <button
                type="button"
                onClick={() => handleResetCamera('FRONT')}
                className={`px-1.5 sm:px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeCameraView === 'FRONT' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">Frontal</span>
                <span className="sm:hidden">Frente</span>
              </button>
              <button
                type="button"
                onClick={() => handleResetCamera('SIDE')}
                className={`px-1.5 sm:px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeCameraView === 'SIDE' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">Lateral</span>
                <span className="sm:hidden">Lado</span>
              </button>
              <button
                type="button"
                onClick={() => handleResetCamera('TOP')}
                className={`px-1.5 sm:px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeCameraView === 'TOP' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">Planta (Topo)</span>
                <span className="sm:hidden">Topo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
