import { useState } from 'react';
import './AccountModal.css';
import type { Lang } from '../engine/types';
import type { Account } from '../store/local';
import { validateNickname, validatePin } from '../store/account';
import { t, UI_STRINGS } from '../engine/i18n';
import { playButtonTap } from '../audio/sfx';

interface AccountModalProps {
  lang: Lang;
  account?: Account;
  onSignIn: (nickname: string, pin: string) => Promise<void>;
  onSignOut: () => void;
  onClose: () => void;
}

export default function AccountModal({ lang, account, onSignIn, onSignOut, onClose }: AccountModalProps) {
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    playButtonTap();
    if (!validateNickname(nickname)) {
      setError(t(UI_STRINGS.invalidNickname, lang));
      return;
    }
    if (!validatePin(pin)) {
      setError(t(UI_STRINGS.invalidPin, lang));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onSignIn(nickname, pin);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="account-modal__overlay" onClick={onClose}>
      <div className="account-modal__card edu-pop-in" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="account-modal__close" onClick={onClose} aria-label={t(UI_STRINGS.close, lang)}>
          ✕
        </button>
        <h2 className="account-modal__title">{t(UI_STRINGS.profile, lang)}</h2>

        {account ? (
          <div className="account-modal__signed-in">
            <p className="account-modal__signed-in-label">{t(UI_STRINGS.signedInAs, lang)}</p>
            <p className="account-modal__nickname">👤 {account.nickname}</p>
            <button
              type="button"
              className="account-modal__btn account-modal__btn--secondary"
              onClick={() => { playButtonTap(); onSignOut(); onClose(); }}
            >
              {t(UI_STRINGS.signOut, lang)}
            </button>
          </div>
        ) : (
          <>
            <p className="account-modal__subtitle">{t(UI_STRINGS.signInSubtitle, lang)}</p>
            <label className="account-modal__field">
              <span>{t(UI_STRINGS.nickname, lang)}</span>
              <input
                type="text"
                value={nickname}
                maxLength={16}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={lang === 'en' ? 'e.g. StarKid' : '例如：星星小子'}
              />
              <small>{t(UI_STRINGS.nicknameHint, lang)}</small>
            </label>
            <label className="account-modal__field">
              <span>{t(UI_STRINGS.pin, lang)}</span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="\d*"
                value={pin}
                maxLength={6}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="1234"
              />
              <small>{t(UI_STRINGS.pinHint, lang)}</small>
            </label>
            {error && <p className="account-modal__error">{error}</p>}
            <button
              type="button"
              className="account-modal__btn account-modal__btn--primary"
              onClick={handleSubmit}
              disabled={busy}
            >
              {t(UI_STRINGS.signIn, lang)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
