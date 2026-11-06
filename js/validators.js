/**
 * Graded & Sealed TCG — Validaciones de formularios
 * Cada validador devuelve '' si el valor es correcto o el mensaje de error.
 */
const Validators = {
  NAME_RE: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)+$/,
  CITY_RE: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ .-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/,
  EMAIL_RE: /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i,

  name(value) {
    const v = (value || '').trim().replace(/\s+/g, ' ');
    if (!v) return 'Ingresa tu nombre completo.';
    if (/\d/.test(v)) return 'El nombre no puede contener números.';
    if (!this.NAME_RE.test(v)) return 'Ingresa nombre y apellido (solo letras).';
    if (v.length < 5 || v.length > 80) return 'El nombre debe tener entre 5 y 80 caracteres.';
    return '';
  },

  idCard(value) {
    const v = (value || '').trim();
    if (!v) return 'Ingresa tu cédula o RUC.';
    if (!/^\d+$/.test(v)) return 'Solo se permiten números.';
    if (v.length !== 10 && v.length !== 13) return 'La cédula tiene 10 dígitos y el RUC 13.';
    if (!Store.isValidEcuadorianId(v)) return 'Cédula o RUC ecuatoriano inválido (Módulo 10).';
    return '';
  },

  email(value) {
    const v = (value || '').trim();
    if (!v) return 'Ingresa tu correo electrónico.';
    if (!this.EMAIL_RE.test(v)) return 'Correo electrónico inválido (ej. nombre@correo.com).';
    return '';
  },

  // Devuelve los 9 dígitos del celular sin prefijo (+593 / 593 / 0)
  normalizePhone(value) {
    let d = (value || '').replace(/\D/g, '');
    if (d.startsWith('593')) d = d.slice(3);
    if (d.startsWith('0')) d = d.slice(1);
    return d;
  },

  phone(value) {
    const d = this.normalizePhone(value);
    if (!d) return 'Ingresa tu número celular.';
    if (d.length !== 9) return 'El celular debe tener 10 dígitos (ej. 0991234567).';
    if (!d.startsWith('9')) return 'Los celulares en Ecuador empiezan con 09.';
    if (/^9(\d)\1{7}$/.test(d)) return 'Número celular no válido.';
    return '';
  },

  city(value) {
    const v = (value || '').trim();
    if (!v) return 'Ingresa tu ciudad.';
    if (!this.CITY_RE.test(v) || v.length < 3) return 'Ciudad inválida (solo letras).';
    return '';
  },

  address(value) {
    const v = (value || '').trim();
    if (!v) return 'Ingresa tu dirección.';
    if (v.length < 8 || !/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(v)) return 'Dirección muy corta: incluye calle principal y referencia.';
    return '';
  },

  password(value) {
    const v = value || '';
    if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'La contraseña debe combinar letras y números.';
    return '';
  },

  // ---------------------------------------------------------------- Tarjetas

  cardBrand(number) {
    const n = (number || '').replace(/\D/g, '');
    if (/^4/.test(n)) return 'Visa';
    if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'American Express';
    return '';
  },

  luhn(number) {
    let sum = 0;
    let alternate = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let n = parseInt(number.charAt(i), 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  },

  cardNumber(value) {
    const n = (value || '').replace(/\D/g, '');
    if (!n) return 'Ingresa el número de tu tarjeta.';
    const brand = this.cardBrand(n);
    if (!brand) return 'Solo aceptamos tarjetas Visa o Mastercard.';
    if (brand === 'American Express') return 'American Express no está habilitada. Usa Visa o Mastercard.';
    const validLength = brand === 'Visa' ? [13, 16, 19] : [16];
    if (!validLength.includes(n.length)) return `Una tarjeta ${brand} debe tener ${validLength.join(' o ')} dígitos.`;
    if (!this.luhn(n)) return 'Número de tarjeta inválido (falla verificación Luhn).';
    return '';
  },

  cardExpiry(value, now = new Date()) {
    const m = (value || '').trim().match(/^(\d{2})\s*\/\s*(\d{2}|\d{4})$/);
    if (!m) return 'Formato de expiración MM/AA.';
    const month = parseInt(m[1], 10);
    let year = parseInt(m[2], 10);
    if (year < 100) year += 2000;
    if (month < 1 || month > 12) return 'Mes de expiración inválido.';
    // La tarjeta es válida hasta el último día del mes indicado
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    if (endOfMonth < now) return 'La tarjeta está caducada.';
    if (year > now.getFullYear() + 10) return 'Fecha de expiración no válida.';
    return '';
  },

  cardCvv(value) {
    const v = (value || '').trim();
    if (!/^\d{3}$/.test(v)) return 'El CVV debe tener 3 dígitos.';
    return '';
  },

  cardHolder(value) {
    const v = (value || '').trim();
    if (!v) return 'Ingresa el nombre como aparece en la tarjeta.';
    if (!this.NAME_RE.test(v)) return 'Nombre del titular inválido (solo letras).';
    return '';
  },

  /**
   * Simulación de la respuesta del banco emisor. Las tarjetas de prueba
   * permiten demostrar cada tipo de rechazo sin que se complete la compra.
   */
  TEST_CARDS: {
    '4111111111111111': { approved: true },
    '4242424242424242': { approved: true },
    '5555555555554444': { approved: true },
    '4000000000000002': { code: 'NO-EXISTE-14', title: 'Tarjeta inexistente o cancelada', message: 'El banco emisor indica que esta tarjeta no existe o fue cancelada.' },
    '4000000000000069': { code: 'EXPIRADA-54', title: 'Tarjeta caducada', message: 'El banco emisor reporta la tarjeta como caducada aunque la fecha ingresada sea futura.' },
    '4000000000009995': { code: 'FONDOS-51', title: 'Fondos insuficientes', message: 'La tarjeta no tiene saldo o cupo suficiente para cubrir el total.' },
    '4100000000000019': { code: 'BLOQUEADA-43', title: 'Tarjeta bloqueada', message: 'La tarjeta fue reportada como robada o extraviada y está bloqueada.' },
    '4000000000000226': { code: 'CANCELADO-17', cancelled: true, title: 'Pago cancelado por el titular', message: 'El titular canceló la operación desde la aplicación de su banco. No se realizó ningún cobro.' },
    '4000000000000127': { code: 'CVV-82', title: 'CVV incorrecto', message: 'El código de seguridad no coincide con el registrado por el banco.' }
  },

  bankAuthorize(number) {
    const n = (number || '').replace(/\D/g, '');
    const rule = this.TEST_CARDS[n];
    if (!rule || rule.approved) return { approved: true, code: '00-APROBADA' };
    return { approved: false, ...rule };
  },

  // ------------------------------------------------------- Errores en línea

  showError(input, message) {
    if (!input) return;
    const anchor = input.closest('[data-field]') || input;
    let err = document.getElementById(`${input.id}-error`);
    if (!err) {
      err = document.createElement('p');
      err.id = `${input.id}-error`;
      err.setAttribute('role', 'alert');
      err.className = 'text-xs text-[#BE123C] font-semibold mt-1';
      anchor.insertAdjacentElement('afterend', err);
    }
    const box = input.closest('[data-field]') || input;
    err.textContent = message || '';
    err.classList.toggle('hidden', !message);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    // El lector de pantalla lee el error al volver al campo (WCAG 3.3.1), sin perder la ayuda que ya tuviera
    const describedBy = ((input.getAttribute && input.getAttribute('aria-describedby')) || '')
      .split(' ').filter(id => id && id !== err.id);
    if (message) describedBy.push(err.id);
    if (describedBy.length) input.setAttribute('aria-describedby', describedBy.join(' '));
    else if (input.removeAttribute) input.removeAttribute('aria-describedby');
    box.classList.toggle('!border-[#E11D48]', !!message);
    box.classList.toggle('!border-[#059669]', !message && !!input.value);
  },

  // rules: { inputId: valueValidatorFn }. Devuelve true si todo es válido.
  validateAll(rules) {
    let firstInvalid = null;
    Object.entries(rules).forEach(([id, fn]) => {
      const input = document.getElementById(id);
      if (!input) return;
      const msg = fn(input.value);
      this.showError(input, msg);
      if (msg && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  },

  // Validación en vivo al salir del campo y al corregirlo
  attach(rules) {
    Object.entries(rules).forEach(([id, fn]) => {
      const input = document.getElementById(id);
      if (!input || input.dataset.validatorBound) return;
      input.dataset.validatorBound = '1';
      input.addEventListener('blur', () => {
        if (input.value) this.showError(input, fn(input.value));
      });
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') this.showError(input, fn(input.value));
      });
    });
  }
};

if (typeof window !== 'undefined') {
  window.Validators = Validators;
}
