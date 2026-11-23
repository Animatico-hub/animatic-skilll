import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {createDemoScene, LINES} from './scene.js';
import {Captions} from '../../ui/Captions.jsx';
import {SeriesLayer, endCardFilter, CoverOverlay} from '../../ui/series/SeriesUI.jsx';
import {reportValidation} from '../../engine/validate.js';
import {SoundMix} from '../../audio/SoundMix.jsx';

// Exemplo do formato de série sobre a demo aprovada: 10 s de cena + 0,3 s de preto + 3 s de cartela.
export const SERIE = {
  name: 'Copa', part: 2, place: 'COPA · 3º ANDAR', clockStart: '07:48',
  chose: {icon: '🔒', label: 'TRANCAR A PORTA'},
  a: {color: '#2e9e5b', icon: '🚪', label: 'ABRIR O ARQUIVO'},
  b: {color: '#d8343a', icon: '📞', label: 'CHAMAR A SEGURANÇA'},
};
export const END_CARD = 10.3;

export const DemoSerieVideo = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const canvas = useRef(null);
  const scene = useRef(null);
  const t = frame / fps;

  useLayoutEffect(() => {
    scene.current = createDemoScene(canvas.current, width, height);
    reportValidation(scene.current, frame);
    return () => scene.current.dispose();
  }, [width, height]);
  useLayoutEffect(() => { scene.current.render(Math.min(t, 10)); }, [frame, fps]);

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <canvas ref={canvas} width={width} height={height}
        style={{width: '100%', height: '100%', filter: endCardFilter(t, END_CARD)}} />
      {t < END_CARD - 0.3 && <Captions t={t} lines={LINES} colors={{lia: '#ffe04a'}} />}
      <SeriesLayer t={t} serie={SERIE} endAt={END_CARD} />
      {/* fundo contínuo (baixa nas falas) + grave da cartela; depois: npm run master e npm run qa -- ... --serie --comp DemoSerie */}
      <SoundMix lines={LINES} endAt={END_CARD} heart={[[0, 0.15], [8, 0.35]]} />
    </AbsoluteFill>
  );
};

// Capa de exemplo (parte 2+). Num episódio real, use uma cena nova feita para a capa.
export const DemoCover = () => {
  const {width, height} = useVideoConfig();
  const canvas = useRef(null);
  useLayoutEffect(() => {
    const s = createDemoScene(canvas.current, width, height);
    s.render(8.6);
    return () => s.dispose();
  }, [width, height]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <canvas ref={canvas} width={width} height={height} style={{width: '100%', height: '100%'}} />
      <CoverOverlay serie={SERIE} hook={['ELA TRANCOU', 'ONTEM *MESMO*?']} choice={['ABRIR', 'CHAMAR']} />
    </AbsoluteFill>
  );
};
