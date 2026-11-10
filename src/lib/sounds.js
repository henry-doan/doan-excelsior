import { getSettings } from './settingsStore.js'

/**
 * Sound effects, synthesized with the Web Audio API so there are no audio
 * files to download. Each plays only when the sound setting is on.
 *
 * - sheen:   a sword being drawn, when a formula is saved
 * - whinny:  a horse, when a file opens
 * - rustle:  parchment, when switching sheets
 * - horn:    a short fanfare, when downloading
 * - gate:    a portcullis rattling up, when entering the castle
 * - roar:    a dragon's growl, when the error dragon lands
 * - triumph: a rising fanfare, when the last error is fixed and the dragon flies off
 * - eclipse: a low, eerie swell and a shimmer at totality, when the moon is clicked
 * - pluck:   two soft lute notes, when the squire speaks
 */

// Per-sound loudness, tuned by measuring each one so they all peak around 60–70% of full scale.
const SOUND_LEVELS = { sheen: 1.2, whinny: 1.9, rustle: 3.2, horn: 0.7, gate: 1, roar: 0.5, triumph: 0.7, eclipse: 0.25, pluck: 0.85 }

let context = null
let noiseBuffer = null
let output = null

/** Created on first use, which is always after a click or key press, as browsers require. */
const getContext = () => {
  if (!context) {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext
    if (!AudioContext) return null
    context = new AudioContext()
  }
  if (context.state === 'suspended') context.resume()
  return context
}

/** A limiter in front of the speakers, so overlapping sounds never distort. */
const getOutput = (ctx) => {
  if (!output) {
    output = ctx.createDynamicsCompressor()
    output.threshold.value = -10
    output.knee.value = 6
    output.ratio.value = 12
    output.attack.value = 0.003
    output.release.value = 0.15
    output.connect(ctx.destination)
  }
  return output
}

/** One second of white noise, reused by every noisy sound. */
const getNoise = (ctx) => {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

/** A gain node with an attack/decay envelope, connected to the sound's output. */
const envelope = (ctx, out, start, attack, peak, decay) => {
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay)
  gain.connect(out)
  return gain
}

const noiseSource = (ctx, start, duration) => {
  const source = ctx.createBufferSource()
  source.buffer = getNoise(ctx)
  source.start(start, Math.random() * 0.5)
  source.stop(start + duration)
  return source
}

const sheen = (ctx, out, now) => {
  // The scrape: noise swept upward through a narrow band.
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.Q.value = 6
  band.frequency.setValueAtTime(2500, now)
  band.frequency.exponentialRampToValueAtTime(9000, now + 0.22)
  noiseSource(ctx, now, 0.3).connect(band)
  band.connect(envelope(ctx, out, now, 0.02, 0.5, 0.25))
  // The ring: two bright, slightly detuned partials.
  for (const [frequency, level] of [[2637, 0.35], [3951, 0.2]]) {
    const ring = ctx.createOscillator()
    ring.frequency.value = frequency
    ring.connect(envelope(ctx, out, now + 0.12, 0.01, level, 0.7))
    ring.start(now + 0.12)
    ring.stop(now + 0.9)
  }
}

const whinny = (ctx, out, now) => {
  // A buzzy voice whose pitch rises, wobbles fast, then falls away.
  const voice = ctx.createOscillator()
  voice.type = 'sawtooth'
  voice.frequency.setValueAtTime(620, now)
  voice.frequency.exponentialRampToValueAtTime(1150, now + 0.18)
  voice.frequency.exponentialRampToValueAtTime(900, now + 0.6)
  voice.frequency.exponentialRampToValueAtTime(420, now + 1.05)

  const wobble = ctx.createOscillator()
  wobble.frequency.setValueAtTime(14, now)
  wobble.frequency.linearRampToValueAtTime(22, now + 1)
  const wobbleDepth = ctx.createGain()
  wobbleDepth.gain.setValueAtTime(20, now)
  wobbleDepth.gain.linearRampToValueAtTime(90, now + 0.9)
  wobble.connect(wobbleDepth).connect(voice.frequency)

  // A formant filter makes the sawtooth sound more like a throat than a synth.
  const formant = ctx.createBiquadFilter()
  formant.type = 'bandpass'
  formant.frequency.value = 1400
  formant.Q.value = 2.5
  voice.connect(formant).connect(envelope(ctx, out, now, 0.06, 0.6, 1.0))

  const breath = ctx.createBiquadFilter()
  breath.type = 'highpass'
  breath.frequency.value = 3000
  noiseSource(ctx, now, 1.1).connect(breath).connect(envelope(ctx, out, now, 0.05, 0.08, 1.0))

  for (const node of [voice, wobble]) {
    node.start(now)
    node.stop(now + 1.15)
  }
}

const rustle = (ctx, out, now) => {
  // A few quick, uneven crinkles.
  let at = now
  for (let i = 0; i < 4; i += 1) {
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 2200 + Math.random() * 2500
    band.Q.value = 1.2
    noiseSource(ctx, at, 0.08).connect(band).connect(envelope(ctx, out, at, 0.005, 0.35, 0.06))
    at += 0.035 + Math.random() * 0.05
  }
}

const horn = (ctx, out, now) => {
  // A two-note call (G then D) with a brassy, filtered tone.
  const notes = [
    [392, 0, 0.22],
    [587.33, 0.24, 0.55],
  ]
  for (const [frequency, offset, length] of notes) {
    const start = now + offset
    const brass = ctx.createBiquadFilter()
    brass.type = 'lowpass'
    brass.frequency.setValueAtTime(700, start)
    brass.frequency.linearRampToValueAtTime(2200, start + 0.08)
    brass.Q.value = 1.5
    brass.connect(envelope(ctx, out, start, 0.04, 0.45, length))
    for (const [type, detune] of [['sawtooth', 0], ['square', 6]]) {
      const tone = ctx.createOscillator()
      tone.type = type
      tone.frequency.value = frequency
      tone.detune.value = detune
      tone.connect(brass)
      tone.start(start)
      tone.stop(start + length + 0.1)
    }
  }
}

const gate = (ctx, out, now) => {
  // A low rumble of the winch...
  const rumble = ctx.createBiquadFilter()
  rumble.type = 'lowpass'
  rumble.frequency.value = 180
  noiseSource(ctx, now, 1.5).connect(rumble).connect(envelope(ctx, out, now, 0.15, 1.2, 1.2))
  // ...chain links clinking as it rises...
  for (let i = 0; i < 9; i += 1) {
    const at = now + 0.1 + i * 0.12 + Math.random() * 0.04
    const clink = ctx.createOscillator()
    clink.type = 'triangle'
    clink.frequency.value = 1700 + Math.random() * 1200
    clink.connect(envelope(ctx, out, at, 0.002, 0.25, 0.09))
    clink.start(at)
    clink.stop(at + 0.12)
  }
  // ...and a heavy thud as it locks open.
  const thud = ctx.createOscillator()
  thud.frequency.setValueAtTime(110, now + 1.25)
  thud.frequency.exponentialRampToValueAtTime(45, now + 1.55)
  thud.connect(envelope(ctx, out, now + 1.25, 0.01, 1, 0.35))
  thud.start(now + 1.25)
  thud.stop(now + 1.7)
}

/** Soft clipping, which roughens a voice without making it buzz. */
const growlCurve = (drive) => {
  const curve = new Float32Array(1024)
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive)
  }
  return curve
}

/** A cave-like echo: a second and a half of fading noise to convolve with. */
const caveEcho = (ctx) => {
  const length = Math.round(ctx.sampleRate * 1.5)
  const impulse = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = impulse.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.exp((-4 * i) / length)
  const echo = ctx.createConvolver()
  echo.buffer = impulse
  return echo
}

const roar = (ctx, out, now) => {
  const end = now + 1.9
  // Everything passes through one throat: a swell to full voice, held, then a long fade.
  const throat = ctx.createGain()
  throat.gain.setValueAtTime(0.0001, now)
  throat.gain.exponentialRampToValueAtTime(1, now + 0.28)
  throat.gain.setValueAtTime(1, now + 0.75)
  throat.gain.exponentialRampToValueAtTime(0.0001, end)

  // A fast, uneven rattle in the loudness gives the growl its gravel.
  const rattle = ctx.createGain()
  rattle.gain.value = 0.65
  const rattleRate = ctx.createOscillator()
  rattleRate.frequency.setValueAtTime(28, now)
  rattleRate.frequency.linearRampToValueAtTime(38, now + 0.6)
  rattleRate.frequency.linearRampToValueAtTime(24, end)
  const rattleDepth = ctx.createGain()
  rattleDepth.gain.value = 0.25
  rattleRate.connect(rattleDepth).connect(rattle.gain)
  // A slower wobble at an unrelated rate keeps the rattle from sounding like a motor.
  const wobbleRate = ctx.createOscillator()
  wobbleRate.frequency.value = 9.3
  const wobbleDepth = ctx.createGain()
  wobbleDepth.gain.value = 0.15
  wobbleRate.connect(wobbleDepth).connect(rattle.gain)

  // The voice: a low tone and the octave below it, which makes the beast sound huge.
  const pitch = [
    [now, 95],
    [now + 0.35, 140],
    [now + 0.8, 125],
    [end, 70],
  ]
  for (const [ratio, level] of [[1, 0.5], [0.5, 0.6]]) {
    const voice = ctx.createOscillator()
    voice.type = 'sawtooth'
    voice.frequency.setValueAtTime(pitch[0][1] * ratio, now)
    for (const [at, frequency] of pitch.slice(1)) voice.frequency.exponentialRampToValueAtTime(frequency * ratio, at)
    const gain = ctx.createGain()
    gain.gain.value = level
    voice.connect(gain).connect(rattle)
    voice.start(now)
    voice.stop(end)
  }

  // Breath: roars are mostly air, so noise carries much of the sound.
  const air = ctx.createBiquadFilter()
  air.type = 'lowpass'
  air.frequency.value = 3500
  const airLevel = ctx.createGain()
  airLevel.gain.value = 0.9
  noiseSource(ctx, now, 1.9).connect(air).connect(airLevel).connect(rattle)

  const grit = ctx.createWaveShaper()
  grit.curve = growlCurve(2.5)
  rattle.connect(grit)

  // Vowel resonances of the mouth opening from "ahh" toward "aww" and closing again.
  const formants = [
    { level: 1, q: 5, sweep: [[now, 450], [now + 0.4, 750], [end, 380]] },
    { level: 0.55, q: 7, sweep: [[now, 1000], [now + 0.4, 1250], [end, 850]] },
    { level: 0.25, q: 8, sweep: [[now, 2500], [now + 0.4, 2700], [end, 2300]] },
  ]
  for (const { level, q, sweep } of formants) {
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.Q.value = q
    band.frequency.setValueAtTime(sweep[0][1], now)
    for (const [at, frequency] of sweep.slice(1)) band.frequency.exponentialRampToValueAtTime(frequency, at)
    const gain = ctx.createGain()
    gain.gain.value = level * 2.2
    grit.connect(band).connect(gain).connect(throat)
  }
  // The chest: the low end on its own, for weight.
  const chest = ctx.createBiquadFilter()
  chest.type = 'lowpass'
  chest.frequency.value = 260
  const chestLevel = ctx.createGain()
  chestLevel.gain.value = 0.5
  grit.connect(chest).connect(chestLevel).connect(throat)

  // Dry voice plus a cave echo behind it.
  throat.connect(out)
  const echo = caveEcho(ctx)
  const echoLevel = ctx.createGain()
  echoLevel.gain.value = 0.35
  throat.connect(echo).connect(echoLevel).connect(out)

  for (const node of [rattleRate, wobbleRate]) {
    node.start(now)
    node.stop(end)
  }
}

const triumph = (ctx, out, now) => {
  // A rising call (C, E, G, then a held high C) in the horn's brassy tone.
  const notes = [
    [523.25, 0, 0.12],
    [659.25, 0.13, 0.12],
    [783.99, 0.26, 0.12],
    [1046.5, 0.4, 0.75],
  ]
  for (const [frequency, offset, length] of notes) {
    const start = now + offset
    const brass = ctx.createBiquadFilter()
    brass.type = 'lowpass'
    brass.frequency.setValueAtTime(900, start)
    brass.frequency.linearRampToValueAtTime(3200, start + 0.06)
    brass.Q.value = 1.5
    brass.connect(envelope(ctx, out, start, 0.025, 0.4, length))
    for (const [type, detune] of [['sawtooth', 0], ['square', 7]]) {
      const tone = ctx.createOscillator()
      tone.type = type
      tone.frequency.value = frequency
      tone.detune.value = detune
      tone.connect(brass)
      tone.start(start)
      tone.stop(start + length + 0.1)
    }
  }
  // A cymbal-like shimmer on the last note.
  const shimmer = ctx.createBiquadFilter()
  shimmer.type = 'highpass'
  shimmer.frequency.value = 6000
  noiseSource(ctx, now + 0.4, 0.8).connect(shimmer).connect(envelope(ctx, out, now + 0.4, 0.01, 0.15, 0.7))
}

const eclipse = (ctx, out, now) => {
  const totality = now + 3.1
  const end = now + 5.3
  // A deep drone that opens up as the shadow crosses the moon...
  const drone = ctx.createBiquadFilter()
  drone.type = 'lowpass'
  drone.Q.value = 4
  drone.frequency.setValueAtTime(110, now)
  drone.frequency.exponentialRampToValueAtTime(700, totality)
  drone.frequency.exponentialRampToValueAtTime(160, end)
  const swell = ctx.createGain()
  swell.gain.setValueAtTime(0.0001, now)
  swell.gain.linearRampToValueAtTime(0.3, now + 0.9)
  swell.gain.exponentialRampToValueAtTime(1, totality)
  swell.gain.setValueAtTime(1, totality + 0.3)
  swell.gain.exponentialRampToValueAtTime(0.0001, end)
  drone.connect(swell).connect(out)
  for (const [type, frequency, detune, level] of [
    ['sawtooth', 55, -7, 0.35],
    ['sawtooth', 55, 7, 0.35],
    ['sine', 82.5, 0, 0.6],
    ['sine', 41.2, 0, 0.7],
  ]) {
    const tone = ctx.createOscillator()
    tone.type = type
    tone.frequency.value = frequency
    tone.detune.value = detune
    const gain = ctx.createGain()
    gain.gain.value = level
    tone.connect(gain).connect(drone)
    tone.start(now)
    tone.stop(end + 0.1)
  }
  // ...with a cold wind rising underneath...
  const wind = ctx.createBiquadFilter()
  wind.type = 'bandpass'
  wind.Q.value = 1.5
  wind.frequency.setValueAtTime(300, now)
  wind.frequency.exponentialRampToValueAtTime(1100, totality)
  wind.frequency.exponentialRampToValueAtTime(400, end)
  for (let i = 0; i < 6; i += 1) {
    noiseSource(ctx, now + i * 0.9, 1).connect(wind)
  }
  const windLevel = ctx.createGain()
  windLevel.gain.setValueAtTime(0.0001, now)
  windLevel.gain.linearRampToValueAtTime(0.15, now + 0.9)
  windLevel.gain.exponentialRampToValueAtTime(0.5, totality)
  windLevel.gain.exponentialRampToValueAtTime(0.0001, end)
  wind.connect(windLevel).connect(out)
  // ...and a glassy chord that rings out as the corona appears.
  for (const [frequency, level] of [[440, 0.3], [659.3, 0.22], [880, 0.18], [1318.5, 0.1], [1760, 0.07]]) {
    for (const detune of [-6, 6]) {
      const bell = ctx.createOscillator()
      bell.frequency.value = frequency
      bell.detune.value = detune
      bell.connect(envelope(ctx, out, totality, 0.04, level, 2.1))
      bell.start(totality)
      bell.stop(end)
    }
  }
}

/** One plucked string: a bright attack whose overtones fade quickly, like a lute. */
const pluckNote = (ctx, out, start, frequency, level) => {
  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.Q.value = 2
  tone.frequency.setValueAtTime(frequency * 8, start)
  tone.frequency.exponentialRampToValueAtTime(frequency * 1.5, start + 0.25)
  const body = envelope(ctx, out, start, 0.004, level, 0.9)
  tone.connect(body)
  for (const [type, detune] of [['sawtooth', -4], ['triangle', 5]]) {
    const string = ctx.createOscillator()
    string.type = type
    string.frequency.value = frequency
    string.detune.value = detune
    string.connect(tone)
    string.start(start)
    string.stop(start + 1)
  }
  // The fingertip on the string.
  const click = ctx.createBiquadFilter()
  click.type = 'bandpass'
  click.frequency.value = frequency * 4
  noiseSource(ctx, start, 0.03).connect(click)
  click.connect(envelope(ctx, out, start, 0.002, level * 0.6, 0.025))
}

const pluck = (ctx, out, now) => {
  pluckNote(ctx, out, now, 587.3, 0.5)
  pluckNote(ctx, out, now + 0.13, 880, 0.42)
}

const SOUNDS = { sheen, whinny, rustle, horn, gate, roar, triumph, eclipse, pluck }

/** Plays a sound by name if sound effects are on. `force` plays it regardless (for the toggle's preview). */
export const playSound = (name, { force = false } = {}) => {
  if (!force && !getSettings().sound) return
  const ctx = getContext()
  if (!ctx) return
  try {
    const level = ctx.createGain()
    level.gain.value = SOUND_LEVELS[name]
    level.connect(getOutput(ctx))
    SOUNDS[name](ctx, level, ctx.currentTime + 0.01)
  } catch {
    // Sound is decoration; never let it break an action.
  }
}
