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
 */

// Per-sound loudness, tuned by measuring each one so they all peak around 60–70% of full scale.
const SOUND_LEVELS = { sheen: 1.2, whinny: 1.9, rustle: 3.2, horn: 0.7, gate: 1 }

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

const SOUNDS = { sheen, whinny, rustle, horn, gate }

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
