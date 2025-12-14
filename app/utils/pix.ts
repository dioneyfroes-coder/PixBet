export type PixValidationResult = { ok: true } | { ok: false; message?: string };

export function normalizePixKey(raw: string) {
  return raw.trim().replace(/\s+/g, '');
}

export function validatePixKey(
  raw: string,
  messages?: Record<string, string>
): PixValidationResult {
  const value = normalizePixKey(raw || '');
  // Allow clearing
  if (value.length === 0) return { ok: true };

  if (value.length < 5) {
    return { ok: false, message: messages?.pixKeyTooShort ?? 'Chave PIX muito curta' };
  }
  if (value.length > 180) {
    return { ok: false, message: messages?.pixKeyTooLong ?? 'Chave PIX muito longa' };
  }

  const isEmail = /@/.test(value);
  const isPossiblePhone = /^\+?\d[\d\-() ]+$/.test(raw);
  const digitsOnly = value.replace(/\D/g, '');
  const isCpfCnpj =
    /^\d+$/.test(digitsOnly) && (digitsOnly.length === 11 || digitsOnly.length === 14);

  const validateCPF = (cpf: string) => {
    const nums = cpf.replace(/\D/g, '');
    if (nums.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(nums)) return false;
    const calc = (t: number) => {
      let sum = 0;
      for (let i = 0; i < t - 1; i++) sum += Number(nums.charAt(i)) * (t - i);
      const d = (sum * 10) % 11;
      return d === 10 ? 0 : d;
    };
    const v1 = calc(10);
    const v2 = calc(11);
    return v1 === Number(nums.charAt(9)) && v2 === Number(nums.charAt(10));
  };

  const validateCNPJ = (cnpj: string) => {
    const nums = cnpj.replace(/\D/g, '');
    if (nums.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(nums)) return false;
    const calc = (t: number) => {
      let sum = 0;
      let pos = t - 7;
      for (let i = t; i >= 1; i--) {
        sum += Number(nums.charAt(t - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      const res = sum % 11;
      return res < 2 ? 0 : 11 - res;
    };
    const v1 = calc(12);
    const v2 = calc(13);
    return v1 === Number(nums.charAt(12)) && v2 === Number(nums.charAt(13));
  };

  if (isEmail) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(value))
      return { ok: false, message: messages?.pixKeyInvalidEmail ?? 'E-mail inválido' };
    return { ok: true };
  }

  if (isPossiblePhone) {
    const phone = value.replace(/[^0-9+]/g, '');
    const phoneRe = /^\+?\d{8,15}$/;
    if (!phoneRe.test(phone))
      return { ok: false, message: messages?.pixKeyInvalidPhone ?? 'Telefone inválido' };
    return { ok: true };
  }

  if (isCpfCnpj) {
    if (process.env.NODE_ENV === 'production') {
      const valid = digitsOnly.length === 11 ? validateCPF(digitsOnly) : validateCNPJ(digitsOnly);
      if (!valid)
        return { ok: false, message: messages?.pixKeyInvalidCpfCnpjDigits ?? 'CPF/CNPJ inválido' };
    }
    return { ok: true };
  }

  // Fallback: accept anything that passed length checks
  return { ok: true };
}

export default { normalizePixKey, validatePixKey };
