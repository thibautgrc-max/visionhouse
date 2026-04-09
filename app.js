/* ══════════════════════════════════════════════════════════════
   LIVEORDER PRO — app.js v9.0
   Architecture : CRO-First · Stripe uniquement · Zero relay friction
   Submit       : Formspree → redirection immédiate Stripe
   Livraison    : Réassurance statique — Mondial Relay + Chronopost
══════════════════════════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════
const CONFIG = {

  // ── Produits connus
  products: {
    QZ01: { price: 39,  name: 'Produit QZ01' },
    DR02: { price: 119, name: 'Produit DR02' },
    JB07: { price: 59,  name: 'Produit JB07' },
    AL11: { price: 24,  name: 'Produit AL11' },
  },

  shipping: {
    default: { price: 6.00, label: 'Mondial Relay · Chronopost' },
  },

  // ── Endpoints à configurer
  formspreeEndpoint: 'https://formspree.io/f/TON_FORM_ID',
  stripeLink:        'https://buy.stripe.com/TON_LIEN_STRIPE',

  // ── Social proof
  socialProof: {
    baseOrders:  32,
    baseViewers: 135,
  },

  popupFirstDelay:   9000,
  popupMinInterval: 18000,
  popupMaxInterval: 34000,
  popupDisplayMs:    4800,

  popupNames: [
    'Emma','Lucas','Camille','Théo','Lina','Nathan','Sarah','Julien',
    'Inès','Maxime','Léa','Enzo','Manon','Hugo','Clara','Baptiste',
    'Jade','Tom','Anaïs','Louis','Alice','Romain','Zoé','Antoine',
    'Nora','Alexandre','Eva','Raphaël','Laura','Matteo','Chloé','Axel',
    'Ambre','Valentin','Nina','Arthur','Elisa','Clément','Mia','Paul',
    'Lucie','Adrien','Yasmine','Quentin','Sofia','Kevin','Léonie','Ethan',
    'Margot','Nicolas','Alix','Simon','Inaya','Pierre','Céline','Thomas',
    'Elina','Florian','Marie','Dylan','Charlotte','Mathis','Océane','Robin',
  ],

  popupTemplates: [
    n => `${n} vient de réserver`,
    n => `${n} a effectué une commande`,
    n => `${n} vient de commander`,
    n => `${n} a réservé un article`,
    n => `${n} vient de passer commande`,
    n => `${n} a sécurisé son article`,
    (n, ref) => ref ? `${n} vient de commander ${ref}` : `${n} vient de commander`,
    (n, ref) => ref ? `${n} a réservé — ${ref}` : `${n} a réservé`,
  ],
};

// ════════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════════
const state = {
  currentStep:   1,
  productRef:    '',
  productName:   '',
  productPrice:  0,
  isKnownRef:    false,
  quantity:      1,
  shippingPrice: CONFIG.shipping.default.price,
  shippingLabel: CONFIG.shipping.default.label,

  get subtotal()   { return this.productPrice * this.quantity; },
  get total()      { return this.productPrice > 0 ? this.subtotal + this.shippingPrice : 0; },
  get hasProduct() { return this.productPrice > 0; },
};

// ════════════════════════════════════════════════════════════════
// DOM — cache lazily
// ════════════════════════════════════════════════════════════════
const _domCache = {};
function $id(id) {
  if (!_domCache[id]) _domCache[id] = document.getElementById(id);
  return _domCache[id];
}
function $qs(sel)  { return document.querySelector(sel); }
function $qsa(sel) { return document.querySelectorAll(sel); }

const DOM = {
  liveViewers:    () => $id('liveViewers'),
  progressBar:    () => $id('progressBar'),
  resetBtn:       () => $id('resetAllBtn'),

  form:         () => $id('orderForm'),
  submitBtn:    () => $id('submitBtn'),
  submitBtnTxt: () => $id('submitBtnText'),
  stepNav:      () => $id('stepNav'),

  referenceInput:   () => $id('reference'),
  refIcon:          () => $id('refIcon'),
  refHint:          () => $id('refHint'),
  customPriceField: () => $id('customPriceField'),
  prixInput:        () => $id('prix_unitaire'),
  quantiteInput:    () => $id('quantite'),
  qtyMinus:         () => $id('qtyMinus'),
  qtyPlus:          () => $id('qtyPlus'),
  amountCard:       () => $id('amountCard'),
  amountDisplay:    () => $id('amountDisplay'),
  amountCurrency:   () => $id('amountCurrency'),
  amountHint:       () => $id('amountHint'),
  amountQtyDisplay: () => $id('amountQtyDisplay'),
  urgencyStrip:     () => $id('urgencyStrip'),
  urgencyText:      () => $id('urgencyText'),
  step1Next:        () => $id('step1Next'),

  step2:      () => $id('step2'),
  step1Sum:   () => $id('step1Summary'),
  step2Next:  () => $id('step2Next'),

  step3:      () => $id('step3'),
  step2Sum:   () => $id('step2Summary'),
  step3Next:  () => $id('step3Next'),

  step4:           () => $id('step4'),
  summaryRef:      () => $id('summaryRef'),
  summaryName:     () => $id('summaryName'),
  summaryQty:      () => $id('summaryQty'),
  summaryAmount:   () => $id('summaryAmount'),
  summaryShipping: () => $id('summaryShipping'),
  summaryTotal:    () => $id('summaryTotal'),

  sbRef:      () => $id('sbRef'),
  sbName:     () => $id('sbName'),
  sbAmount:   () => $id('sbAmount'),
  sbShipping: () => $id('sbShipping'),
  sbTotal:    () => $id('sbTotal'),
  sbPayCta:   () => $id('sidebarStripeLink'),

  hiddenAmount:       () => $id('hiddenAmount'),
  hiddenQuantity:     () => $id('hiddenQuantity'),
  hiddenShipping:     () => $id('hiddenShipping'),
  hiddenTotal:        () => $id('hiddenTotal'),
  hiddenPaymentMode:  () => $id('hiddenPaymentMode'),

  mbbRef:   () => $id('mbbRef'),
  mbbTotal: () => $id('mbbTotal'),
  mbbCta:   () => $id('mbbCta'),

  purchasePopup: () => $id('purchasePopup'),
  ppName:        () => $id('ppName'),
  ppProduct:     () => $id('ppProduct'),
  ppTime:        () => $id('ppTime'),

  sn:     (n) => $id(`sn${n}`),
  snLine: (n) => $id(`snLine${n}`),
};

// ════════════════════════════════════════════════════════════════
// FORMATTERS
// ════════════════════════════════════════════════════════════════
const fmt = {
  euro: v => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' }).format(v),
};

// ════════════════════════════════════════════════════════════════
// MICRO-INTERACTIONS
// ════════════════════════════════════════════════════════════════
function animateNumber(el, from, to, duration = 320) {
  if (!el) return;
  if (from === to || isNaN(from) || isNaN(to)) {
    el.textContent = (to === 0 || isNaN(to)) ? '—' : Math.round(to);
    return;
  }
  const start = performance.now();
  const tick  = (now) => {
    const p    = Math.min((now - start) / duration, 1);
    const ease = p < .5 ? 2*p*p : -1 + (4-2*p)*p;
    el.textContent = Math.round(from + (to - from) * ease);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = Math.round(to);
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
  const el = DOM.amountDisplay();
  if (!el) return;
  const prev = parseFloat(el.dataset.prevVal || '0');
  el.dataset.prevVal = newVal;
  el.classList.add('animating');
  setTimeout(() => {
    el.classList.remove('animating');
    animateNumber(el, prev, newVal);
  }, 120);
}

// ════════════════════════════════════════════════════════════════
// RIPPLE
// ════════════════════════════════════════════════════════════════
function initRipple() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.js-ripple');
    if (!btn) return;
    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 2;
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;
    const ripple = document.createElement('span');
    ripple.className  = 'ripple-circle';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 620);
  });
}

// ════════════════════════════════════════════════════════════════
// RENDER — sync all UI from state
// ════════════════════════════════════════════════════════════════
function render() {
  const { hasProduct, productPrice, productName, productRef, subtotal, total, shippingPrice, quantity } = state;

  const ac = DOM.amountCard();
  if (ac) {
    const wasActive = ac.classList.contains('has-value');
    ac.classList.toggle('has-value', hasProduct);
    if (hasProduct && !wasActive) flashPriceCard(productPrice);
  }

  const ad = DOM.amountDisplay();
  if (ad) {
    if (hasProduct) {
      const prev = parseFloat(ad.dataset.prevVal || '0');
      if (prev !== productPrice) flashPriceCard(productPrice);
      else ad.textContent = Math.round(productPrice);
    } else {
      ad.textContent   = '—';
      ad.dataset.prevVal = '0';
    }
  }

  const curr = DOM.amountCurrency();
  if (curr) curr.textContent = hasProduct ? '€' : '';

  const ah = DOM.amountHint();
  if (ah) ah.textContent = hasProduct
    ? `✓ ${productName || productRef} — ${fmt.euro(subtotal)}`
    : 'Entrez votre référence';

  const aqd = DOM.amountQtyDisplay();
  if (aqd) {
    const next = `×${quantity}`;
    if (aqd.textContent !== next) { aqd.textContent = next; bump(aqd); }
  }

  // Step 4 recap
  const sr = DOM.summaryRef();  if (sr) sr.textContent = productRef || '—';
  const sn = DOM.summaryName(); if (sn) sn.textContent = productName || productRef || '—';
  const sq = DOM.summaryQty();
  if (sq) { sq.textContent = `×${quantity}`; sq.style.display = quantity > 1 ? '' : 'none'; }
  const sa = DOM.summaryAmount();   if (sa) sa.textContent = hasProduct ? fmt.euro(subtotal) : '—';
  const ss = DOM.summaryShipping(); if (ss) ss.textContent = fmt.euro(shippingPrice);
  const st = DOM.summaryTotal();
  if (st) {
    const next = hasProduct ? fmt.euro(total) : '—';
    if (st.textContent !== next) { st.textContent = next; bump(st); }
  }

  // Sidebar
  const sbr = DOM.sbRef();    if (sbr) sbr.textContent = productRef || '—';
  const sbn = DOM.sbName();   if (sbn) sbn.textContent = productName || (productRef ? productRef : 'Entrez une référence');
  const sba = DOM.sbAmount(); if (sba) sba.textContent = hasProduct ? fmt.euro(subtotal) : '—';
  const sbsh = DOM.sbShipping(); if (sbsh) sbsh.textContent = fmt.euro(shippingPrice);
  const sbt = DOM.sbTotal();
  if (sbt) {
    const next = hasProduct ? fmt.euro(total) : '—';
    if (sbt.textContent !== next) { sbt.textContent = next; bump(sbt); }
  }

  const sbCta = DOM.sbPayCta();
  if (sbCta) sbCta.classList.toggle('hidden', !hasProduct);

  // Mobile bar
  const mr = DOM.mbbRef();
  if (mr) mr.textContent = hasProduct ? (productRef || '') : '';

  const mt = DOM.mbbTotal();
  if (mt) {
    const next = hasProduct ? fmt.euro(total) : '—';
    if (mt.textContent !== next) { mt.textContent = next; bump(mt); }
  }

  // Hidden fields
  const ha = DOM.hiddenAmount();  if (ha) ha.value = productPrice.toFixed(2);
  const hq = DOM.hiddenQuantity(); if (hq) hq.value = quantity;
  const hs = DOM.hiddenShipping(); if (hs) hs.value = shippingPrice.toFixed(2);
  const ht = DOM.hiddenTotal();   if (ht) ht.value = total.toFixed(2);
  const hpm = DOM.hiddenPaymentMode(); if (hpm) hpm.value = 'stripe';

  updateProgress();
}

// ════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ════════════════════════════════════════════════════════════════
const PROGRESS_FIELDS = ['reference','prenom','nom','email','telephone','adresse1','ville','code_postal'];

function updateProgress() {
  const filled = PROGRESS_FIELDS.filter(id => {
    const el = document.getElementById(id);
    return el && el.value.trim().length > 0;
  }).length;
  const pb  = DOM.progressBar();
  const pct = Math.round(filled / PROGRESS_FIELDS.length * 100);
  if (pb) {
    pb.style.width = `${pct}%`;
    pb.parentElement?.setAttribute('aria-valuenow', pct);
  }
}

// ════════════════════════════════════════════════════════════════
// STEP NAVIGATION
// ════════════════════════════════════════════════════════════════
function goToStep(n) {
  const prev = state.currentStep;
  state.currentStep = n;

  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step${i}`);
    if (!el) continue;
    if (i === n) {
      el.hidden = false;
      requestAnimationFrame(() => {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = '';
      });
    } else if (i > n) {
      el.hidden = true;
    }
  }

  for (let i = 1; i <= 4; i++) {
    const sni = DOM.sn(i);
    if (!sni) continue;
    sni.classList.remove('active', 'done');
    sni.removeAttribute('aria-current');
    if (i === n) {
      sni.classList.add('active');
      sni.setAttribute('aria-current', 'step');
    } else if (i < n) {
      sni.classList.add('done');
    }
  }

  for (let i = 1; i <= 3; i++) {
    const ln = DOM.snLine(i);
    if (ln) ln.classList.toggle('filled', i < n);
  }

  updateMobileBar(n);

  if (n > prev) {
    const stepEl = document.getElementById(`step${n}`);
    if (stepEl) {
      setTimeout(() => {
        const topbarH = DOM.progressBar()?.parentElement?.offsetHeight || 58;
        const y = stepEl.getBoundingClientRect().top + window.scrollY - topbarH - 16;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 60);
    }
  }
}

function updateMobileBar(step) {
  const btn = DOM.mbbCta();
  if (!btn) return;
  const labels = {
    1: 'Continuer →',
    2: 'Continuer →',
    3: 'Continuer →',
    4: 'Payer maintenant →',
  };
  btn.textContent = labels[step] || 'Commander →';
  btn.setAttribute('aria-label', labels[step] || 'Commander');
}

// ════════════════════════════════════════════════════════════════
// STEP SUMMARIES
// ════════════════════════════════════════════════════════════════
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderStep1Summary() {
  const el = DOM.step1Sum();
  if (!el) return;
  const ref   = state.productRef || '—';
  const total = state.hasProduct ? fmt.euro(state.total) : '—';
  el.innerHTML = `
    <span class="ss-check" aria-hidden="true">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </span>
    <span class="ss-text">${escapeHtml(ref)} · Qté ${state.quantity} · ${total}</span>
    <span class="ss-edit" data-edit="1" role="button" tabindex="0" aria-label="Modifier le produit">Modifier</span>
  `;
  const edit = el.querySelector('[data-edit]');
  if (edit) {
    edit.addEventListener('click', () => goToStep(1));
    edit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') goToStep(1); });
  }
}

function renderStep2Summary() {
  const el = DOM.step2Sum();
  if (!el) return;
  const prenom = document.getElementById('prenom')?.value || '';
  const email  = document.getElementById('email')?.value  || '';
  el.innerHTML = `
    <span class="ss-check" aria-hidden="true">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </span>
    <span class="ss-text">${escapeHtml(prenom)} · ${escapeHtml(email)}</span>
    <span class="ss-edit" data-edit="2" role="button" tabindex="0" aria-label="Modifier les coordonnées">Modifier</span>
  `;
  const edit = el.querySelector('[data-edit]');
  if (edit) {
    edit.addEventListener('click', () => goToStep(2));
    edit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') goToStep(2); });
  }
}

// ════════════════════════════════════════════════════════════════
// FIELD VALIDATION HELPERS
// ════════════════════════════════════════════════════════════════
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.textContent = msg;
  el.classList.add('visible');
  const inputId = id.replace('Error', '');
  const input   = document.getElementById(inputId);
  if (input) { input.classList.add('invalid'); input.classList.remove('valid'); }
  return true;
}

function clearErr(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = '';
  el.classList.remove('visible');
  const inputId = id.replace('Error', '');
  const input   = document.getElementById(inputId);
  if (input) input.classList.remove('invalid');
}

function markValid(id) {
  const input = document.getElementById(id);
  if (input) { input.classList.add('valid'); input.classList.remove('invalid'); }
}

// ════════════════════════════════════════════════════════════════
// STEP VALIDATION
// ════════════════════════════════════════════════════════════════
function validateStep(step) {
  let ok = true;

  if (step === 1) {
    const ref = DOM.referenceInput()?.value.trim() || '';
    if (!ref) {
      showErr('referenceError', 'Veuillez entrer une référence produit.');
      DOM.referenceInput()?.focus();
      ok = false;
    }
    if (ok && !state.isKnownRef) {
      const p = parseFloat(DOM.prixInput()?.value) || 0;
      if (p <= 0 && !DOM.customPriceField()?.hidden) {
        showErr('prix_unitaireError', 'Veuillez entrer un prix valide.');
        DOM.prixInput()?.focus();
        ok = false;
      }
    }
  }

  if (step === 2) {
    const fields = ['prenom','nom','email','telephone'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const v = el.value.trim();
      if (!v) {
        showErr(`${id}Error`, 'Ce champ est requis.');
        if (ok) { el.focus(); ok = false; }
      } else {
        if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
          showErr('emailError', 'Email invalide.');
          if (ok) { el.focus(); ok = false; }
        }
        if (id === 'telephone' && v.replace(/\s/g,'').length < 8) {
          showErr('telephoneError', 'Numéro trop court.');
          if (ok) { el.focus(); ok = false; }
        }
      }
    });
  }

  if (step === 3) {
    const fields = ['adresse1','ville','code_postal'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const v = el.value.trim();
      if (!v) {
        showErr(`${id}Error`, 'Ce champ est requis.');
        if (ok) { el.focus(); ok = false; }
      } else {
        if (id === 'code_postal' && v.replace(/\s/g,'').length < 4) {
          showErr('code_postalError', 'Code postal invalide.');
          if (ok) { el.focus(); ok = false; }
        }
      }
    });
  }

  return ok;
}

// ════════════════════════════════════════════════════════════════
// REFERENCE HANDLER
// ════════════════════════════════════════════════════════════════
function handleReference() {
  const raw   = DOM.referenceInput()?.value.trim() || '';
  const upper = raw.toUpperCase();
  const prod  = CONFIG.products[upper];

  state.productRef = raw;

  const icon = DOM.refIcon();
  const hint = DOM.refHint();
  const inp  = DOM.referenceInput();
  const cpf  = DOM.customPriceField();
  const us   = DOM.urgencyStrip();
  const ut   = DOM.urgencyText();

  if (prod) {
    state.isKnownRef   = true;
    state.productName  = prod.name;
    state.productPrice = prod.price;

    if (inp) { inp.classList.add('valid'); inp.classList.remove('invalid'); }
    if (icon) { icon.textContent = '✓'; icon.style.color = 'var(--green)'; }
    if (hint) { hint.textContent = `${prod.name} — ${fmt.euro(prod.price)} reconnu`; hint.style.color = 'var(--green)'; }
    if (cpf) cpf.hidden = true;

    if (us) {
      us.hidden = false;
      const phrases = [
        `Article ${upper} — réservation active`,
        `Prix confirmé : ${fmt.euro(prod.price)}`,
        `Article reconnu — en attente de paiement`,
      ];
      if (ut) ut.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    }

  } else if (raw.length >= 2) {
    state.isKnownRef   = false;
    state.productName  = raw;
    state.productPrice = 0;

    if (inp) inp.classList.remove('valid','invalid');
    if (icon) { icon.textContent = ''; icon.style.color = ''; }
    if (hint) { hint.textContent = 'Référence libre — entrez le prix ci-dessous.'; hint.style.color = ''; }
    if (cpf) cpf.hidden = false;
    if (us) us.hidden = true;

  } else {
    state.isKnownRef   = false;
    state.productName  = '';
    state.productPrice = 0;

    if (inp) inp.classList.remove('valid','invalid');
    if (icon) { icon.textContent = ''; icon.style.color = ''; }
    if (hint) { hint.textContent = 'Référence vue en live. Toute description acceptée.'; hint.style.color = ''; }
    if (cpf) cpf.hidden = true;
    if (us) us.hidden = true;
  }

  clearErr('referenceError');
  render();
  updateProgress();
}

function handlePriceInput() {
  const p = parseFloat(DOM.prixInput()?.value) || 0;
  state.productPrice = p > 0 ? p : 0;
  clearErr('prix_unitaireError');
  render();
}

// ════════════════════════════════════════════════════════════════
// QUANTITY
// ════════════════════════════════════════════════════════════════
function setQuantity(n) {
  state.quantity = Math.max(1, Math.min(99, n));
  const qi = DOM.quantiteInput();
  if (qi) qi.value = state.quantity;
  render();
}

// ════════════════════════════════════════════════════════════════
// STEP NEXT BUTTONS
// ════════════════════════════════════════════════════════════════
function bindStepNextButtons() {
  DOM.step1Next()?.addEventListener('click', () => {
    if (!validateStep(1)) return;
    renderStep1Summary();
    goToStep(2);
    setTimeout(() => document.getElementById('prenom')?.focus(), 420);
  });

  DOM.step2Next()?.addEventListener('click', () => {
    if (!validateStep(2)) return;
    renderStep2Summary();
    goToStep(3);
    setTimeout(() => document.getElementById('adresse1')?.focus(), 420);
  });

  DOM.step3Next()?.addEventListener('click', () => {
    if (!validateStep(3)) return;
    render();
    goToStep(4);
    setTimeout(() => DOM.submitBtn()?.scrollIntoView({ behavior:'smooth', block:'center' }), 420);
  });
}

// ════════════════════════════════════════════════════════════════
// MOBILE BAR CTA — context-aware
// ════════════════════════════════════════════════════════════════
function initMobileBar() {
  DOM.mbbCta()?.addEventListener('click', () => {
    const s = state.currentStep;
    if (s < 4) {
      document.getElementById(`step${s}Next`)?.click();
    } else {
      DOM.submitBtn()?.scrollIntoView({ behavior:'smooth', block:'center' });
    }
  });
}

// ════════════════════════════════════════════════════════════════
// INLINE VALIDATION
// ════════════════════════════════════════════════════════════════
function initInlineValidation() {
  const rules = {
    email:       { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: 'Email invalide.' },
    telephone:   { minLen: 8, msg: 'Numéro trop court.' },
    code_postal: { minLen: 4, msg: 'Code postal invalide.' },
  };
  const required = ['prenom','nom','email','telephone','adresse1','ville','code_postal'];

  required.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('blur', () => {
      const v = el.value.trim();
      const errId = `${id}Error`;
      if (!v) { showErr(errId, 'Ce champ est requis.'); return; }
      const rule = rules[id];
      if (rule?.regex && !rule.regex.test(v)) { showErr(errId, rule.msg); return; }
      if (rule?.minLen && v.replace(/\s/g,'').length < rule.minLen) { showErr(errId, rule.msg); return; }
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

// ════════════════════════════════════════════════════════════════
// AUTOSAVE — localStorage
// ════════════════════════════════════════════════════════════════
function initAutosave() {
  const KEY    = 'lo_draft';
  const FIELDS = ['prenom','nom','email','telephone','adresse1','adresse2','ville','code_postal','pseudo'];

  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && saved[id]) el.value = saved[id];
    });
    if (Object.keys(saved).length) updateProgress();
  } catch (_) {}

  FIELDS.forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      try {
        const draft = {};
        FIELDS.forEach(fid => {
          const fel = document.getElementById(fid);
          if (fel?.value) draft[fid] = fel.value;
        });
        localStorage.setItem(KEY, JSON.stringify(draft));
      } catch (_) {}
    });
  });
}

// ════════════════════════════════════════════════════════════════
// SOCIAL PROOF
// ════════════════════════════════════════════════════════════════
function initSocialProof() {
  let viewers = CONFIG.socialProof.baseViewers + Math.floor(Math.random() * 20);

  function updateViewers(newVal) {
    const el = DOM.liveViewers();
    if (!el) return;
    const old = parseInt(el.textContent) || viewers;
    animateNumber(el, old, newVal, 500);
  }

  updateViewers(viewers);

  setInterval(() => {
    const delta = Math.floor(Math.random() * 7) - 3;
    viewers = Math.max(75, viewers + delta);
    updateViewers(viewers);
  }, 8000);
}

// ════════════════════════════════════════════════════════════════
// PURCHASE POPUP
// ════════════════════════════════════════════════════════════════
function initPurchasePopup() {
  const popup = DOM.purchasePopup();
  if (!popup) return;

  const names     = CONFIG.popupNames;
  const templates = CONFIG.popupTemplates;
  const refs      = Object.keys(CONFIG.products);

  let namePool = [], tmplPool = [];

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function refillNamePool() { namePool = shuffle(names); }
  function refillTmplPool() { tmplPool = shuffle([...Array(templates.length).keys()]); }

  refillNamePool();
  refillTmplPool();

  function nextName()     { if (!namePool.length) refillNamePool(); return namePool.pop(); }
  function nextTemplate() { if (!tmplPool.length) refillTmplPool(); return templates[tmplPool.pop()]; }

  function showNext() {
    const name   = nextName();
    const tpl    = nextTemplate();
    const useRef = Math.random() < 0.4;
    const ref    = useRef ? refs[Math.floor(Math.random() * refs.length)] : null;
    const msg    = tpl(name, ref);

    const pn = DOM.ppName();
    const pp = DOM.ppProduct();
    const pt = DOM.ppTime();
    if (pn) pn.textContent = name;
    if (pp) {
      const body = msg.startsWith(name) ? msg.slice(name.length).trim() : msg;
      pp.textContent = body;
    }
    if (pt) pt.textContent = "à l'instant";

    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), CONFIG.popupDisplayMs);

    const next = CONFIG.popupMinInterval
      + Math.floor(Math.random() * (CONFIG.popupMaxInterval - CONFIG.popupMinInterval));
    setTimeout(showNext, next + CONFIG.popupDisplayMs + 400);
  }

  setTimeout(showNext, CONFIG.popupFirstDelay);
}

// ════════════════════════════════════════════════════════════════
// STRIPE LINKS — sync
// ════════════════════════════════════════════════════════════════
function syncStripeLinks() {
  const el = document.getElementById('sidebarStripeLink');
  if (el) el.href = CONFIG.stripeLink;
}

// ════════════════════════════════════════════════════════════════
// SCROLL REVEAL
// ════════════════════════════════════════════════════════════════
function initScrollReveal() {
  const targets = document.querySelectorAll('.social-card, .social-hub-head');
  if (!targets.length || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('revealed'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const delay = el.classList.contains('social-card')
        ? Array.from(el.parentElement?.children || []).indexOf(el) * 80
        : 0;
      setTimeout(() => el.classList.add('reveal', 'revealed'), delay);
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => io.observe(el));
}

// ════════════════════════════════════════════════════════════════
// HAPTIC SCALE (mobile)
// ════════════════════════════════════════════════════════════════
function initHapticScale() {
  document.querySelectorAll('.step-next, .cta-btn, .mob-cta, .hero-cta').forEach(btn => {
    btn.addEventListener('touchstart', () => { btn.style.transform = 'scale(0.97)'; }, { passive: true });
    btn.addEventListener('touchend',   () => { btn.style.transform = ''; }, { passive: true });
    btn.addEventListener('touchcancel',() => { btn.style.transform = ''; }, { passive: true });
  });
}

// ════════════════════════════════════════════════════════════════
// KEYBOARD NAV
// ════════════════════════════════════════════════════════════════
function initKeyboardNav() {
  DOM.referenceInput()?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); DOM.step1Next()?.click(); }
  });

  ['prenom','nom','email','telephone'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const inputs = ['prenom','nom','email','telephone'];
      const idx = inputs.indexOf(id);
      if (idx < inputs.length - 1) {
        document.getElementById(inputs[idx + 1])?.focus();
      } else {
        DOM.step2Next()?.click();
      }
    });
  });

  ['adresse1','adresse2','code_postal','ville'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const seq = ['adresse1','adresse2','code_postal','ville'];
      const idx = seq.indexOf(id);
      if (idx < seq.length - 1) {
        document.getElementById(seq[idx + 1])?.focus();
      } else {
        DOM.step3Next()?.click();
      }
    });
  });
}

// ════════════════════════════════════════════════════════════════
// FORM SUBMIT — Formspree → redirection Stripe immédiate
// ════════════════════════════════════════════════════════════════
let isSubmitting = false;

DOM.form()?.addEventListener('submit', async e => {
  e.preventDefault();

  if (isSubmitting) return;
  if (!validateStep(3)) return;

  const btn    = DOM.submitBtn();
  const btnTxt = DOM.submitBtnTxt();
  const pb     = DOM.progressBar();

  isSubmitting = true;
  if (btn) { btn.disabled = true; btn.classList.add('loading'); }
  if (btnTxt) btnTxt.style.opacity = '0';
  if (pb) pb.style.width = '95%';

  try {
    const res = await fetch(CONFIG.formspreeEndpoint, {
      method:  'POST',
      body:    new FormData(DOM.form()),
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      if (pb) pb.style.width = '100%';
      try { localStorage.removeItem('lo_draft'); } catch (_) {}
      // Redirection immédiate vers Stripe — aucun écran intermédiaire
      window.location.href = CONFIG.stripeLink;
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Erreur ${res.status}`);
    }

  } catch (err) {
    console.error('[LiveOrder] Submit error:', err);
    isSubmitting = false;
    if (btn) { btn.disabled = false; btn.classList.remove('loading'); }
    if (btnTxt) { btnTxt.style.opacity = '1'; btnTxt.textContent = 'Payer et confirmer ma commande'; }
    if (pb) pb.style.width = '90%';

    document.querySelector('.submit-err')?.remove();
    const errEl = document.createElement('div');
    errEl.className = 'submit-err';
    errEl.setAttribute('role', 'alert');
    errEl.style.cssText = `
      margin-top:12px; padding:12px 16px;
      background:var(--red-bg); border:1px solid var(--red-border);
      border-radius:var(--r-sm); font-size:.79rem; color:var(--red);
      text-align:center; font-weight:500; animation:fadeUp .3s ease both;
    `;
    errEl.textContent = 'Une erreur est survenue. Vérifiez votre connexion et réessayez.';
    btn?.insertAdjacentElement('afterend', errEl);
    setTimeout(() => errEl.remove(), 7000);
  }
});

// ════════════════════════════════════════════════════════════════
// RESET
// ════════════════════════════════════════════════════════════════
DOM.resetBtn()?.addEventListener('click', resetAll);

function resetAll() {
  DOM.form()?.reset();
  DOM.stepNav().style.display = '';

  const btn = DOM.submitBtn();
  if (btn) { btn.disabled = false; btn.classList.remove('loading'); }
  const btnTxt = DOM.submitBtnTxt();
  if (btnTxt) { btnTxt.style.opacity = '1'; btnTxt.textContent = 'Payer et confirmer ma commande'; }

  Object.assign(state, {
    currentStep:   1,
    productRef:    '',
    productName:   '',
    productPrice:  0,
    isKnownRef:    false,
    quantity:      1,
    shippingPrice: CONFIG.shipping.default.price,
    shippingLabel: CONFIG.shipping.default.label,
  });

  isSubmitting = false;

  DOM.customPriceField() && (DOM.customPriceField().hidden = true);
  DOM.urgencyStrip()     && (DOM.urgencyStrip().hidden     = true);

  const hint = DOM.refHint();
  if (hint) { hint.textContent = 'Référence vue en live. Toute description acceptée.'; hint.style.color = ''; }

  const icon = DOM.refIcon();
  if (icon) { icon.textContent = ''; icon.style.color = ''; }

  DOM.referenceInput()?.classList.remove('valid','invalid');
  document.querySelectorAll('.inp').forEach(el => el.classList.remove('valid','invalid'));
  document.querySelectorAll('.field-err').forEach(el => { el.textContent = ''; el.classList.remove('visible'); });
  document.querySelectorAll('.step-summary').forEach(el => el.innerHTML = '');

  goToStep(1);
  setQuantity(1);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ════════════════════════════════════════════════════════════════
// EVENT BINDINGS
// ════════════════════════════════════════════════════════════════
DOM.referenceInput()?.addEventListener('input', handleReference);
DOM.prixInput()?.addEventListener('input', handlePriceInput);
DOM.prixInput()?.addEventListener('blur',  handlePriceInput);
DOM.qtyMinus()?.addEventListener('click',  () => setQuantity(state.quantity - 1));
DOM.qtyPlus()?.addEventListener('click',   () => setQuantity(state.quantity + 1));

// ════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════
(function init() {
  syncStripeLinks();
  render();
  updateProgress();
  initSocialProof();
  initPurchasePopup();
  initMobileBar();
  initInlineValidation();
  initAutosave();
  bindStepNextButtons();
  initRipple();
  initKeyboardNav();
  initScrollReveal();
  initHapticScale();
  goToStep(1);
})();
