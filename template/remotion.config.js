import {Config} from '@remotion/cli/config';

Config.setEntryPoint('src/index.js');
Config.setChromiumOpenGlRenderer('angle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
