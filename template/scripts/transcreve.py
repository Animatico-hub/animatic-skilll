# Transcreve arquivos de voz com timestamps por palavra (faster-whisper) -> JSON.
# uso: python scripts/transcreve.py saida.json arq1.mp3 arq2.mp3 ...
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768

model = WhisperModel('small', device='cpu', compute_type='int8')
out = {}
for p in sys.argv[2:]:
    segs, _ = model.transcribe(load(p), language='pt', word_timestamps=True, vad_filter=False)
    words = [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)} for s in segs for w in s.words]
    out[p] = words
    print(p, ' '.join(f"{w['w']}[{w['s']:.2f}-{w['e']:.2f}]" for w in words))
json.dump(out, open(sys.argv[1], 'w', encoding='utf8'), ensure_ascii=False, indent=1)
