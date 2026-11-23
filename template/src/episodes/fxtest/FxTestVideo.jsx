import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {createFxTestScene} from './scene.js';
import {SoundMix} from '../../audio/SoundMix.jsx';
import {reportValidation} from '../../engine/validate.js';

// Som dos 4 efeitos (Pacote 5). O trecho submerso (12–16 s) só soa abafado depois do master:
//   npm run master -- out/fxtest.mp4 out/fxtest_final.mp4 --abafar 12-16
const SOM = {
  loops: [
    {file: 'sfx/fogo.wav', from: 0, until: 4.4, fadeIn: 0.4, keys: [[0, 0.7], [2.6, 1]]},
    {file: 'sfx/respira.wav', from: 0, until: 4.2, vol: 0.45},
    {file: 'sfx/chuva.wav', from: 3.8, until: 8.2, vol: 0.8},
    {file: 'sfx/agua.wav', from: 8.0, until: 12.3, keys: [[8, 0.45], [9.5, 0.7], [11, 1]], fadeOut: 0.2},
    {file: 'sfx/bolhas.wav', from: 12.2, until: 16, vol: 0.8},
  ],
  sfx: [
    {file: 'sfx/trovao.mp3', at: 4.9, vol: 0.7},
    {file: 'sfx/trovao.mp3', at: 6.55, vol: 0.85},
    {file: 'sfx/vidro_trinca.mp3', at: 6.62, dur: 1.3},   // cortado no tamanho da cena
    {file: 'sfx/mergulho.wav', at: 11.95, vol: 0.9},
  ],
  heart: [[0, 0], [11.9, 0], [12.3, 0.8], [16, 0.8]],
};

export const FxTestVideo = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const canvas = useRef(null);
  const scene = useRef(null);
  useLayoutEffect(() => {
    scene.current = createFxTestScene(canvas.current, width, height);
    reportValidation(scene.current, frame);
    return () => scene.current.dispose();
  }, [width, height]);
  useLayoutEffect(() => { scene.current.render(frame / fps); }, [frame, fps]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <canvas ref={canvas} width={width} height={height} style={{width: '100%', height: '100%'}} />
      <SoundMix {...SOM} />
    </AbsoluteFill>
  );
};
