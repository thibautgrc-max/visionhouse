/* ══════════════════════════════════════════════════════════════
   LIVEORDER PRO — app.js v2.0
   Architecture : Modules découplés · State centralisé · Flex product
══════════════════════════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════════════════════════════
// CONFIGURATION
// Modifier ici : produits catalogue, Formspree, Stripe, livraison
// ════════════════════════════════════════════════════════════════
const CONFIG = {
  // Catalogue produits (références prédéfinies → prix auto)
  // Laissez vide {} pour tout-manuel, ou ajoutez autant de refs que voulu
  products: {
    QZ01: { price: 39,  name: 'Produit QZ01' },
    DR02: { price: 119, name: 'Produit DR02' },
    JB07: { price: 59,  name: 'Produit JB07' },
    AL11: { price: 24,  name: 'Produit AL11' },
  },
  shipping: {
    default: { price: 6.00, label: 'Relais Standard' },
  },
  // 🔧 Remplacer par votre endpoint Formspree
  formspreeEndpoint: 'https://formspree.io/f/TON_FORM_ID',
  // 🔧 Remplacer par votre lien Stripe
  stripeLink: 'https://buy.stripe.com/TON_LIEN_STRIPE',
  // Social proof simulé (nombre initial affiché, animé vers le haut)
  socialProof: {
    baseOrders: 32,
    baseViewers: 135,
  },
};

// ════════════════════════════════════════════════════════════════
// ÉTAT APPLICATIF (source de vérité unique)
// ════════════════════════════════════════════════════════════════
const state = {
  productRef:    '',
  productName:   '',
  productPrice:  0,        // prix unitaire résolu
  isKnownRef:    false,    // true si ref dans catalogue
  quantity:      1,
  shippingPrice: CONFIG.shipping.default.price,
  shippingLabel: CONFIG.shipping.default.label,
  paymentMode:   'stripe',

  get subtotal()    { return this.productPrice * this.quantity; },
  get total()       { return this.productPrice > 0 ? this.subtotal + this.shippingPrice : 0; },
  get hasProduct()  { return this.productPrice > 0; },
};

// ════════════════════════════════════════════════════════════════
// SÉLECTEURS DOM (cache unique)
// ════════════════════════════════════════════════════════════════
const DOM = {
  // Topbar
  liveViewers:   document.getElementById('liveViewers'),
  heroOrderCount: document.getElementById('heroOrderCount'),

  // Formulaire
  form:           document.getElementById('orderForm'),
  submitBtn:      document.getElementById('submitBtn'),
  successState:   document.getElementById('successState'),

  // Étape 1 — Produit
  referenceInput:    document.getElementById('reference'),
  refIcon:           document.getElementById('refIcon'),
  refHint:           document.getElementById('refHint'),
  customPriceField:  document.getElementById('customPriceField'),
  prixInput:         document.getElementById('prix_unitaire'),
  quantiteInput:     document.getElementById('quantite'),
  qtyMinus:          document.getElementById('qtyMinus'),
  qtyPlus:           document.getElementById('qtyPlus'),

  // Carte montant
  amountCard:      document.getElementById('amountCard'),
  amountDisplay:   document.getElementById('amountDisplay'),
  amountCurrency:  document.getElementById('amountCurrency'),
  amountHint:      document.getElementById('amountHint'),
  amountQtyDisplay:document.getElementById('amountQtyDisplay'),

  // Livraison & paiement
  shippingBtns:    document.querySelectorAll('[data-shipping-price]'),
  paymentBtns:     document.querySelectorAll('[data-payment-mode]'),

  // Reset
  resetBtn:        document.getElementById('resetAllBtn'),

  // Champs cachés Formspree
  hiddenAmount:        document.getElementById('hiddenAmount'),
  hiddenQuantity:      document.getElementById('hiddenQuantity'),
  hiddenShipping:      document.getElementById('hiddenShipping'),
  hiddenTotal:         document.getElementById('hiddenTotal'),
  hiddenShippingLabel: document.getElementById('hiddenShippingLabel'),
  hiddenPaymentMode:   document.getElementById('hiddenPaymentMode'),

  // Sidebar récapitulatif
  summaryRef:     document.getElementById('summaryRef'),
  summaryName:    document.getElementById('summaryName'),
  summaryQty:     document.getElementById('summaryQty'),
  summaryAmount:  document.getElementById('summaryAmount'),
  summaryShipping:document.getElementById('summaryShipping'),
  summaryTotal:   document.getElementById('summaryTotal'),
  summaryPayMode: document.getElementById('summaryPaymentMode'),

  // Mobile bottom bar
  mbbTotal: document.getElementById('mbbTotal'),
  mbbCta:   document.getElementById('mbbCta'),

  // Liens Stripe (tous)
  stripeLinks: [
    document.getElementById('stripePaymentLink'),
    document.getElementById('sidebarStripeLink'),
    document.getElementById('successStripeLink'),
  ],

  // Barre de progression
  progressBar: document.getElementById('progressBar'),

  // Bouton texte
  get submitBtnText() { return this.submitBtn?.querySelector('.cta-btn-text'); },
};

// ════════════════════════════════════════════════════════════════
// FORMATAGE
// ════════════════════════════════════════════════════════════════
const fmt = {
  euro: v => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v),
  euroShort: v => `${v.toFixed(2).replace('.', ',')} €`,
};

// ════════════════════════════════════════════════════════════════
// RENDU — Mise à jour UI depuis le state
// ════════════════════════════════════════════════════════════════
function render() {
  const { hasProduct, productPrice, productName, productRef,
          subtotal, total, shippingPrice, quantity, paymentMode } = state;

  // ── Carte montant dynamique ──────────────────────────────────
  DOM.amountCard.classList.toggle('has-value', hasProduct);
  DOM.amountDisplay.textContent  = hasProduct ? productPrice.toFixed(0) : '—';
  DOM.amountCurrency.textContent = hasProduct ? '€' : '';
  DOM.amountHint.textContent     = hasProduct
    ? `✓ ${productName || productRef} — ${fmt.euro(subtotal)}`
    : 'Entrez votre référence ci-dessous';
  DOM.amountQtyDisplay.textContent = `×${quantity}`;

  // ── Sidebar récapitulatif ───────────────────────────────────
  DOM.summaryRef.textContent   = productRef  || '—';
  DOM.summaryName.textContent  = productName || (productRef ? productRef : 'Entrez une référence');
  DOM.summaryQty.hidden        = quantity <= 1;
  DOM.summaryQty.textContent   = `×${quantity}`;
  DOM.summaryAmount.textContent   = hasProduct ? fmt.euro(subtotal) : '—';
  DOM.summaryShipping.textContent = fmt.euro(shippingPrice);
  DOM.summaryTotal.textContent    = hasProduct ? fmt.euro(total) : '—';
  DOM.summaryPayMode.textContent  = paymentMode === 'stripe'
    ? 'Carte bancaire (Stripe)'
    : 'Validation manuelle';

  // ── Mobile bottom bar ────────────────────────────────────────
  DOM.mbbTotal.textContent = hasProduct ? fmt.euro(total) : '—';

  // ── Champs cachés Formspree ──────────────────────────────────
  DOM.hiddenAmount.value        = productPrice.toFixed(2);
  DOM.hiddenQuantity.value      = quantity;
  DOM.hiddenShipping.value      = shippingPrice.toFixed(2);
  DOM.hiddenTotal.value         = total.toFixed(2);
  DOM.hiddenShippingLabel.value = state.shippingLabel;
  DOM.hiddenPaymentMode.value   = paymentMode;
}

// ════════════════════════════════════════════════════════════════
// PROGRESSION — Calcule le % de complétion du formulaire
// ════════════════════════════════════════════════════════════════
const PROGRESS_FIELDS = ['reference', 'prenom', 'nom', 'email', 'telephone', 'adresse1', 'ville', 'code_postal'];

function updateProgress() {
  const total  = PROGRESS_FIELDS.length;
  const filled = PROGRESS_FIELDS.filter(id => {
    const el = document.getElementById(id);
    return el && el.value.trim().length > 0;
  }).length;

  const pct = Math.round((filled / total) * 100);
  DOM.progressBar.style.width = `${pct}%`;
}

// ════════════════════════════════════════════════════════════════
// RÉFÉRENCE PRODUIT — Logique flex (reconnue ou libre)
// ════════════════════════════════════════════════════════════════
function handleReferenceInput() {
  const raw     = DOM.referenceInput.value.trim();
  const upper   = raw.toUpperCase();
  const product = CONFIG.products[upper];

  state.productRef = raw;

  if (product) {
    // ─ Référence catalogue reconnue
    state.isKnownRef   = true;
    state.productName  = product.name;
    state.productPrice = product.price;

    DOM.referenceInput.classList.add('valid');
    DOM.referenceInput.classList.remove('invalid');
    DOM.refIcon.textContent = '✓';
    DOM.refIcon.style.color = 'var(--green)';
    DOM.refHint.textContent = `✓ Référence reconnue — ${product.name} · ${fmt.euro(product.price)}`;
    DOM.refHint.style.color = 'var(--green)';

    // Masquer le champ prix libre
    DOM.customPriceField.hidden = true;
    clearFieldError('prix_unitaire');

  } else if (raw.length >= 2) {
    // ─ Référence libre (non catalogue) → montrer champ prix
    state.isKnownRef   = false;
    state.productName  = raw;
    state.productPrice = parseFloat(DOM.prixInput?.value) || 0;

    DOM.referenceInput.classList.remove('valid', 'invalid');
    DOM.refIcon.textContent = '';
    DOM.refHint.textContent = 'Référence libre — veuillez indiquer le prix ci-dessous.';
    DOM.refHint.style.color = 'var(--gold)';

    // Afficher le champ prix libre
    DOM.customPriceField.hidden = false;

  } else {
    // ─ Champ vide ou trop court
    state.isKnownRef   = false;
    state.productName  = '';
    state.productPrice = 0;

    DOM.referenceInput.classList.remove('valid', 'invalid');
    DOM.refIcon.textContent = '';
    DOM.refHint.textContent = 'Saisissez la référence vue en live. Toute description est acceptée.';
    DOM.refHint.style.color = '';

    DOM.customPriceField.hidden = true;
  }

  clearFieldError('reference');
  render();
  updateProgress();
}

// Mise à jour prix si champ libre modifié
function handlePriceInput() {
  const val = parseFloat(DOM.prixInput.value);
  state.productPrice = (val > 0) ? val : 0;
  if (state.productPrice > 0) clearFieldError('prix_unitaire');
  render();
}

// ════════════════════════════════════════════════════════════════
// QUANTITÉ — Stepper +/−
// ════════════════════════════════════════════════════════════════
function setQuantity(qty) {
  const clamped       = Math.max(1, Math.min(99, qty));
  state.quantity      = clamped;
  DOM.quantiteInput.value = clamped;
  render();
}

DOM.qtyMinus.addEventListener('click', () => setQuantity(state.quantity - 1));
DOM.qtyPlus.addEventListener('click',  () => setQuantity(state.quantity + 1));
DOM.quantiteInput.addEventListener('change', () => {
  setQuantity(parseInt(DOM.quantiteInput.value, 10) || 1);
});

// ════════════════════════════════════════════════════════════════
// LIVRAISON — Sélection des modes
// ════════════════════════════════════════════════════════════════
DOM.shippingBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    DOM.shippingBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.shippingPrice = parseFloat(btn.dataset.shippingPrice) || 0;
    state.shippingLabel = btn.dataset.shippingLabel || CONFIG.shipping.default.label;
    render();
  });
});

// ════════════════════════════════════════════════════════════════
// PAIEMENT — Sélection du mode
// ════════════════════════════════════════════════════════════════
DOM.paymentBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    DOM.paymentBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.paymentMode = btn.dataset.paymentMode || 'stripe';
    render();
  });
});

// ════════════════════════════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════════════════════════════
const RULES = {
  reference: {
    test: v => v.trim().length >= 2,
    msg:  'Veuillez entrer la référence annoncée lors du live (2 caractères minimum).',
  },
  prix_unitaire: {
    // Actif uniquement si ref libre (non catalogue)
    test: v => state.isKnownRef || (parseFloat(v) > 0),
    msg:  'Veuillez indiquer le prix annoncé lors du live.',
  },
  prenom: {
    test: v => v.trim().length >= 2,
    msg:  'Prénom requis (2 caractères minimum).',
  },
  nom: {
    test: v => v.trim().length >= 2,
    msg:  'Nom requis (2 caractères minimum).',
  },
  email: {
    test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    msg:  'Adresse email invalide — vérifiez le format.',
  },
  telephone: {
    test: v => v.replace(/[\s\-\.\(\)\+]/g, '').length >= 8,
    msg:  'Numéro de téléphone invalide.',
  },
  adresse1: {
    test: v => v.trim().length >= 5,
    msg:  'Adresse de livraison requise.',
  },
  ville: {
    test: v => v.trim().length >= 2,
    msg:  'Ville requise.',
  },
  code_postal: {
    test: v => /^\d{4,6}$/.test(v.trim()),
    msg:  'Code postal invalide (4 à 6 chiffres).',
  },
};

function showFieldError(id, msg) {
  const errEl = document.getElementById(id + 'Error');
  const input  = document.getElementById(id);
  if (errEl) errEl.textContent = msg;
  if (input) { input.classList.add('invalid'); input.classList.remove('valid'); }
}

function clearFieldError(id) {
  const errEl = document.getElementById(id + 'Error');
  const input  = document.getElementById(id);
  if (errEl) errEl.textContent = '';
  if (input) input.classList.remove('invalid');
}

function markFieldValid(id) {
  const input = document.getElementById(id);
  if (input) { input.classList.add('valid'); input.classList.remove('invalid'); }
}

function validateAll() {
  let firstError = null;
  let allValid   = true;

  for (const [id, rule] of Object.entries(RULES)) {
    // Ignorer prix_unitaire si ref connue ou champ masqué
    if (id === 'prix_unitaire' && (state.isKnownRef || DOM.customPriceField.hidden)) continue;

    const input = document.getElementById(id);
    if (!input) continue;

    const value = input.value || '';
    if (!rule.test(value)) {
      showFieldError(id, rule.msg);
      if (!firstError) firstError = input;
      allValid = false;
    } else {
      clearFieldError(id);
      markFieldValid(id);
    }
  }

  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstError.focus({ preventScroll: true });
  }

  return allValid;
}

// Validation live au blur (ne punit pas pendant la frappe)
Object.keys(RULES).forEach(id => {
  const input = document.getElementById(id);
  if (!input) return;

  input.addEventListener('blur', () => {
    const value = input.value || '';
    if (!value.trim()) { clearFieldError(id); return; }

    if (id === 'prix_unitaire' && (state.isKnownRef || DOM.customPriceField.hidden)) return;

    if (!RULES[id].test(value)) {
      showFieldError(id, RULES[id].msg);
    } else {
      clearFieldError(id);
      if (id !== 'reference') markFieldValid(id);
    }
  });

  // Mise à jour de la progression à chaque saisie
  input.addEventListener('input', updateProgress);
});

// ════════════════════════════════════════════════════════════════
// SOUMISSION AJAX (Formspree)
// ════════════════════════════════════════════════════════════════
DOM.form.addEventListener('submit', async e => {
  e.preventDefault();

  if (!validateAll()) return;

  // ─ État chargement
  DOM.submitBtn.disabled = true;
  if (DOM.submitBtnText) DOM.submitBtnText.textContent = 'Envoi en cours…';
  DOM.progressBar.style.width = '100%';

  try {
    const formData = new FormData(DOM.form);

    const res = await fetch(CONFIG.formspreeEndpoint, {
      method:  'POST',
      body:    formData,
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      // ─ Succès
      DOM.form.hidden         = true;
      DOM.successState.hidden = false;
      DOM.successState.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Erreur serveur (${res.status})`);
    }
  } catch (err) {
    console.error('[LiveOrder] Erreur soumission:', err);

    // ─ Restauration bouton
    DOM.submitBtn.disabled = false;
    if (DOM.submitBtnText) DOM.submitBtnText.textContent = 'Valider ma commande';
    DOM.progressBar.style.width = '90%';

    // Alerte UX non intrusive
    const errorMsg = document.createElement('div');
    errorMsg.className = 'submit-error-msg';
    errorMsg.innerHTML = '⚠ Une erreur est survenue lors de l\'envoi. Vérifiez votre connexion et réessayez, ou contactez-nous directement.';
    errorMsg.style.cssText = `
      margin-top: 12px;
      padding: 12px 16px;
      background: var(--red-glow);
      border: 1px solid var(--red-border);
      border-radius: var(--r-sm);
      font-size: 0.82rem;
      color: var(--red);
      text-align: center;
    `;
    const existingErr = DOM.form.querySelector('.submit-error-msg');
    if (existingErr) existingErr.remove();
    DOM.submitBtn.parentNode.insertBefore(errorMsg, DOM.submitBtn.nextSibling);
    setTimeout(() => errorMsg.remove(), 8000);
  }
});

// ════════════════════════════════════════════════════════════════
// RÉINITIALISATION
// ════════════════════════════════════════════════════════════════
DOM.resetBtn.addEventListener('click', resetAll);

function resetAll() {
  // Reset formulaire HTML
  DOM.form.reset();
  DOM.form.hidden         = false;
  DOM.successState.hidden = true;

  // Reset bouton submit
  DOM.submitBtn.disabled = false;
  if (DOM.submitBtnText) DOM.submitBtnText.textContent = 'Valider ma commande';

  // Reset state
  state.productRef   = '';
  state.productName  = '';
  state.productPrice = 0;
  state.isKnownRef   = false;
  state.quantity     = 1;
  state.shippingPrice = CONFIG.shipping.default.price;
  state.shippingLabel = CONFIG.shipping.default.label;
  state.paymentMode   = 'stripe';

  // Reset UI sélections
  DOM.shippingBtns.forEach((btn, i) => btn.classList.toggle('active', i === 0));
  DOM.paymentBtns.forEach((btn, i)  => btn.classList.toggle('active', i === 0));

  // Reset champ prix libre
  DOM.customPriceField.hidden = true;
  if (DOM.prixInput) DOM.prixInput.value = '';
  if (DOM.refHint) {
    DOM.refHint.textContent = 'Saisissez la référence vue en live. Toute description est acceptée.';
    DOM.refHint.style.color = '';
  }

  // Reset icon ref
  DOM.refIcon.textContent = '';

  // Reset classes de validation
  document.querySelectorAll('.input').forEach(el => el.classList.remove('valid', 'invalid'));
  document.querySelectorAll('.field-error').forEach(el => (el.textContent = ''));
  document.querySelectorAll('.submit-error-msg').forEach(el => el.remove());

  // Reset quantité
  setQuantity(1);

  render();
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ════════════════════════════════════════════════════════════════
// SOCIAL PROOF — Compteurs animés
// ════════════════════════════════════════════════════════════════
function animateSocialProof() {
  const { baseOrders, baseViewers } = CONFIG.socialProof;

  // Compteur de commandes — incrémente lentement
  let orders = baseOrders;
  if (DOM.heroOrderCount) DOM.heroOrderCount.textContent = orders;
  setInterval(() => {
    if (Math.random() < 0.15) {
      orders += Math.floor(Math.random() * 3) + 1;
      if (DOM.heroOrderCount) DOM.heroOrderCount.textContent = orders;
    }
  }, 12000);

  // Compteur de viewers — fluctue naturellement
  let viewers = baseViewers + Math.floor(Math.random() * 30);
  if (DOM.liveViewers) DOM.liveViewers.textContent = viewers;
  setInterval(() => {
    const delta = Math.floor(Math.random() * 7) - 3;
    viewers = Math.max(80, viewers + delta);
    if (DOM.liveViewers) DOM.liveViewers.textContent = viewers;
  }, 7000);
}

// ════════════════════════════════════════════════════════════════
// LIENS STRIPE — Sync globale
// ════════════════════════════════════════════════════════════════
function syncStripeLinks() {
  DOM.stripeLinks.forEach(el => {
    if (el) el.href = CONFIG.stripeLink;
  });
}

// ════════════════════════════════════════════════════════════════
// MOBILE BOTTOM BAR — Scroll-aware CTA
// ════════════════════════════════════════════════════════════════
function initMobileBottomBar() {
  const bar = document.getElementById('mobileBottomBar');
  if (!bar) return;

  // Le bouton CTA scrolle jusqu'au formulaire ou soumet
  if (DOM.mbbCta) {
    DOM.mbbCta.addEventListener('click', e => {
      const formSection = document.getElementById('order-form');
      if (formSection) {
        e.preventDefault();
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

// ════════════════════════════════════════════════════════════════
// EVENT LISTENERS — Référence & Prix
// ════════════════════════════════════════════════════════════════
if (DOM.referenceInput) {
  DOM.referenceInput.addEventListener('input', handleReferenceInput);
}

if (DOM.prixInput) {
  DOM.prixInput.addEventListener('input', handlePriceInput);
  DOM.prixInput.addEventListener('blur', handlePriceInput);
}

// ════════════════════════════════════════════════════════════════
// INITIALISATION
// ════════════════════════════════════════════════════════════════
(function init() {
  syncStripeLinks();
  render();
  updateProgress();
  animateSocialProof();
  initMobileBottomBar();
})();
