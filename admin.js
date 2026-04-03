const STORAGE_KEY = 'builder-os-orders-v1';

function getOrders() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function currency(v) {
  return `${Number(v || 0).toFixed(2)} €`;
}

function badge(value, kind = 'neutral') {
  return `<span class="badge ${kind}">${value}</span>`;
}

function computeKpis(orders) {
  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const paid = orders.filter(o => o.paymentStatus === 'paid').length;

  document.getElementById('adminOrders').textContent = orders.length;
  document.getElementById('adminPaid').textContent = paid;
  document.getElementById('adminRevenue').textContent = currency(revenue);
}

function renderTable() {
  const tbody = document.getElementById('ordersTableBody');
  const orders = getOrders();

  computeKpis(orders);
  tbody.innerHTML = '';

  orders.forEach(order => {
    const tr = document.createElement('tr');
    const paymentKind = order.paymentStatus === 'paid' ? 'success' : 'pending';
    const shipping = order.relayName ? `${order.shippingMethod} • ${order.relayName}` : order.shippingMethod;

    tr.innerHTML = `
      <td>${order.id}</td>
      <td>
        <strong>${order.customerName}</strong><br />
        <span class="hint">${order.customerEmail}</span>
      </td>
      <td>${order.reference} × ${order.quantity}</td>
      <td>${currency(order.total)}</td>
      <td>${badge(order.paymentStatus, paymentKind)}</td>
      <td>${shipping}</td>
      <td>${order.trackingNumber || '—'}</td>
      <td>${badge(order.status, order.status === 'shipped' ? 'success' : 'neutral')}</td>
    `;

    tbody.appendChild(tr);
  });
}

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(getOrders(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'builder-orders.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('seedShipmentsBtn').addEventListener('click', () => {
  const orders = getOrders().map((order, i) => ({
    ...order,
    paymentStatus: order.paymentStatus === 'pending' ? 'paid' : order.paymentStatus,
    status: 'shipped',
    trackingNumber: order.trackingNumber || `TRK${Date.now().toString().slice(-6)}${i}`,
    labelUrl: order.labelUrl || `/labels/${order.id}.pdf`
  }));

  saveOrders(orders);
  renderTable();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Supprimer toutes les commandes locales ?')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderTable();
});

renderTable();
