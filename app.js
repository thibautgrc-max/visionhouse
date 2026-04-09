/* ══════════════════════════════════════════════════════════════
   LIVEORDER PRO — app.js v10.0
   Architecture : CRO-First · Mobile-First · Stripe uniquement
   Submit       : Formspree → redirection immédiate Stripe
   UX           : mobile summary sheet · premium reassurance · no relay friction
══════════════════════════════════════════════════════════════ */
'use strict';

const CONFIG = {
  products: {
    QZ01: { price: 39,  name: 'Produit QZ01' },
    DR02: { price: 119, name: 'Produit DR02' },
    JB07: { price: 59,  name: 'Produit JB07' },
    AL11: { price: 24,  name: 'Produit AL11' },
  },
  shipping: { price: 6.00, label: 'Mondial Relay · Chronopost' },
  formspreeEndpoint: 'https://formspree.io/f/TON_FORM_ID',
  stripeLink: 'https://buy.stripe.com/TON_LIEN_STRIPE',
  socialProof: { baseViewers: 135 },
  popupFirstDelay: 9000,
  popupMinInterval: 18000,
  popupMaxInterval: 34000,
  popupDisplayMs: 4800,
  popupNames: ['Emma','Lucas','Camille','Théo','Lina','Nathan','Sarah','Julien','Inès','Maxime','Léa','Enzo','Manon','Hugo','Clara','Baptiste','Jade','Tom','Anaïs','Louis','Alice','Romain','Zoé','Antoine'],
  popupTemplates: [
    n => `${n} vient de réserver`,
    n => `${n} a effectué une commande`,
    n => `${n} vient de commander`,
    n => `${n} a sécurisé son article`,
    (n, ref) => ref ? `${n} vient de commander ${ref}` : `${n} vient de commander`,
  ],
};

const state = {
  currentStep: 1,
  productRef: '',
  productName: '',
  productPrice: 0,
  isKnownRef: false,
  quantity: 1,
  isSubmitting: false,
  get subtotal() { return this.productPrice * this.quantity; },
  get total() { return this.productPrice > 0 ? this.subtotal + CONFIG.shipping.price : 0; },
  get hasProduct() { return this.productPrice > 0; },
};

const $id = (id) => document.getElementById(id);
const fmt = { euro: (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v) };

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function animateNumber(el, from, to, duration = 320) {
  if (!el) return;
  if (from === to || Number.isNaN(from) || Number.isNaN(to)) {
    el.textContent = (to === 0 || Number.isNaN(to)) ? '—' : Math.round(to);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    el.textContent = Math.round(from + (to - from) * ease);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function bump(el, cls = 'bump') {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 440);
}

function flashPriceCard(newVal) {
  const el = $id('amountDisplay');
  if (!el) return;
  const prev = parseFloat(el.dataset.prevVal || '0');
  el.dataset.prevVal = String(newVal);
  el.classList.add('animating');
  setTimeout(() => {
    el.classList.remove('animating');
    animateNumber(el, prev, newVal);
  }, 110);
}

function updateProgress() {
  const ids = ['reference','prenom','nom','email','telephone','adresse1','ville','code_postal'];
  const filled = ids.filter((id) => ($id(id)?.value || '').trim().length > 0).length;
  const pct = Math.round((filled / ids.length) * 100);
  const bar = $id('progressBar');
  if (bar) bar.style.width = `${pct}%`;
  bar?.parentElement?.setAttribute('aria-valuenow', String(pct));
}

function updateMobileBar(step = state.currentStep) {
  const btn = $id('mbbCta');
  if (!btn) return;
  const labels = {
    1: 'Continuer →',
    2: 'Continuer →',
    3: 'Continuer →',
    4: 'Payer maintenant →'
  };
  btn.textContent = labels[step] || 'Commander →';
  btn.setAttribute('aria-label', labels[step] || 'Commander');
}

function updateSummarySheet() {
  const data = {
    mobSheetRef: state.productRef || '—',
    mobSheetName: state.productName || state.productRef || '—',
    mobSheetQty: `×${state.quantity}`,
    mobSheetAmount: state.hasProduct ? fmt.euro(state.subtotal) : '—',
    mobSheetShipping: fmt.euro(CONFIG.shipping.price),
    mobSheetTotal: state.hasProduct ? fmt.euro(state.total) : '—',
  };

  Object.entries(data).forEach(([id, val]) => {
    const el = $id(id);
    if (el) el.innerHTML = val;
  });
}

function render() {
  const hasProduct = state.hasProduct;

  $id('amountCard')?.classList.toggle('has-value', hasProduct);

  const amountDisplay = $id('amountDisplay');
  if (amountDisplay) {
    if (hasProduct) {
      const prev = parseFloat(amountDisplay.dataset.prevVal || '0');
      if (prev !== state.productPrice) flashPriceCard(state.productPrice);
      else amountDisplay.textContent = Math.round(state.productPrice);
    } else {
      amountDisplay.textContent = '—';
      amountDisplay.dataset.prevVal = '0';
    }
  }

  if ($id('amountCurrency')) {
    $id('amountCurrency').textContent = hasProduct ? '€' : '';
  }

  if ($id('amountHint')) {
    $id('amountHint').textContent = hasProduct
      ? `✓ ${state.productName || state.productRef} — ${fmt.euro(state.subtotal)}`
      : 'Entrez votre référence';
  }

  if ($id('amountQtyDisplay')) {
    const next = `×${state.quantity}`;
    if ($id('amountQtyDisplay').textContent !== next) {
      $id('amountQtyDisplay').textContent = next;
      bump($id('amountQtyDisplay'));
    }
  }

  if ($id('urgencyStrip')) {
    $id('urgencyStrip').hidden = !hasProduct;
  }

  if ($id('urgencyText') && hasProduct) {
    $id('urgencyText').textContent = `${state.productRef || 'Article'} — réservation active`;
  }

  const pairs = {
    summaryRef: state.productRef || '—',
    summaryName: state.productName || state.productRef || '—',
    summaryAmount: hasProduct ? fmt.euro(state.subtotal) : '—',
    summaryShipping: fmt.euro(CONFIG.shipping.price),
    summaryTotal: hasProduct ? fmt.euro(state.total) : '—',

    sbRef: state.productRef || '—',
    sbName: state.productName || (state.productRef || 'Entrez une référence'),
    sbAmount: hasProduct ? fmt.euro(state.subtotal) : '—',
    sbShipping: fmt.euro(CONFIG.shipping.price),
    sbTotal: hasProduct ? fmt.euro(state.total) : '—',

    mbbRef: hasProduct ? state.productRef : '',

    hiddenAmount: state.productPrice.toFixed(2),
    hiddenQuantity: String(state.quantity),
    hiddenShipping: CONFIG.shipping.price.toFixed(2),
    hiddenTotal: state.total.toFixed(2),
    hiddenPaymentMode: 'stripe',
  };

  Object.entries(pairs).forEach(([id, val]) => {
    const el = $id(id);
    if (!el) return;
    if ('value' in el) el.value = val;
    else el.textContent = val;
  });

  if ($id('summaryQty')) {
    $id('summaryQty').textContent = `×${state.quantity}`;
    $id('summaryQty').style.display = state.quantity > 1 ? '' : 'none';
  }

  if ($id('mbbTotal')) {
    const next = hasProduct ? fmt.euro(state.total) : '—';
    if ($id('mbbTotal').textContent !== next) {
      $id('mbbTotal').textContent = next;
      bump($id('mbbTotal'));
    }
  }

  updateSummarySheet();

  if ($id('sidebarStripeLink')) {
    $id('sidebarStripeLink').classList.toggle('hidden', !hasProduct || state.currentStep !== 4);
  }

  updateProgress();
  updateMobileBar();
}

function goToStep(n) {
  state.currentStep = n;

  for (let i = 1; i <= 4; i++) {
    const el = $id(`step${i}`);
    if (el) el.hidden = i !== n;
  }

  for (let i = 1; i <= 4; i++) {
    const item = $id(`sn${i}`);
    if (!item) continue;

    item.classList.remove('active', 'done');
    item.removeAttribute('aria-current');

    if (i === n) {
      item.classList.add('active');
      item.setAttribute('aria-current', 'step');
    } else if (i < n) {
      item.classList.add('done');
    }
  }

  for (let i = 1; i <= 3; i++) {
    $id(`snLine${i}`)?.classList.toggle('filled', i < n);
  }

  updateMobileBar(n);
}

function showErr(id, msg) {
  const el = $id(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
  const input = $id(id.replace('Error', ''));
  input?.classList.add('invalid');
  input?.classList.remove('valid');
}

function clearErr(id) {
  const el = $id(id);
  if (!el) return;
  el.textContent = '';
  el.classList.remove('visible');
  $id(id.replace('Error', ''))?.classList.remove('invalid');
}

function markValid(id) {
  const input = $id(id);
  if (input) {
    input.classList.add('valid');
    input.classList.remove('invalid');
  }
}

function validateStep(step) {
  let ok = true;

  if (step === 1) {
    const ref = ($id('reference')?.value || '').trim();
    if (!ref) {
      showErr('referenceError', 'Veuillez entrer une référence produit.');
      $id('reference')?.focus();
      return false;
    }

    if (!state.isKnownRef && !$id('customPriceField')?.hidden) {
      const p = parseFloat($id('prix_unitaire')?.value || '0');
      if (p <= 0) {
        showErr('prix_unitaireError', 'Veuillez entrer un prix valide.');
        $id('prix_unitaire')?.focus();
        return false;
      }
    }
  }

  if (step === 2) {
    ['prenom','nom','email','telephone'].forEach((id) => {
      const el = $id(id);
      if (!el) return;
      const v = el.value.trim();

      if (!v) {
        showErr(`${id}Error`, 'Ce champ est requis.');
        if (ok) {
          el.focus();
          ok = false;
        }
      } else if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        showErr('emailError', 'Email invalide.');
        if (ok) {
          el.focus();
          ok = false;
        }
      } else if (id === 'telephone' && v.replace(/\s/g,'').length < 8) {
        showErr('telephoneError', 'Numéro trop court.');
        if (ok) {
          el.focus();
          ok = false;
        }
      }
    });
  }

  if (step === 3) {
    ['adresse1','ville','code_postal'].forEach((id) => {
      const el = $id(id);
      if (!el) return;
      const v = el.value.trim();

      if (!v) {
        showErr(`${id}Error`, 'Ce champ est requis.');
        if (ok) {
          el.focus();
          ok = false;
        }
      } else if (id === 'code_postal' && v.replace(/\s/g,'').length < 4) {
        showErr('code_postalError', 'Code postal invalide.');
        if (ok) {
          el.focus();
          ok = false;
        }
      }
    });
  }

  return ok;
}

function handleReference() {
  const raw = ($id('reference')?.value || '').trim();
  const upper = raw.toUpperCase();
  const product = CONFIG.products[upper];

  state.productRef = raw;

  const icon = $id('refIcon');
  const hint = $id('refHint');
  const input = $id('reference');
  const custom = $id('customPriceField');

  if (product) {
    state.isKnownRef = true;
    state.productName = product.name;
    state.productPrice = product.price;

    input?.classList.add('valid');
    input?.classList.remove('invalid');

    if (icon) {
      icon.textContent = '✓';
      icon.style.color = 'var(--green)';
    }

    if (hint) {
      hint.textContent = `Référence reconnue — ${product.name}`;
      hint.style.color = 'var(--green)';
    }

    if (custom) custom.hidden = true;
  } else if (raw.length > 0) {
    state.isKnownRef = false;
    state.productName = raw;
    state.productPrice = parseFloat($id('prix_unitaire')?.value || '0') || 0;

    input?.classList.remove('valid', 'invalid');

    if (icon) {
      icon.textContent = '€';
      icon.style.color = 'var(--gold-dk)';
    }

    if (hint) {
      hint.textContent = 'Référence libre — entrez le prix ci-dessous.';
      hint.style.color = '';
    }

    if (custom) custom.hidden = false;
  } else {
    state.isKnownRef = false;
    state.productName = '';
    state.productPrice = 0;

    input?.classList.remove('valid','invalid');

    if (icon) {
      icon.textContent = '';
      icon.style.color = '';
    }

    if (hint) {
      hint.textContent = 'Référence vue en live ou vente privée.';
      hint.style.color = '';
    }

    if (custom) custom.hidden = true;
  }

  clearErr('referenceError');
  render();
}

function handlePriceInput() {
  state.productPrice = Math.max(0, parseFloat($id('prix_unitaire')?.value || '0') || 0);
  if (!state.isKnownRef) state.productName = state.productRef || '';
  clearErr('prix_unitaireError');
  render();
}

function setQuantity(qty) {
  state.quantity = Math.max(1, Math.min(99, qty));
  if ($id('quantite')) $id('quantite').value = String(state.quantity);
  render();
}

function renderStep1Summary() {
  const el = $id('step1Summary');
  if (!el) return;

  const ref = state.productRef || '—';
  const total = state.hasProduct ? fmt.euro(state.total) : '—';

  el.innerHTML = `
    <span class="ss-check" aria-hidden="true">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </span>
    <span class="ss-text">${escapeHtml(ref)} · Qté ${state.quantity} · ${total}</span>
    <span class="ss-edit" data-edit="1" role="button" tabindex="0">Modifier</span>
  `;

  const edit = el.querySelector('[data-edit]');
  edit?.addEventListener('click', () => goToStep(1));
  edit?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') goToStep(1);
  });
}

function renderStep2Summary() {
  const el = $id('step2Summary');
  if (!el) return;

  const prenom = ($id('prenom')?.value || '').trim();
  const email = ($id('email')?.value || '').trim();

  el.innerHTML = `
    <span class="ss-check" aria-hidden="true">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </span>
    <span class="ss-text">${escapeHtml(prenom)} · ${escapeHtml(email)}</span>
    <span class="ss-edit" data-edit="2" role="button" tabindex="0">Modifier</span>
  `;

  const edit = el.querySelector('[data-edit]');
  edit?.addEventListener('click', () => goToStep(2));
  edit?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') goToStep(2);
  });
}

function initRipple() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-ripple');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-circle';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;

    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 620);
  });
}

function initInlineValidation() {
  const rules = {
    email: { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: 'Email invalide.' },
    telephone: { minLen: 8, msg: 'Numéro trop court.' },
    code_postal: { minLen: 4, msg: 'Code postal invalide.' }
  };

  ['prenom','nom','email','telephone','adresse1','ville','code_postal'].forEach((id) => {
    const el = $id(id);
    if (!el) return;

    el.addEventListener('blur', () => {
      const v = el.value.trim();
      const errId = `${id}Error`;

      if (!v) return showErr(errId, 'Ce champ est requis.');

      const rule = rules[id];
      if (rule?.regex && !rule.regex.test(v)) return showErr(errId, rule.msg);
      if (rule?.minLen && v.replace(/\s/g,'').length < rule.minLen) return showErr(errId, rule.msg);

      clearErr(errId);
      markValid(id);
      updateProgress();
    });

    el.addEventListener('input', () => {
      clearErr(`${id}Error`);
      updateProgress();
    });
  });
}

function initAutosave() {
  const key = 'lo_draft_v10';
  const fields = ['prenom','nom','email','telephone','adresse1','adresse2','ville','code_postal','pseudo'];

  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    fields.forEach((id) => {
      const el = $id(id);
      if (el && saved[id]) el.value = saved[id];
    });
  } catch (_) {}

  fields.forEach((id) => {
    $id(id)?.addEventListener('input', () => {
      try {
        const draft = {};
        fields.forEach((fid) => {
          const field = $id(fid);
          if (field?.value) draft[fid] = field.value;
        });
        localStorage.setItem(key, JSON.stringify(draft));
      } catch (_) {}
    });
  });
}

function initMobileSummarySheet() {
  const trigger = $id('mobSummaryTrigger');
  const sheet = $id('mobSummarySheet');
  const backdrop = $id('mobSheetBackdrop');
  const closeBtn = $id('mobSheetClose');

  if (!trigger || !sheet || !backdrop) return;

  const close = () => {
    backdrop.hidden = true;
    sheet.hidden = true;
    sheet.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const open = () => {
    updateSummarySheet();
    backdrop.hidden = false;
    sheet.hidden = false;
    sheet.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  trigger.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sheet.hidden) close();
  });
}

function initSocialProof() {
  let viewers = CONFIG.socialProof.baseViewers + Math.floor(Math.random() * 20);
  const el = $id('liveViewers');
  if (el) el.textContent = String(viewers);

  setInterval(() => {
    const delta = Math.floor(Math.random() * 7) - 3;
    viewers = Math.max(75, viewers + delta);
    if (!el) return;
    const current = parseInt(el.textContent || String(viewers), 10) || viewers;
    animateNumber(el, current, viewers, 500);
  }, 8000);
}

function initPurchasePopup() {
  const popup = $id('purchasePopup');
  if (!popup) return;

  const refs = Object.keys(CONFIG.products);
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const showNext = () => {
    const name = rand(CONFIG.popupNames);
    const tpl = rand(CONFIG.popupTemplates);
    const ref = Math.random() < 0.4 ? rand(refs) : null;
    const msg = tpl(name, ref);

    $id('ppName').textContent = name;
    $id('ppProduct').textContent = msg.startsWith(name) ? msg.slice(name.length).trim() : msg;
    $id('ppTime').textContent = "à l'instant";

    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), CONFIG.popupDisplayMs);

    const next = CONFIG.popupMinInterval + Math.floor(Math.random() * (CONFIG.popupMaxInterval - CONFIG.popupMinInterval));
    setTimeout(showNext, next + CONFIG.popupDisplayMs + 400);
  };

  setTimeout(showNext, CONFIG.popupFirstDelay);
}

function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll('.social-card, .social-hub-head');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('reveal', 'revealed');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach((el) => io.observe(el));
}

function initReset() {
  $id('resetAllBtn')?.addEventListener('click', () => {
    state.currentStep = 1;
    state.productRef = '';
    state.productName = '';
    state.productPrice = 0;
    state.isKnownRef = false;
    state.quantity = 1;
    state.isSubmitting = false;

    $id('orderForm')?.reset();

    if ($id('customPriceField')) $id('customPriceField').hidden = true;

    document.querySelectorAll('.field-err').forEach((el) => el.classList.remove('visible'));
    document.querySelectorAll('.inp').forEach((el) => el.classList.remove('valid', 'invalid'));

    goToStep(1);
    render();
  });
}

function initKeyboardNav() {
  $id('reference')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $id('step1Next')?.click();
    }
  });
}

function syncStripeLink() {
  const link = $id('sidebarStripeLink');
  if (link) link.href = CONFIG.stripeLink;
}

function initEvents() {
  $id('reference')?.addEventListener('input', handleReference);
  $id('prix_unitaire')?.addEventListener('input', handlePriceInput);

  $id('qtyMinus')?.addEventListener('click', () => setQuantity(state.quantity - 1));
  $id('qtyPlus')?.addEventListener('click', () => setQuantity(state.quantity + 1));

  ['prenom','nom','email','telephone','adresse1','adresse2','ville','code_postal','notes','pseudo'].forEach((id) => {
    $id(id)?.addEventListener('input', updateProgress);
  });

  $id('step1Next')?.addEventListener('click', () => {
    if (!validateStep(1)) return;
    renderStep1Summary();
    goToStep(2);
    setTimeout(() => $id('prenom')?.focus(), 250);
  });

  $id('step2Next')?.addEventListener('click', () => {
    if (!validateStep(2)) return;
    renderStep2Summary();
    goToStep(3);
    setTimeout(() => $id('adresse1')?.focus(), 250);
  });

  $id('step3Next')?.addEventListener('click', () => {
    if (!validateStep(3)) return;
    goToStep(4);
    setTimeout(() => $id('submitBtn')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
  });

  $id('mbbCta')?.addEventListener('click', () => {
    if (state.currentStep < 4) {
      $id(`step${state.currentStep}Next`)?.click();
    } else {
      $id('submitBtn')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  $id('orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.isSubmitting) return;

    if (!validateStep(1)) { goToStep(1); return; }
    if (!validateStep(2)) { goToStep(2); return; }
    if (!validateStep(3)) { goToStep(3); return; }

    state.isSubmitting = true;

    const btn = $id('submitBtn');
    const txt = $id('submitBtnText');

    btn?.classList.add('loading');
    btn?.setAttribute('disabled', 'disabled');
    if (txt) txt.textContent = 'Redirection vers Stripe…';

    document.querySelector('.submit-err')?.remove();

    try {
      const form = $id('orderForm');
      const data = new FormData(form);

      const res = await fetch(CONFIG.formspreeEndpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data
      });

      if (!res.ok) throw new Error('submit_failed');

      window.location.href = CONFIG.stripeLink;
    } catch (err) {
      const error = document.createElement('div');
      error.className = 'submit-err';
      error.setAttribute('role', 'alert');
      error.textContent = 'Une erreur est survenue. Veuillez réessayer.';

      btn?.insertAdjacentElement('beforebegin', error);
      btn?.classList.remove('loading');
      btn?.removeAttribute('disabled');

      if (txt) txt.textContent = 'Payer et confirmer ma commande';

      state.isSubmitting = false;
    }
  });
}

function init() {
  syncStripeLink();
  initRipple();
  initInlineValidation();
  initAutosave();
  initMobileSummarySheet();
  initSocialProof();
  initPurchasePopup();
  initScrollReveal();
  initReset();
  initKeyboardNav();
  initEvents();
  handleReference();
  render();
  goToStep(1);
}

document.addEventListener('DOMContentLoaded', init);
