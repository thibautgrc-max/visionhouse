/* ══════════════════════════════════════════════════════════════
   LIVEORDER PRO — app.js v4.0
   Architecture : State-driven · Progressive Steps · CRO-First
══════════════════════════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════════════════════════════
// CONFIG — Edit products, endpoints, and social proof here
// ════════════════════════════════════════════════════════════════
const CONFIG = {
  products: {
    QZ01: { price: 39,  name: 'Produit QZ01' },
    DR02: { price: 119, name: 'Produit DR02' },
    JB07: { price: 59,  name: 'Produit JB07' },
    AL11: { price: 24,  name: 'Produit AL11' },
  },
  shipping: {
    default: { price: 6.00, label: 'Relais Standard' },
  },
  formspreeEndpoint: 'https://formspree.io/f/TON_FORM_ID',
  stripeLink:        'https://buy.stripe.com/TON_LIEN_STRIPE',
  socialProof: {
    baseOrders:  32,
    baseViewers: 135,
    urgencyBase: 8,
  },
  // Social proof — rotation dynamique
  popupFirstDelay:   9000,   // délai avant la 1ʳᵉ apparition
  popupMinInterval: 18000,   // intervalle minimum entre deux popups
  popupMaxInterval: 34000,   // intervalle maximum
  popupDisplayMs:    4800,   // durée d'affichage

  // Prénoms variés, crédibles, français et internationaux
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

  // Formulations sobres et variées
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
// STATE — Single source of truth
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
  paymentMode:   'stripe',

  get subtotal()   { return this.productPrice * this.quantity; },
  get total()      { return this.productPrice > 0 ? this.subtotal + this.shippingPrice : 0; },
  get hasProduct() { return this.productPrice > 0; },
};

// ════════════════════════════════════════════════════════════════
// DOM — Cached selectors
// ════════════════════════════════════════════════════════════════
const DOM = {
  // topbar
  liveViewers:    () => document.getElementById('liveViewers'),
  heroOrderCount: () => document.getElementById('heroOrderCount'),
  progressBar:    () => document.getElementById('progressBar'),
  resetBtn:       () => document.getElementById('resetAllBtn'),

  // form
  form:         () => document.getElementById('orderForm'),
  submitBtn:    () => document.getElementById('submitBtn'),
  submitBtnTxt: () => document.getElementById('submitBtnText'),
  successState: () => document.getElementById('successState'),
  stepNav:      () => document.getElementById('stepNav'),

  // step 1
  referenceInput:   () => document.getElementById('reference'),
  refIcon:          () => document.getElementById('refIcon'),
  refHint:          () => document.getElementById('refHint'),
  customPriceField: () => document.getElementById('customPriceField'),
  prixInput:        () => document.getElementById('prix_unitaire'),
  quantiteInput:    () => document.getElementById('quantite'),
  qtyMinus:         () => document.getElementById('qtyMinus'),
  qtyPlus:          () => document.getElementById('qtyPlus'),
  amountCard:       () => document.getElementById('amountCard'),
  amountDisplay:    () => document.getElementById('amountDisplay'),
  amountCurrency:   () => document.getElementById('amountCurrency'),
  amountHint:       () => document.getElementById('amountHint'),
  amountQtyDisplay: () => document.getElementById('amountQtyDisplay'),
  urgencyStrip:     () => document.getElementById('urgencyStrip'),
  urgencyText:      () => document.getElementById('urgencyText'),
  step1Next:        () => document.getElementById('step1Next'),

  // step 2
  step2:      () => document.getElementById('step2'),
  step1Sum:   () => document.getElementById('step1Summary'),
  step2Next:  () => document.getElementById('step2Next'),

  // step 3
  step3:      () => document.getElementById('step3'),
  step2Sum:   () => document.getElementById('step2Summary'),
  step3Next:  () => document.getElementById('step3Next'),
  shippingOpts: () => document.querySelectorAll('[data-shipping-price]'),

  // step 4
  step4:           () => document.getElementById('step4'),
  summaryRef:      () => document.getElementById('summaryRef'),
  summaryName:     () => document.getElementById('summaryName'),
  summaryQty:      () => document.getElementById('summaryQty'),
  summaryAmount:   () => document.getElementById('summaryAmount'),
  summaryShipping: () => document.getElementById('summaryShipping'),
  summaryTotal:    () => document.getElementById('summaryTotal'),
  paymentOpts:     () => document.querySelectorAll('[data-payment-mode]'),

  // sidebar
  sbRef:      () => document.getElementById('sbRef'),
  sbName:     () => document.getElementById('sbName'),
  sbAmount:   () => document.getElementById('sbAmount'),
  sbShipping: () => document.getElementById('sbShipping'),
  sbTotal:    () => document.getElementById('sbTotal'),

  // hidden
  hiddenAmount:        () => document.getElementById('hiddenAmount'),
  hiddenQuantity:      () => document.getElementById('hiddenQuantity'),
  hiddenShipping:      () => document.getElementById('hiddenShipping'),
  hiddenTotal:         () => document.getElementById('hiddenTotal'),
  hiddenShippingLabel: () => document.getElementById('hiddenShippingLabel'),
  hiddenPaymentMode:   () => document.getElementById('hiddenPaymentMode'),

  // mobile bar
  mbbTotal: () => document.getElementById('mbbTotal'),
  mbbCta:   () => document.getElementById('mbbCta'),

  // stripe links
  stripeLinks: () => [
    document.getElementById('stripePaymentLink'),
    document.getElementById('sidebarStripeLink'),
    document.getElementById('successStripeLink'),
  ],

  // popup
  purchasePopup: () => document.getElementById('purchasePopup'),
  ppName:        () => document.getElementById('ppName'),
  ppProduct:     () => document.getElementById('ppProduct'),
  ppTime:        () => document.getElementById('ppTime'),

  // step indicators
  sn: (n) => document.getElementById(`sn${n}`),
  snLine: (n) => document.getElementById(`snLine${n}`),
};

// ════════════════════════════════════════════════════════════════
// FORMATTERS
// ════════════════════════════════════════════════════════════════
const fmt = {
  euro: v => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' }).format(v),
};

// ════════════════════════════════════════════════════════════════
// RENDER — Sync all UI from state
// ════════════════════════════════════════════════════════════════
function render() {
  const { hasProduct, productPrice, productName, productRef,
          subtotal, total, shippingPrice, quantity, paymentMode } = state;

  // Price card
  const ac = DOM.amountCard();
  if (ac) ac.classList.toggle('has-value', hasProduct);
  const ad = DOM.amountDisplay(); if (ad) ad.textContent = hasProduct ? productPrice.toFixed(0) : '—';
  const curr = DOM.amountCurrency(); if (curr) curr.textContent = hasProduct ? '€' : '';
  const ah = DOM.amountHint();
  if (ah) ah.textContent = hasProduct
    ? `✓ ${productName || productRef} — ${fmt.euro(subtotal)}`
    : 'Entrez votre référence';
  const aqd = DOM.amountQtyDisplay(); if (aqd) aqd.textContent = `×${quantity}`;

  // Step 4 recap
  const sr = DOM.summaryRef(); if (sr) sr.textContent = productRef || '—';
  const sn = DOM.summaryName(); if (sn) sn.textContent = productName || productRef || '—';
  const sq = DOM.summaryQty(); if (sq) { sq.textContent = `×${quantity}`; sq.style.display = quantity > 1 ? '' : 'none'; }
  const sa = DOM.summaryAmount(); if (sa) sa.textContent = hasProduct ? fmt.euro(subtotal) : '—';
  const ss = DOM.summaryShipping(); if (ss) ss.textContent = fmt.euro(shippingPrice);
  const st = DOM.summaryTotal(); if (st) st.textContent = hasProduct ? fmt.euro(total) : '—';

  // Sidebar
  const sbr = DOM.sbRef(); if (sbr) sbr.textContent = productRef || '—';
  const sbn = DOM.sbName(); if (sbn) sbn.textContent = productName || (productRef ? productRef : 'Entrez une référence');
  const sba = DOM.sbAmount(); if (sba) sba.textContent = hasProduct ? fmt.euro(subtotal) : '—';
  const sbsh = DOM.sbShipping(); if (sbsh) sbsh.textContent = fmt.euro(shippingPrice);
  const sbt = DOM.sbTotal(); if (sbt) sbt.textContent = hasProduct ? fmt.euro(total) : '—';

  // Mobile bar
  const mt = DOM.mbbTotal(); if (mt) mt.textContent = hasProduct ? fmt.euro(total) : '—';

  // Hidden fields
  const ha = DOM.hiddenAmount(); if (ha) ha.value = productPrice.toFixed(2);
  const hq = DOM.hiddenQuantity(); if (hq) hq.value = quantity;
  const hs = DOM.hiddenShipping(); if (hs) hs.value = shippingPrice.toFixed(2);
  const ht = DOM.hiddenTotal(); if (ht) ht.value = total.toFixed(2);
  const hsl = DOM.hiddenShippingLabel(); if (hsl) hsl.value = state.shippingLabel;
  const hpm = DOM.hiddenPaymentMode(); if (hpm) hpm.value = paymentMode;

  // Progress bar
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
  const pb = DOM.progressBar();
  if (pb) pb.style.width = `${Math.round(filled / PROGRESS_FIELDS.length * 100)}%`;
}

// ════════════════════════════════════════════════════════════════
// STEP NAVIGATION
// ════════════════════════════════════════════════════════════════
function goToStep(n) {
  // update state
  const prev = state.currentStep;
  state.currentStep = n;

  // hide/show steps
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step${i}`);
    if (!el) continue;
    if (i === n) {
      el.hidden = false;
      // allow DOM to paint then animate
      requestAnimationFrame(() => {
        el.style.animation = 'none';
        el.offsetHeight; // reflow
        el.style.animation = '';
      });
    } else if (i > n) {
      el.hidden = true;
    }
    // completed steps stay visible (not hidden) but could be collapsed
  }

  // update step nav indicators
  for (let i = 1; i <= 4; i++) {
    const sni = DOM.sn(i);
    if (!sni) continue;
    sni.classList.remove('active', 'done');
    if (i === n)    sni.classList.add('active');
    else if (i < n) sni.classList.add('done');
  }

  // update connector lines
  for (let i = 1; i <= 3; i++) {
    const ln = DOM.snLine(i);
    if (ln) ln.classList.toggle('filled', i < n);
  }

  // update mobile bar CTA
  updateMobileBar(n);

  // scroll tunnel into view smoothly (only if going forward)
  if (n > prev) {
    const stepEl = document.getElementById(`step${n}`);
    if (stepEl) {
      setTimeout(() => {
        stepEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    4: 'Valider la commande →',
  };
  btn.textContent = labels[step] || 'Commander →';
}

// ════════════════════════════════════════════════════════════════
// STEP SUMMARIES (show completed step recap at top of next)
// ════════════════════════════════════════════════════════════════
function renderStep1Summary() {
  const el = DOM.step1Sum();
  if (!el) return;
  const ref = state.productRef || '—';
  const total = state.hasProduct ? fmt.euro(state.total) : '—';
  el.innerHTML = `
    <span class="ss-check">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </span>
    <span class="ss-text">${ref} · Qté ${state.quantity} · ${total}</span>
    <span class="ss-edit" data-edit="1">Modifier</span>
  `;
  el.querySelector('[data-edit]')?.addEventListener('click', () => goToStep(1));
}

function renderStep2Summary() {
  const el = DOM.step2Sum();
  if (!el) return;
  const prenom = document.getElementById('prenom')?.value || '';
  const email  = document.getElementById('email')?.value || '';
  el.innerHTML = `
    <span class="ss-check">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </span>
    <span class="ss-text">${prenom} · ${email}</span>
    <span class="ss-edit" data-edit="2">Modifier</span>
  `;
  el.querySelector('[data-edit]')?.addEventListener('click', () => goToStep(2));
}

// ════════════════════════════════════════════════════════════════
// FIELD VALIDATION
// ════════════════════════════════════════════════════════════════
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.textContent = msg;
  el.classList.add('visible');
  const input = document.getElementById(id.replace('Error',''));
  input?.classList.add('invalid');
  input?.classList.remove('valid');
  return true;
}
function clearErr(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = '';
  el.classList.remove('visible');
  const input = document.getElementById(id.replace('Error',''));
  input?.classList.remove('invalid');
}
function markValid(inputId) {
  const input = document.getElementById(inputId);
  if (input) { input.classList.add('valid'); input.classList.remove('invalid'); }
}

function validateStep(n) {
  let ok = true;

  if (n === 1) {
    const ref = document.getElementById('reference')?.value.trim();
    if (!ref) { showErr('referenceError', 'Référence requise.'); ok = false; }
    else clearErr('referenceError');

    if (!state.isKnownRef) {
      const p = parseFloat(document.getElementById('prix_unitaire')?.value);
      if (!p || p <= 0) { showErr('prix_unitaireError', 'Prix requis.'); ok = false; }
      else clearErr('prix_unitaireError');
    }
  }

  if (n === 2) {
    const fields = [
      { id: 'prenom',    msg: 'Prénom requis.' },
      { id: 'nom',       msg: 'Nom requis.' },
      { id: 'email',     msg: 'Email requis.', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, regexMsg: 'Email invalide.' },
      { id: 'telephone', msg: 'Téléphone requis.', minLen: 8, minMsg: 'Numéro trop court.' },
    ];
    fields.forEach(({ id, msg, regex, regexMsg, minLen, minMsg }) => {
      const v = document.getElementById(id)?.value.trim();
      if (!v) { showErr(`${id}Error`, msg); ok = false; }
      else if (regex && !regex.test(v)) { showErr(`${id}Error`, regexMsg); ok = false; }
      else if (minLen && v.replace(/\s/g,'').length < minLen) { showErr(`${id}Error`, minMsg); ok = false; }
      else { clearErr(`${id}Error`); markValid(id); }
    });
  }

  if (n === 3) {
    const fields = [
      { id: 'adresse1',    msg: 'Adresse requise.' },
      { id: 'code_postal', msg: 'Code postal requis.', minLen: 4, minMsg: 'Code postal invalide.' },
      { id: 'ville',       msg: 'Ville requise.' },
    ];
    fields.forEach(({ id, msg, minLen, minMsg }) => {
      const v = document.getElementById(id)?.value.trim();
      if (!v) { showErr(`${id}Error`, msg); ok = false; }
      else if (minLen && v.length < minLen) { showErr(`${id}Error`, minMsg); ok = false; }
      else { clearErr(`${id}Error`); markValid(id); }
    });
  }

  return ok;
}

// ════════════════════════════════════════════════════════════════
// REFERENCE INPUT — auto-resolve
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
    if (hint) { hint.textContent = `✓ Référence reconnue — ${prod.name} · ${fmt.euro(prod.price)}`; hint.style.color = 'var(--green)'; }
    if (cpf) cpf.hidden = true;
    clearErr('prix_unitaireError');

    // Urgency strip
    if (us && ut) {
      const n = CONFIG.socialProof.urgencyBase + Math.floor(Math.random() * 8);
      ut.textContent = `${n} personnes regardent ce produit`;
      us.hidden = false;
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
  // Step 1 → 2
  DOM.step1Next()?.addEventListener('click', () => {
    if (!validateStep(1)) return;
    renderStep1Summary();
    goToStep(2);
    // focus first field
    setTimeout(() => document.getElementById('prenom')?.focus(), 400);
  });

  // Step 2 → 3
  DOM.step2Next()?.addEventListener('click', () => {
    if (!validateStep(2)) return;
    renderStep2Summary();
    goToStep(3);
    setTimeout(() => document.getElementById('adresse1')?.focus(), 400);
  });

  // Step 3 → 4
  DOM.step3Next()?.addEventListener('click', () => {
    if (!validateStep(3)) return;
    render(); // ensure recap is fresh
    goToStep(4);
    // scroll to order recap
    setTimeout(() => DOM.step4()?.scrollIntoView({ behavior:'smooth', block:'start' }), 60);
  });
}

// ════════════════════════════════════════════════════════════════
// MOBILE BAR CTA — context-aware
// ════════════════════════════════════════════════════════════════
function initMobileBar() {
  DOM.mbbCta()?.addEventListener('click', () => {
    const s = state.currentStep;
    if (s < 4) {
      // trigger the relevant "Continuer" button
      document.getElementById(`step${s}Next`)?.click();
    } else {
      // scroll to submit
      DOM.submitBtn()?.scrollIntoView({ behavior:'smooth', block:'center' });
    }
  });
}

// ════════════════════════════════════════════════════════════════
// SHIPPING OPTIONS
// ════════════════════════════════════════════════════════════════
function initShipping() {
  DOM.shippingOpts().forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.shippingOpts().forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.shippingPrice = parseFloat(btn.dataset.shippingPrice);
      state.shippingLabel = btn.dataset.shippingLabel;
      render();
    });
  });
}

// ════════════════════════════════════════════════════════════════
// PAYMENT OPTIONS
// ════════════════════════════════════════════════════════════════
function initPayment() {
  DOM.paymentOpts().forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.paymentOpts().forEach(b => {
        b.classList.remove('active');
        b.querySelector('.po-radio')?.classList.remove('checked');
      });
      btn.classList.add('active');
      btn.querySelector('.po-radio')?.classList.add('checked');
      state.paymentMode = btn.dataset.paymentMode;
      render();
    });
  });
}

// ════════════════════════════════════════════════════════════════
// FORM SUBMIT
// ════════════════════════════════════════════════════════════════
DOM.form()?.addEventListener('submit', async e => {
  e.preventDefault();

  const btn    = DOM.submitBtn();
  const btnTxt = DOM.submitBtnTxt();
  const pb     = DOM.progressBar();

  btn.disabled = true;
  btn.classList.add('loading');
  if (btnTxt) btnTxt.textContent = 'Envoi en cours…';
  if (pb) pb.style.width = '95%';

  try {
    const res = await fetch(CONFIG.formspreeEndpoint, {
      method: 'POST',
      body: new FormData(DOM.form()),
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      DOM.form().hidden         = true;
      DOM.successState().hidden = false;
      DOM.stepNav().style.display = 'none';
      DOM.successState().scrollIntoView({ behavior:'smooth', block:'start' });
      if (pb) pb.style.width = '100%';

      // auto-clear localStorage draft
      try { localStorage.removeItem('lo_draft'); } catch (_) {}

    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Erreur serveur (${res.status})`);
    }

  } catch (err) {
    console.error('[LiveOrder] Submit error:', err);
    btn.disabled = false;
    btn.classList.remove('loading');
    if (btnTxt) btnTxt.textContent = 'Valider ma commande';
    if (pb) pb.style.width = '90%';

    // inline error
    document.querySelector('.submit-err')?.remove();
    const errEl = document.createElement('div');
    errEl.className = 'submit-err';
    errEl.style.cssText = `
      margin-top:10px; padding:11px 14px;
      background:var(--red-bg); border:1px solid var(--red-border);
      border-radius:var(--r-sm); font-size:.79rem; color:var(--red);
      text-align:center; font-weight:400; animation: fadeUp .3s ease both;
    `;
    errEl.textContent = 'Une erreur est survenue. Vérifiez votre connexion et réessayez.';
    btn.insertAdjacentElement('afterend', errEl);
    setTimeout(() => errEl.remove(), 7000);
  }
});

// ════════════════════════════════════════════════════════════════
// RESET
// ════════════════════════════════════════════════════════════════
DOM.resetBtn()?.addEventListener('click', resetAll);

function resetAll() {
  DOM.form().reset();
  DOM.form().hidden         = false;
  DOM.successState().hidden = true;
  DOM.stepNav().style.display = '';
  DOM.submitBtn().disabled  = false;
  DOM.submitBtn().classList.remove('loading');
  if (DOM.submitBtnTxt()) DOM.submitBtnTxt().textContent = 'Valider ma commande';

  Object.assign(state, {
    currentStep: 1, productRef: '', productName: '',
    productPrice: 0, isKnownRef: false, quantity: 1,
    shippingPrice: CONFIG.shipping.default.price,
    shippingLabel: CONFIG.shipping.default.label,
    paymentMode: 'stripe',
  });

  DOM.shippingOpts().forEach((b, i) => b.classList.toggle('active', i === 0));
  DOM.paymentOpts().forEach((b, i)  => {
    b.classList.toggle('active', i === 0);
    b.querySelector('.po-radio')?.classList.toggle('checked', i === 0);
  });

  DOM.customPriceField().hidden = true;
  DOM.urgencyStrip().hidden     = true;
  if (DOM.refHint())  { DOM.refHint().textContent = 'Référence vue en live. Toute description acceptée.'; DOM.refHint().style.color = ''; }
  if (DOM.refIcon())  { DOM.refIcon().textContent = ''; DOM.refIcon().style.color = ''; }
  const ri = DOM.referenceInput(); if (ri) ri.classList.remove('valid','invalid');

  document.querySelectorAll('.inp').forEach(el => el.classList.remove('valid','invalid'));
  document.querySelectorAll('.field-err').forEach(el => { el.textContent = ''; el.classList.remove('visible'); });
  document.querySelectorAll('.step-summary').forEach(el => el.innerHTML = '');

  goToStep(1);
  setQuantity(1);
  render();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ════════════════════════════════════════════════════════════════
// INLINE VALIDATION — blur-based for each input
// ════════════════════════════════════════════════════════════════
function initInlineValidation() {
  const rules = {
    email: { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: 'Email invalide.' },
    telephone: { minLen: 8, msg: 'Numéro trop court.' },
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
      clearErr(errId); markValid(id);
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
// SOCIAL PROOF — animated counters
// ════════════════════════════════════════════════════════════════
function initSocialProof() {
  const { baseOrders, baseViewers } = CONFIG.socialProof;

  let orders  = baseOrders;
  let viewers = baseViewers + Math.floor(Math.random() * 20);

  const oc = DOM.heroOrderCount(); if (oc) oc.textContent = orders;
  const lv = DOM.liveViewers();    if (lv) lv.textContent = viewers;

  setInterval(() => {
    if (Math.random() < .14) {
      orders += Math.floor(Math.random() * 3) + 1;
      const el = DOM.heroOrderCount(); if (el) el.textContent = orders;
    }
  }, 13000);

  setInterval(() => {
    viewers = Math.max(75, viewers + Math.floor(Math.random() * 7) - 3);
    const el = DOM.liveViewers(); if (el) el.textContent = viewers;
  }, 8000);
}

// ════════════════════════════════════════════════════════════════
// PURCHASE POPUP — rotation dynamique de prénoms
// ════════════════════════════════════════════════════════════════
function initPurchasePopup() {
  const popup = DOM.purchasePopup();
  if (!popup) return;

  const names     = CONFIG.popupNames;
  const templates = CONFIG.popupTemplates;
  const refs      = Object.keys(CONFIG.products); // ['QZ01','DR02','JB07','AL11']

  // Shuffled index tracker pour éviter les répétitions trop rapides
  let namePool  = [];
  let tmplPool  = [];

  function refillNamePool() {
    // Fisher-Yates shuffle d'une copie
    namePool = [...names];
    for (let i = namePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [namePool[i], namePool[j]] = [namePool[j], namePool[i]];
    }
  }

  function refillTmplPool() {
    tmplPool = [...Array(templates.length).keys()];
    for (let i = tmplPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tmplPool[i], tmplPool[j]] = [tmplPool[j], tmplPool[i]];
    }
  }

  refillNamePool();
  refillTmplPool();

  function nextName() {
    if (!namePool.length) refillNamePool();
    return namePool.pop();
  }

  function nextTemplate() {
    if (!tmplPool.length) refillTmplPool();
    return templates[tmplPool.pop()];
  }

  function showNext() {
    const name = nextName();
    const tpl  = nextTemplate();
    // Ajouter une référence produit ~40 % du temps
    const useRef = Math.random() < 0.4;
    const ref    = useRef ? refs[Math.floor(Math.random() * refs.length)] : null;
    const msg    = tpl(name, ref);

    const pn = DOM.ppName();    if (pn) pn.textContent = name;
    const pp = DOM.ppProduct(); if (pp) pp.textContent = msg.replace(name, '').trim();
    const pt = DOM.ppTime();    if (pt) pt.textContent = "à l'instant";

    // ppName affiche le prénom, ppProduct le reste du message
    if (pn) pn.textContent = name;
    if (pp) {
      // Extraire la partie sans le prénom en début de chaîne
      const body = msg.startsWith(name) ? msg.slice(name.length).trim() : msg;
      pp.textContent = body;
    }

    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), CONFIG.popupDisplayMs);

    // Planifier la prochaine apparition
    const next = CONFIG.popupMinInterval
      + Math.floor(Math.random() * (CONFIG.popupMaxInterval - CONFIG.popupMinInterval));
    setTimeout(showNext, next + CONFIG.popupDisplayMs + 400);
  }

  // Première apparition après le délai initial
  setTimeout(showNext, CONFIG.popupFirstDelay);
}

// ════════════════════════════════════════════════════════════════
// STRIPE LINKS — sync
// ════════════════════════════════════════════════════════════════
function syncStripeLinks() {
  DOM.stripeLinks().forEach(el => { if (el) el.href = CONFIG.stripeLink; });
}

// ════════════════════════════════════════════════════════════════
// EVENT BINDINGS
// ════════════════════════════════════════════════════════════════
DOM.referenceInput()?.addEventListener('input', handleReference);
DOM.prixInput()?.addEventListener('input', handlePriceInput);
DOM.prixInput()?.addEventListener('blur',  handlePriceInput);
DOM.qtyMinus()?.addEventListener('click',  () => setQuantity(state.quantity - 1));
DOM.qtyPlus()?.addEventListener('click',   () => setQuantity(state.quantity + 1));

// Enter key on reference auto-triggers step
DOM.referenceInput()?.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); DOM.step1Next()?.click(); }
});

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
  initShipping();
  initPayment();
  initInlineValidation();
  initAutosave();
  bindStepNextButtons();
  goToStep(1);
})();
