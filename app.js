// LIVEORDER — APP STRATEGIC VERSION

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("orderForm");
  const successState = document.getElementById("successState");

  const referenceInput = document.getElementById("reference");
  const priceInput = document.getElementById("prix_unitaire");
  const customPriceField = document.getElementById("customPriceField");

  const quantityInput = document.getElementById("quantite");
  const qtyPlus = document.getElementById("qtyPlus");
  const qtyMinus = document.getElementById("qtyMinus");

  const amountDisplay = document.getElementById("amountDisplay");
  const amountCard = document.getElementById("amountCard");

  const summaryAmount = document.getElementById("summaryAmount");
  const summaryTotal = document.getElementById("summaryTotal");

  const hiddenAmount = document.getElementById("hiddenAmount");
  const hiddenTotal = document.getElementById("hiddenTotal");

  const shippingCards = document.querySelectorAll(".shipping-card");

  let productPrice = 0;
  let shippingPrice = 6;

  // ─────────────────────────────
  // PRIX PRODUIT
  // ─────────────────────────────

  function updatePriceDisplay() {
    const qty = parseInt(quantityInput.value) || 1;
    const total = (productPrice * qty) + shippingPrice;

    if (productPrice > 0) {
      amountDisplay.textContent = productPrice.toFixed(2);
      amountCard.classList.add("has-value");
    } else {
      amountDisplay.textContent = "—";
      amountCard.classList.remove("has-value");
    }

    summaryAmount.textContent = productPrice > 0
      ? (productPrice * qty).toFixed(2) + " €"
      : "—";

    summaryTotal.textContent = total > 0
      ? total.toFixed(2) + " €"
      : "—";

    hiddenAmount.value = productPrice.toFixed(2);
    hiddenTotal.value = total.toFixed(2);
  }

  // ─────────────────────────────
  // RÉFÉRENCE → ACTIVE PRIX LIBRE
  // ─────────────────────────────

  referenceInput.addEventListener("input", () => {
    if (referenceInput.value.trim().length > 0) {
      customPriceField.hidden = false;
    } else {
      customPriceField.hidden = true;
      productPrice = 0;
      priceInput.value = "";
    }
    updatePriceDisplay();
  });

  // ─────────────────────────────
  // PRIX MANUEL
  // ─────────────────────────────

  priceInput.addEventListener("input", () => {
    productPrice = parseFloat(priceInput.value) || 0;
    updatePriceDisplay();
  });

  // ─────────────────────────────
  // QUANTITÉ
  // ─────────────────────────────

  qtyPlus.addEventListener("click", () => {
    quantityInput.value = parseInt(quantityInput.value) + 1;
    updatePriceDisplay();
  });

  qtyMinus.addEventListener("click", () => {
    if (quantityInput.value > 1) {
      quantityInput.value = parseInt(quantityInput.value) - 1;
      updatePriceDisplay();
    }
  });

  // ─────────────────────────────
  // LIVRAISON
  // ─────────────────────────────

  shippingCards.forEach(card => {
    card.addEventListener("click", () => {

      shippingCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");

      shippingPrice = parseFloat(card.dataset.shippingPrice);
      updatePriceDisplay();
    });
  });

  // ─────────────────────────────
  // VALIDATION FORMULAIRE
  // ─────────────────────────────

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!referenceInput.value.trim()) {
      alert("Veuillez entrer une référence produit.");
      return;
    }

    if (productPrice <= 0) {
      alert("Veuillez entrer un prix valide.");
      return;
    }

    // ENVOI FORM SPREE
    try {
      const data = new FormData(form);

      await fetch("https://formspree.io/f/TON_FORM_ID", {
        method: "POST",
        body: data,
        headers: {
          "Accept": "application/json"
        }
      });

      // UI SUCCESS
      form.style.display = "none";
      successState.hidden = false;

      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
      alert("Erreur lors de l'envoi. Réessayez.");
    }
  });

  // INIT
  updatePriceDisplay();

});
