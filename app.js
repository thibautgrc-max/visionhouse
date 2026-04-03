const CONFIG = {
  products: {
    QZ01: 39,
    DR02: 119,
    JB07: 59,
    AL11: 24
  },
  defaultShippingPrice: 6.00,
  defaultShippingLabel: 'Relais Standard'
};

const amountDisplay = document.getElementById('amountDisplay');
const summaryAmount = document.getElementById('summaryAmount');
const summaryShipping = document.getElementById('summaryShipping');
const summaryTotal = document.getElementById('summaryTotal');
const hiddenAmount = document.getElementById('hiddenAmount');
const hiddenShipping = document.getElementById('hiddenShipping');
const hiddenTotal = document.getElementById('hiddenTotal');
const hiddenShippingLabel = document.getElementById('hiddenShippingLabel');
const hiddenPaymentMode = document.getElementById('hiddenPaymentMode');
const referenceInput = document.getElementById('reference');
const shippingButtons = document.querySelectorAll('[data-shipping-price]');
const paymentButtons = document.querySelectorAll('[data-payment-mode]');
const resetAllBtn = document.getElementById('resetAllBtn');
const form = document.getElementById('orderForm');

let shippingPrice = CONFIG.defaultShippingPrice;
let shippingLabel = CONFIG.defaultShippingLabel;
let paymentMode = 'stripe';

function euro(value){
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function getAmountFromReference(){
  const ref = (referenceInput.value || '').trim().toUpperCase();
  return CONFIG.products[ref] || 0;
}

function updateView(){
  const amount = getAmountFromReference();
  const total = amount + shippingPrice;

  amountDisplay.textContent = amount.toFixed(0);
  summaryAmount.textContent = euro(amount);
  summaryShipping.textContent = euro(shippingPrice);
  summaryTotal.textContent = euro(total);

  hiddenAmount.value = amount.toFixed(2);
  hiddenShipping.value = shippingPrice.toFixed(2);
  hiddenTotal.value = total.toFixed(2);
  hiddenShippingLabel.value = shippingLabel;
  hiddenPaymentMode.value = paymentMode;

  referenceInput.classList.toggle('invalid', amount === 0 && referenceInput.value.trim() !== '');
}

referenceInput.addEventListener('input', updateView);

shippingButtons.forEach((button) => {
  button.addEventListener('click', () => {
    shippingButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    shippingPrice = parseFloat(button.dataset.shippingPrice || '0');
    shippingLabel = button.dataset.shippingLabel || CONFIG.defaultShippingLabel;
    updateView();
  });
});

paymentButtons.forEach((button) => {
  button.addEventListener('click', () => {
    paymentButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    paymentMode = button.dataset.paymentMode || 'stripe';
    updateView();
  });
});

resetAllBtn.addEventListener('click', () => {
  form.reset();
  shippingPrice = CONFIG.defaultShippingPrice;
  shippingLabel = CONFIG.defaultShippingLabel;
  paymentMode = 'stripe';

  shippingButtons.forEach((btn, index) => btn.classList.toggle('active', index === 0));
  paymentButtons.forEach((btn, index) => btn.classList.toggle('active', index === 0));

  referenceInput.classList.remove('invalid');
  updateView();
});

updateView();
