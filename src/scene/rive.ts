import { Alignment, EventType, Fit, Layout, Rive, RuntimeLoader, type Event } from '@rive-app/canvas';
import riveWasm from '@rive-app/canvas/rive.wasm?url';

import {
  FLAG_ANIMATION,
  IDLE_STATE,
  METER_ARTBOARD,
  OUTCOME_BY_STATE,
  OUTCOME_INPUT,
  RIVE_URL,
  STATE_MACHINE,
  SWING_TRIGGER,
} from '@/config';
import { meterCanvas, sceneCanvas } from '@/dom';
import type { Outcome } from '@/types';

export interface SceneHandlers {
  onReady: () => void;
  onIdle: () => void;
  onBusy: () => void;
  onResult: (outcome: Outcome) => void;
}

RuntimeLoader.setWasmUrl(riveWasm);
Rive.suppressDeprecationWarnings = [
  'animations-param',
  'animation-names',
  'names-array',
  'state-change-events',
  'scrub',
  'state-machine-inputs',
];

let scene: Rive | null = null;
let meter: Rive | null = null;

function statesOf(event: Event): string[] {
  const data = Array.isArray(event.data) ? event.data : [event.data];
  return data.filter((state): state is string => typeof state === 'string');
}

export async function loadScene(handlers: SceneHandlers): Promise<void> {
  const buffer = await fetch(RIVE_URL).then((response) => response.arrayBuffer());
  let loaded = 0;
  const done = () => {
    loaded += 1;
    if (loaded < 2) return;
    resizeScene();
    handlers.onReady();
  };

  const sceneRive = new Rive({
    buffer: buffer.slice(0),
    canvas: sceneCanvas,
    stateMachine: STATE_MACHINE,
    autoplay: true,
    autoBind: true,
    shouldDisableRiveListeners: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoad: done,
  });

  sceneRive.on(EventType.StateChange, (event) => {
    const states = statesOf(event);
    if (states.includes(IDLE_STATE)) handlers.onIdle();
    else if (states.length) handlers.onBusy();
    const outcome = states.map((state) => OUTCOME_BY_STATE.get(state)).find((value) => value !== undefined);
    if (outcome) handlers.onResult(outcome);
  });

  const meterRive = new Rive({
    buffer: buffer.slice(0),
    canvas: meterCanvas,
    artboard: METER_ARTBOARD,
    animations: [FLAG_ANIMATION],
    autoplay: false,
    shouldDisableRiveListeners: true,
    layout: new Layout({ fit: Fit.Fill, alignment: Alignment.TopLeft }),
    onLoad: () => {
      meterRive.scrub(FLAG_ANIMATION, 0);
      done();
    },
  });

  scene = sceneRive;
  meter = meterRive;
}

export function setOutcome(outcome: Outcome): void {
  const input = scene?.stateMachineInputs(STATE_MACHINE)?.find((item) => item.name === OUTCOME_INPUT);
  if (input) input.value = outcome;
}

export function swing(): void {
  scene?.viewModelInstance?.trigger(SWING_TRIGGER)?.trigger();
}

export function setFlag(position: number): void {
  meter?.scrub(FLAG_ANIMATION, position);
}

export function showMeter(visible: boolean): void {
  meterCanvas.classList.toggle('is-on', visible);
}

export function restartScene(): void {
  scene?.reset({ stateMachine: STATE_MACHINE, autoplay: true, autoBind: true });
}

export function resizeScene(): void {
  scene?.resizeDrawingSurfaceToCanvas();
  meter?.resizeDrawingSurfaceToCanvas();
}
