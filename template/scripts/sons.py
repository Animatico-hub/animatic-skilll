"""Gera os sons sintetizados do motor em public/sfx (determinístico: mesma seed = mesmo arquivo).
Uso: python scripts/sons.py            (precisa de numpy + scipy; os .wav já vêm prontos no template)
Loops (drone, fogo, chuva, agua, respira) emendam sem estalo: o fim é misturado no começo.
Pacote 5 (áudio), aprovado em 19/11/2026. Medições das referências em references/audio.md."""
import os, numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'sfx')
rng = np.random.default_rng(17)

def filt(x, kind, f, order=2): return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x)
def noise(n): return rng.standard_normal(n)
def brown(n):
    b = filt(np.cumsum(noise(n)), 'highpass', 20); return b / (np.abs(b).max() + 1e-9)
def rms_to(x, db): return x * (10 ** (db / 20) / (np.sqrt((x ** 2).mean()) + 1e-9))
def env(n, pts):
    t = np.arange(n) / SR; return np.interp(t, [p[0] for p in pts], [p[1] for p in pts])

def loop(make, dur, xf=0.8):
    """gera dur+xf e mistura o rabo no começo -> loop sem emenda"""
    x = make(dur + xf); n, m = int(dur * SR), int(xf * SR)
    k = np.linspace(0, 1, m)
    y = x[:n].copy(); y[:m] = x[n:n + m] * (1 - k) + x[:m] * k
    return y

def save(name, x, peak=0.89):
    assert np.isfinite(x).all(), name
    x = x / (np.abs(x).max() + 1e-9) * peak
    wavfile.write(os.path.join(OUT, name), SR, (x * 32767).astype(np.int16))
    print(f'{name}: {len(x) / SR:.1f} s')

# ---- fundo de tensão (no lugar de música): grave 55 Hz desafinado + ruído escuro, respira devagar
def drone(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.125 * t)
    s = sum(np.sign(np.sin(2 * np.pi * f * t)) * a for f, a in ((55, 0.5), (55.375, 0.5), (82.5, 0.18)))
    s = filt(s, 'lowpass', 260, 4) + 0.35 * filt(noise(n), 'bandpass', [90, 400])
    s += 0.25 * np.sin(2 * np.pi * 110 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.0625 * t))
    return s * lfo

def fire(dur):
    n = int(dur * SR)
    roar = filt(brown(n), 'lowpass', 380) * (0.8 + 1.6 * filt(noise(n), 'lowpass', 3))
    crk = np.zeros(n)
    for p, a in zip(rng.integers(0, n - 2000, int(dur * 16)), rng.uniform(0.2, 1, int(dur * 16)) ** 2):
        L = int(rng.uniform(0.002, 0.012) * SR); crk[p:p + L] += a * noise(L) * np.exp(-np.arange(L) / (L / 4))
    return rms_to(roar, -24) + rms_to(filt(crk, 'bandpass', [1500, 7000]), -27) + 0.015 * filt(noise(n), 'bandpass', [2500, 9000])

def rain(dur):
    n = int(dur * SR); drops = np.zeros(n)
    for p in rng.integers(0, n - 500, int(dur * 40)):
        drops[p:p + 300] += rng.uniform(0.2, 1) * noise(300) * np.exp(-np.arange(300) / 60)
    return rms_to(filt(noise(n), 'bandpass', [900, 7000]), -30) + rms_to(filt(drops, 'highpass', 2500), -36)

def water(dur):
    n = int(dur * SR)
    return rms_to(filt(noise(n), 'bandpass', [400, 3500]), -22) + rms_to(filt(brown(n), 'lowpass', 220), -24)

def breath(dur, rate=1.6):
    n = int(dur * SR); ph = (np.arange(n) / SR * rate) % 1
    e = np.where(ph < 0.4, np.sin(np.pi * ph / 0.4) * 0.6, np.abs(np.sin(np.pi * (ph - 0.4) / 0.6)) ** 1.5)
    return filt(noise(n), 'bandpass', [600, 2400]) * e

def bubbles(dur):
    n = int(dur * SR); s = np.zeros(n)
    for p in rng.integers(0, n - 4000, int(dur * 7)):
        L = int(rng.uniform(0.03, 0.08) * SR); t = np.arange(L) / SR
        s[p:p + L] += np.sin(2 * np.pi * np.cumsum(rng.uniform(300, 700) * (1 + 6 * t)) / SR) * np.exp(-t / (L / SR / 3))
    return filt(s, 'lowpass', 1200)

def swell_hit(dur=4.0, rise=1.0):
    """sobe 1 s e bate um grave longo: toque em (início da cartela - 1 s)"""
    n = int(dur * SR); t = np.arange(n) / SR
    up = filt(noise(n), 'bandpass', [200, 2000]) * np.clip(t / rise, 0, 1) ** 3 * (t < rise)
    h = np.maximum(t - rise, 0); on = t >= rise
    boom = np.sin(2 * np.pi * (48 - 10 * np.minimum(h, 1)) * h) * np.exp(-h / 1.1) * on
    boom += 0.4 * filt(brown(n), 'lowpass', 120) * np.exp(-h / 0.8) * on
    return rms_to(up, -26) + rms_to(boom, -15)

def plunge(dur=1.8):
    """impacto abafado ao entrar na água"""
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * (60 - 15 * np.minimum(t, 1)) * t) * np.exp(-t / 0.6)
    s += 0.6 * filt(brown(n), 'lowpass', 300) * np.exp(-t / 0.4)
    return filt(s, 'lowpass', 500)

def alert(D=2.2):
    """alerta de emergência medido na referência (cabana, parte 1): acorde tipo sino + vibração 150,7 Hz pulsando"""
    n = int(D * SR); t = np.arange(n) / SR
    a, at, hold, dec = 0.12, 0.04, 0.12, 0.09
    hits = np.where(t < at + a + hold, np.clip((t - at) / a, 0, 1), np.exp(-(t - at - a - hold) / dec))
    chord = sum(10 ** (db / 20) * np.sin(2 * np.pi * f * t) for f, db in
                [(740.2, -15.7), (1429.3, -20.8), (1483.1, -15.3), (1655.4, -24.4), (2088.7, -23.2), (4102.1, -28.9), (1001.3, -38)])
    g = np.zeros(n)
    for x0, x1 in [(0.18, 0.56), (0.62, 0.67), (0.71, 1.02), (1.10, 1.53), (1.60, 1.66), (1.70, 1.75)]: g[(t >= x0) & (t < x1)] = 1
    g = filt(g, 'lowpass', 40, 1) * np.clip((1.85 - t) / 0.4, 0, 1)
    buzz = sum(10 ** (db / 20) * np.sin(2 * np.pi * f * t + i) for i, (f, db) in
               enumerate([(150.7, 0), (185.7, -22.5), (212.6, -30), (250.3, -32), (290.7, -32), (333.8, -30)]))
    x = np.tanh(buzz * 0.7) / 0.7 * g + chord * hits * 1.6
    return x * np.clip((D - t) / 0.05, 0, 1)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    save('drone.wav', loop(drone, 16), 0.7)
    save('fogo.wav', loop(fire, 8))
    save('chuva.wav', loop(rain, 8))
    save('agua.wav', loop(water, 6))
    save('respira.wav', breath(5), 0.6)  # 5 s = 8 ciclos exatos a 1,6 Hz: emenda sozinho
    save('bolhas.wav', bubbles(4), 0.5)
    save('grave_cartela.wav', swell_hit())
    save('mergulho.wav', plunge())
    save('alerta.wav', alert())
