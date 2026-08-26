export const contactConfig = {
    phoneDisplay: '038 96 577 77',
    phoneUrl: 'tel:+261389657777',
    whatsappDisplay: '034 39 459 96',
    whatsappUrl: 'https://wa.me/261343945996',
    address: 'Talatamaty, Commune Amborimpotsy',
    city: 'Antananarivo, Madagascar',
    quoteMessage: 'Bonjour VITALUXE, je souhaite recevoir un devis professionnel.',
  } as const
  
  export const waQuoteUrl = `${contactConfig.whatsappUrl}?text=${encodeURIComponent(contactConfig.quoteMessage)}`
  