import { useEffect, useState } from 'react';
import { validatePromoCode } from '../../checkout/api/checkoutApi';

export function useCartPromo(owner, subtotal, ready) {
  const storageKey = `iCrowd_promo:${owner}`;
  const [code, setCode] = useState(() => sessionStorage.getItem(storageKey) || '');
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const key = `${code}:${subtotal}:${attempt}`;
  useEffect(() => {
    if (!ready || !code || subtotal <= 0) return;
    let current = true;
    validatePromoCode(code, subtotal).then(data => {
      if (!current) return;
      setResult({ key, ...data, promoCode: code });
      if (data.valid) sessionStorage.setItem(storageKey, code);
      else sessionStorage.removeItem(storageKey);
    }).catch(() => {
      if (current) setResult({ key, valid: false, message: 'We could not check this code. Please try again.' });
    });
    return () => { current = false; };
  }, [code, subtotal, ready, key, storageKey]);
  return {
    promo: code && subtotal > 0 && result?.key === key && result.valid ? result : null,
    promoBusy: Boolean(ready && code && subtotal > 0 && result?.key !== key),
    promoError: code && result?.key === key && !result.valid ? result.message : '',
    applyPromo: value => { setCode(value.trim().toUpperCase()); setAttempt(value => value + 1); },
    removePromo: () => { setCode(''); setResult(null); sessionStorage.removeItem(storageKey); },
  };
}
