import { Tone } from '../course/content.model';
export const toneColor = (t?: Tone): string | null =>
  t ? `var(--${t === 'accent' ? 'accent-ink' : t === 'muted' ? 'muted' : t + '-ink'})` : null;
