import { TOAST_MS } from '@/config';
import { ui } from '@/dom';

export type ToastTone = 'perfect' | 'made' | 'short' | 'long';

let timer = 0;

export function toast(text: string, tone: ToastTone): void {
  window.clearTimeout(timer);
  ui.toast.textContent = text;
  ui.toast.dataset.tone = tone;
  ui.toast.classList.remove('is-on');
  void ui.toast.offsetWidth;
  ui.toast.classList.add('is-on');
  timer = window.setTimeout(() => ui.toast.classList.remove('is-on'), TOAST_MS);
}

export function hideToast(): void {
  window.clearTimeout(timer);
  ui.toast.classList.remove('is-on');
}
