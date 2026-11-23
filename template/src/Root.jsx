import React from 'react';
import {Composition, Still} from 'remotion';
import {DemoVideo} from './episodes/demo/DemoVideo.jsx';
import {DemoSerieVideo, DemoCover} from './episodes/demo/DemoSerieVideo.jsx';
import {CamTestVideo} from './episodes/camtest/CamTestVideo.jsx';
import {FxTestVideo} from './episodes/fxtest/FxTestVideo.jsx';
import {UiTestVideo} from './episodes/uitest/UiTestVideo.jsx';

export const Root = () => (
  <>
    <Composition
      id="Demo"
      component={DemoVideo}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={300}
    />
    {/* formato de série: HUD + selo + preto + cartela (10 s de cena + 3,3 s) */}
    <Composition id="DemoSerie" component={DemoSerieVideo} width={1080} height={1920} fps={30} durationInFrames={399} />
    <Still id="DemoCover" component={DemoCover} width={1080} height={1920} />
    {/* câmera de ação: whip, tremida, corrida com braços (CamOld = câmera antiga, para comparar) */}
    <Composition id="CamTest" component={CamTestVideo} width={1080} height={1920} fps={30} durationInFrames={375} defaultProps={{mode: 'new'}} />
    {/* efeitos: fogo, janela de noite, alagamento, submerso (4 s cada) */}
    <Composition id="FxTest" component={FxTestVideo} width={1080} height={1920} fps={30} durationInFrames={480} />
    {/* avisos e mensagens: alerta, etiqueta de quem fala, banner com leitura palavra a palavra, celular na mão */}
    <Composition id="UiTest" component={UiTestVideo} width={1080} height={1920} fps={30} durationInFrames={390} />
    <Composition id="CamOld" component={CamTestVideo} width={1080} height={1920} fps={30} durationInFrames={375} defaultProps={{mode: 'old'}} />
  </>
);
