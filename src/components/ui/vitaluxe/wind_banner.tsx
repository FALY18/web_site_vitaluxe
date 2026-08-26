const items = [
  { number: '01', title: 'Prix professionnels', text: 'Tarifs gros volumes adaptés aux professionnels du bâtiment.' },
  { number: '02', title: 'Livraison sur demande', text: 'Livraison organisée selon vos délais et votre commande.' },
  { number: '03', title: 'Vitrage & Miroiterie', text: 'Gamme complète de vitrages et miroirs pour tous projets.' },
  { number: '04', title: 'Profilés aluminium', text: 'Profilés de précision pour menuiseries et façades.' },
  { number: '05', title: 'Stock disponible', text: 'Produits en stock permanent à Talatamaty.' },
  { number: '06', title: 'Conseil terrain', text: 'Notre équipe vous guide dans le choix des matériaux.' },
]

export function WindBanner() {
  return (
    <div className="wb-section">
      <div className="wb-grid">
        {items.map((item, i) => (
          <div
            key={item.number}
            className="wb-item"
            style={{ animationDelay: `${i * 0.55}s` }}
          >
            <span className="wb-num">{item.number}</span>
            <strong className="wb-title">{item.title}</strong>
            <p className="wb-text">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
