import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {createUiTestScene, LINES, NOTIF} from './scene.js';
import {Captions} from '../../ui/Captions.jsx';
import {AlertBanner, MessageBanner} from '../../ui/Overlays.jsx';
import {SoundMix} from '../../audio/SoundMix.jsx';
import {reportValidation} from '../../engine/validate.js';

const OUT = '#bfe6ff'; // voz que vem de fora da cena (porta, alto-falante)

export const UiTestVideo = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const canvas = useRef(null);
  const scene = useRef(null);
  const t = frame / fps;
  useLayoutEffect(() => {
    scene.current = createUiTestScene(canvas.current, width, height);
    reportValidation(scene.current, frame);
    return () => scene.current.dispose();
  }, [width, height]);
  useLayoutEffect(() => { scene.current.render(t); }, [frame, fps]);
  const close = t > 6.6 && t < 10.9; // celular em close: legenda mais abaixo
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <canvas ref={canvas} width={width} height={height} style={{width: '100%', height: '100%'}} />
      <AlertBanner t={t} at={0.1} until={3.6} lines={[
        {text: 'ATENÇÃO, FUNCIONÁRIOS:', at: 0.25, big: true}, {text: 'Invasor no prédio', at: 1.15}, {text: 'NÃO abram a porta', at: 2.1}]} />
      <MessageBanner t={t} msg={NOTIF} until={10.9} />
      {/* som: alerta junto com o banner; fundo contínuo baixa sozinho nas falas (LINES); coração sobe com a tensão */}
      <SoundMix lines={LINES} sfx={[{file: 'sfx/alerta.wav', at: 0.1}]}
        heart={[[0, 0.15], [3.6, 0.3], [8.7, 0.45], [12.5, 0.6]]} drops={[[10.6, 11.1]]} />
      <Captions t={t} lines={LINES} top={close ? '75.5%' : '62%'}
        colors={{pa: OUT, porta: OUT, lia: '#ffe04a'}} italic={{pa: true, porta: true}}
        tags={{pa: 'ALTO-FALANTE', porta: 'ATRÁS DA PORTA · VOZ DO RUI?'}} />
    </AbsoluteFill>
  );
};
