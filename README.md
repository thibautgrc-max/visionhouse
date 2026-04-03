# LiveOrder Pro

Landing premium pour live shopping, pensée pour GitHub + Vercel.

## Stack
- HTML
- CSS
- JavaScript
- Formspree pour recevoir les commandes par email
- Stripe Payment Link pour le paiement

## Déploiement
1. Uploade les fichiers dans un repo GitHub.
2. Importe le repo dans Vercel.
3. Déploie.
4. Remplace dans `index.html` :
   - `TON_FORM_ID`
   - `TON_LIEN_STRIPE`

## Références demo
- QZ01 → 39 €
- DR02 → 119 €
- JB07 → 59 €
- AL11 → 24 €

## Personnalisation rapide
- le logo : `.brand-logo`
- le nom affiché : `LiveOrder Pro`
- les tarifs produits : `CONFIG.products` dans `app.js`
- les modes de livraison : cartes avec `data-shipping-price`
