import './Keypad.css';
import { playButtonTap } from '../audio/sfx';
import type { Lang } from '../engine/types';
import { t, UI_STRINGS } from '../engine/i18n';

interface KeypadProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  lang: Lang;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', '.'];

export default function Keypad({ value, onChange, onSubmit, disabled, lang }: KeypadProps) {
  function pressDigit(k: string) {
    if (disabled) return;
    playButtonTap();
    if (k === '-') {
      onChange(value.startsWith('-') ? value.slice(1) : `-${value}`);
      return;
    }
    if (k === '.' && value.includes('.')) return;
    onChange(value + k);
  }

  function backspace() {
    if (disabled) return;
    playButtonTap();
    onChange(value.slice(0, -1));
  }

  return (
    <div className="keypad">
      <div className="keypad__display" aria-live="polite">{value || ' '}</div>
      <div className="keypad__grid">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className="keypad__key"
            onClick={() => pressDigit(k)}
            disabled={disabled}
          >
            {k}
          </button>
        ))}
        <button type="button" className="keypad__key keypad__key--wide" onClick={backspace} disabled={disabled}>
          ⌫
        </button>
        <button
          type="button"
          className="keypad__key keypad__key--ok"
          onClick={() => { if (!disabled) { playButtonTap(); onSubmit(); } }}
          disabled={disabled || value.length === 0}
        >
          {t(UI_STRINGS.ok, lang)}
        </button>
      </div>
    </div>
  );
}
