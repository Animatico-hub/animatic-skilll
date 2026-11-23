import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {createDemoScene, LINES} from './scene.js';
import {Captions} from '../../ui/Captions.jsx';
import {reportValidation} from '../../engine/validate.js';

export const DemoVideo = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const canvas = useRef(null);
  const scene = useRef(null);

  useLayoutEffect(() => {
    scene.current = createDemoScene(canvas.current, width, height);
    reportValidation(scene.current, frame); // uma vez por render, no frame 0
    return () => scene.current.dispose();
  }, [width, height]);

  useLayoutEffect(() => {
    scene.current.render(frame / fps);
  }, [frame, fps]);

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <canvas ref={canvas} width={width} height={height} style={{width: '100%', height: '100%'}} />
      <Captions t={frame / fps} lines={LINES} colors={{lia: '#ffe04a'}} />
    </AbsoluteFill>
  );
};
