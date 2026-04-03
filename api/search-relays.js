export default async function handler(req, res) {
  const { postalCode = '34000', city = 'Montpellier' } = req.query || {};

  // Brancher Mondial Relay réel ici avec vos identifiants techniques.
  // En attendant, structure mock compatible front.

  const relays = [
    {
      id: `MR-${postalCode}-01`,
      name: `Point Relais ${city} Centre`,
      address: `12 rue Centrale, ${postalCode} ${city}`,
      hours: '09:00 - 19:00'
    },
    {
      id: `MR-${postalCode}-02`,
      name: `Locker ${city} Gare`,
      address: `5 avenue de la Gare, ${postalCode} ${city}`,
      hours: '24/7'
    },
    {
      id: `MR-${postalCode}-03`,
      name: `Commerce Express ${city}`,
      address: `44 boulevard Marchand, ${postalCode} ${city}`,
      hours: '10:00 - 20:00'
    }
  ];

  return res.status(200).json({ relays });
}
