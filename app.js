const CATALOG = [
  { code: 'QZ01', name: 'Quarter Zip Premium', description: 'Produit conversion-first pour live et Snap.', price: 39, stock: 8 },
  { code: 'DR02', name: 'Dyson Style Device', description: 'Référence visuelle hautement attractive.', price: 119, stock: 4 },
  { code: 'JB07', name: 'Speaker Drop Edition', description: 'Produit impulsif, parfait en déstockage.', price: 59, stock: 6 },
  { code: 'AL11', name: 'Cap Essential', description: 'Upsell facile et panier moyen boosté.', price: 24, stock: 13 }
];

const STORAGE_KEY = 'builder-os-orders-v1';
const DRAFT_KEY = 'builder-os-draft-v1';

const productGrid = document.getElementById('productGrid');
const template = document.getElementById('productCardTemplate');
const form = document.getElementById('orderForm');
const summary = document.getElementById('summary');
const relayResults = document.getElementById('relayResults');
const relayStatus = document.getElementById('relayStatus');

const refInput = document.getElementById('reference');
const shippingMethod = document.getElementById('shippingMethod');

function getOrders() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function getPriceByRef(ref) {
  return CATALOG.find(p => p.code.toLowerCase() === String(ref).toLowerCase())?.price || 0;
}

function seedCatalogue() {
  CATALOG.forEach((item) => {
    const node = template.content.cloneNode(true);
    node.querySelector('.product-code').textContent = item.code;
    node.querySelector('h4').textContent = item.name;
    node.querySelector('p').textContent = item.description;
    node.querySelector('.price').textContent = `${item.price} €`;
    node.querySelector('.stock').textContent = `${item.stock} pièces`;

    node.querySelector('button').addEventListener('click', () => {
      refInput.value = item.code;
      document.getElementById('quantity').value = 1;
      renderSummaryFromForm();
      window.location.hash = 'checkout';
    });

    productGrid.appendChild(node);
  });
}

function updateKpis() {
  const orders = getOrders();
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  document.getElementById('kpiOrders').textContent = orders.length;
  document.getElementById('kpiRevenue').textContent = `${revenue.toFixed(2)} €`;
}

function createOrderId() {
  return `CMD-${Date.now().toString().slice(-8)}`;
}

function renderSummary(order = null) {
  if (!order) {
    renderSummaryFromForm();
    return;
  }

  summary.classList.remove('empty');
  summary.innerHTML = `
    <div class="summary-card">
      <div class="summary-grid">
        <div><span>ID</span><strong>${order.id}</strong></div>
        <div><span>Référence</span><strong>${order.reference}</strong></div>
        <div><span>Client</span><strong>${order.customerName}</strong></div>
        <div><span>Total</span><strong>${order.total.toFixed(2)} €</strong></div>
        <div><span>Livraison</span><strong>${order.shippingMethod}</strong></div>
        <div><span>Statut</span><strong>${order.status}</strong></div>
        <div><span>Paiement</span><strong>${order.paymentStatus}</strong></div>
        <div><span>Relais</span><strong>${order.relayName || 'Non sélectionné'}</strong></div>
      </div>
    </div>
  `;
}

function renderSummaryFromForm() {
  const price = getPriceByRef(refInput.value);
  const qty = Number(document.getElementById('quantity').value || 1);
  const subtotal = price * qty;

  summary.classList.remove('empty');
  summary.innerHTML = `
    <div class="summary-card">
      <div class="summary-grid">
        <div><span>Référence</span><strong>${refInput.value || '—'}</strong></div>
        <div><span>Quantité</span><strong>${qty}</strong></div>
        <div><span>Prix unitaire</span><strong>${price.toFixed(2)} €</strong></div>
        <div><span>Total estimé</span><strong>${subtotal.toFixed(2)} €</strong></div>
        <div><span>Livraison</span><strong>${shippingMethod.value}</strong></div>
        <div><span>Mode</span><strong>${document.getElementById('mode').value}</strong></div>
      </div>
    </div>
  `;
}

function relayMock(postalCode) {
  const base = postalCode || '34000';
  return [
    { id: `MR-${base}-01`, name: 'Relais Centre Ville', address: `12 rue Centrale, ${base}`, hours: '09:00 - 19:00' },
    { id: `MR-${base}-02`, name: 'Locker Gare', address: `5 avenue de la Gare, ${base}`, hours: '24/7' },
    { id: `MR-${base}-03`, name: 'Point Commerce Express', address: `44 boulevard Marchand, ${base}`, hours: '10:00 - 20:00' }
  ];
}

function renderRelayOptions(relays) {
  relayResults.innerHTML = '';
  relayStatus.textContent = `${relays.length} points relais disponibles.`;

  relays.forEach((relay) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'relay-item';
    btn.innerHTML = `
      <strong>${relay.name}</strong>
      <div>${relay.address}</div>
      <div class="hint">${relay.hours}</div>
    `;

    btn.addEventListener('click', () => {
      document.querySelectorAll('.relay-item').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      relayResults.dataset.selectedRelayId = relay.id;
      relayResults.dataset.selectedRelayName = relay.name;
      relayResults.dataset.selectedRelayAddress = relay.address;
      renderSummaryFromForm();
    });

    relayResults.appendChild(btn);
  });
}

document.getElementById('findRelayBtn').addEventListener('click', async () => {
  const postalCode = document.getElementById('postalCode').value.trim();
  const city = document.getElementById('city').value.trim();
  relayStatus.textContent = 'Recherche en cours...';

  try {
    const res = await fetch(`/api/search-relays?postalCode=${encodeURIComponent(postalCode)}&city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('API indisponible');
    const data = await res.json();
    renderRelayOptions(data.relays || []);
  } catch (e) {
    renderRelayOptions(relayMock(postalCode));
    relayStatus.textContent = 'Mode fallback local actif.';
  }
});

form.addEventListener('input', renderSummaryFromForm);

shippingMethod.addEventListener('change', () => {
  const relayPanel = document.getElementById('relayPanel');
  relayPanel.style.display = shippingMethod.value === 'mondialrelay' ? 'block' : 'none';
  renderSummaryFromForm();
});

document.getElementById('saveDraftBtn').addEventListener('click', () => {
  const data = Object.fromEntries(new FormData(form).entries());
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  alert('Brouillon sauvegardé localement.');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());
  const unitPrice = getPriceByRef(data.reference);
  const quantity = Number(data.quantity || 1);
  const total = unitPrice * quantity;

  const order = {
    id: createOrderId(),
    createdAt: new Date().toISOString(),
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    reference: data.reference,
    quantity,
    mode: data.mode,
    shippingMethod: data.shippingMethod,
    address1: data.address1,
    address2: data.address2,
    postalCode: data.postalCode,
    city: data.city,
    notes: data.notes || '',
    relayId: relayResults.dataset.selectedRelayId || '',
    relayName: relayResults.dataset.selectedRelayName || '',
    relayAddress: relayResults.dataset.selectedRelayAddress || '',
    total,
    paymentStatus: 'pending',
    status: 'created',
    trackingNumber: '',
    labelUrl: ''
  };

  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
  localStorage.removeItem(DRAFT_KEY);

  updateKpis();
  renderSummary(order);

  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });

    if (res.ok) {
      const payload = await res.json();
      if (payload.url) {
        window.open(payload.url, '_blank');
      }
    }
  } catch (err) {
    console.warn('Checkout mock/fallback actif', err);
  }

  form.reset();
  relayResults.innerHTML = '';
  relayStatus.textContent = 'Commande créée. Paiement à finaliser.';
  relayResults.dataset.selectedRelayId = '';
  relayResults.dataset.selectedRelayName = '';
  relayResults.dataset.selectedRelayAddress = '';
  shippingMethod.dispatchEvent(new Event('change'));
});

function restoreDraft() {
  const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  if (!draft) return;

  Object.entries(draft).forEach(([key, value]) => {
    const field = document.querySelector(`[name="${key}"]`);
    if (field) field.value = value;
  });
}

seedCatalogue();
restoreDraft();
updateKpis();
renderSummaryFromForm();
shippingMethod.dispatchEvent(new Event('change'));
