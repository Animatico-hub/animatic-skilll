import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {createCamTestScene} from './scene.js';
import {reportValidation} from '../../engine/validate.js';

export const CamTestVideo = ({mode}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const canvas = useRef(null);
  const scene = useRef(null);
  useLayoutEffect(() => {
    scene.current = createCamTestScene(canvas.current, width, height, mode);
    reportValidation(scene.current, frame);
    return () => scene.current.dispose();
  }, [width, height, mode]);
  useLayoutEffect(() => { scene.current.render(frame / fps); }, [frame, fps]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <canvas ref={canvas} width={width} height={height} style={{width: '100%', height: '100%'}} />
    </AbsoluteFill>
  );
};
