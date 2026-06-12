import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('Admin@2024!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@setifana.com' },
    update: {},
    create: {
      email: 'admin@setifana.com',
      passwordHash: adminPassword,
      fullName: 'Administrateur SETIFANA',
      phone: '+224 600 000 000',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('Admin created:', admin.email);

  const rooms = [
    {
      name: 'Chambre Standard',
      slug: 'chambre-standard',
      description: 'Notre chambre standard offre un confort optimal pour un séjour agréable à Conakry. Équipée d\'un lit double confortable, d\'une salle de bain privée moderne et de toutes les commodités essentielles, elle est idéale pour les voyageurs d\'affaires et les touristes.',
      shortDescription: 'Chambre confortable avec lit double et salle de bain privée',
      pricePerNight: 450000,
      capacity: 2,
      adultsCapacity: 2,
      childrenCapacity: 1,
      bedType: 'Double',
      sizeM2: 22,
      amenities: JSON.stringify(['wifi', 'air_conditioning', 'tv', 'safe', 'minibar']),
      status: 'AVAILABLE' as const,
      isFeatured: false,
    },
    {
      name: 'Chambre Supérieure',
      slug: 'chambre-superieure',
      description: 'La chambre supérieure de l\'Hotel SETIFANA vous offre un espace généreux avec une vue magnifique. Mobilier haut de gamme, literie premium et salle de bain en marbre. Un coin salon vous permet de vous détendre dans un cadre raffiné.',
      shortDescription: 'Chambre spacieuse avec vue, mobilier premium et coin salon',
      pricePerNight: 650000,
      capacity: 2,
      adultsCapacity: 2,
      childrenCapacity: 2,
      bedType: 'King',
      sizeM2: 32,
      amenities: JSON.stringify(['wifi', 'air_conditioning', 'tv', 'safe', 'minibar', 'balcony', 'room_service', 'breakfast']),
      status: 'AVAILABLE' as const,
      isFeatured: true,
    },
    {
      name: 'Suite Junior',
      slug: 'suite-junior',
      description: 'La Suite Junior est un havre de paix alliant élégance et fonctionnalité. Avec son salon séparé, sa chambre luxueuse et sa salle de bain spacieuse, elle est parfaite pour les séjours prolongés ou les occasions spéciales à Conakry.',
      shortDescription: 'Suite élégante avec salon séparé et vue panoramique',
      pricePerNight: 950000,
      capacity: 3,
      adultsCapacity: 2,
      childrenCapacity: 2,
      bedType: 'King',
      sizeM2: 45,
      amenities: JSON.stringify(['wifi', 'air_conditioning', 'tv', 'safe', 'minibar', 'balcony', 'room_service', 'breakfast', 'spa', 'laundry']),
      status: 'AVAILABLE' as const,
      isFeatured: true,
    },
    {
      name: 'Suite Présidentielle',
      slug: 'suite-presidentielle',
      description: 'Notre Suite Présidentielle incarne le summum du luxe à Conakry. Un vaste espace de vie avec salon, salle à manger privée, chambre royale, dressing et salle de bain en marbre avec jacuzzi. Service de majordome inclus pour une expérience inoubliable.',
      shortDescription: 'Le summum du luxe avec service majordome et jacuzzi privé',
      pricePerNight: 1800000,
      capacity: 4,
      adultsCapacity: 2,
      childrenCapacity: 2,
      bedType: 'King',
      sizeM2: 75,
      amenities: JSON.stringify(['wifi', 'air_conditioning', 'tv', 'safe', 'minibar', 'balcony', 'room_service', 'breakfast', 'spa', 'laundry', 'sea_view', 'restaurant']),
      status: 'AVAILABLE' as const,
      isFeatured: true,
    },
    {
      name: 'Chambre Familiale',
      slug: 'chambre-familiale',
      description: 'Conçue pour les familles, cette chambre spacieuse dispose de deux lits doubles, d\'un espace enfants aménagé et de tout le confort nécessaire pour un séjour en famille réussi. Connexion directe à la piscine et au restaurant.',
      shortDescription: 'Chambre spacieuse idéale pour les familles avec enfants',
      pricePerNight: 750000,
      capacity: 5,
      adultsCapacity: 2,
      childrenCapacity: 3,
      bedType: 'Twin Double',
      sizeM2: 40,
      amenities: JSON.stringify(['wifi', 'air_conditioning', 'tv', 'safe', 'minibar', 'room_service', 'breakfast', 'pool']),
      status: 'AVAILABLE' as const,
      isFeatured: false,
    },
    {
      name: 'Chambre Business',
      slug: 'chambre-business',
      description: 'La chambre Business est conçue pour le voyageur d\'affaires exigeant. Bureau ergonomique, connexion haut débit, éclairage de travail et accès prioritaire au centre de conférences. Petit-déjeuner business inclus.',
      shortDescription: 'Chambre optimisée pour les voyageurs d\'affaires',
      pricePerNight: 550000,
      capacity: 2,
      adultsCapacity: 2,
      childrenCapacity: 0,
      bedType: 'Queen',
      sizeM2: 28,
      amenities: JSON.stringify(['wifi', 'air_conditioning', 'tv', 'safe', 'minibar', 'room_service', 'breakfast', 'conference']),
      status: 'AVAILABLE' as const,
      isFeatured: false,
    },
  ];

  for (const room of rooms) {
    const created = await prisma.room.upsert({
      where: { slug: room.slug },
      update: {},
      create: room,
    });
    console.log('Room created:', created.name);

    await prisma.roomImage.createMany({
      data: [
        { roomId: created.id, imageUrl: `/images/rooms/${room.slug}-1.jpg`, altText: `${room.name} - Vue principale`, sortOrder: 0 },
        { roomId: created.id, imageUrl: `/images/rooms/${room.slug}-2.jpg`, altText: `${room.name} - Salle de bain`, sortOrder: 1 },
        { roomId: created.id, imageUrl: `/images/rooms/${room.slug}-3.jpg`, altText: `${room.name} - Vue détail`, sortOrder: 2 },
      ],
      skipDuplicates: true,
    });
  }

  const services = [
    { name: 'Restaurant Gastronomique', slug: 'restaurant', description: 'Savourez une cuisine internationale et des spécialités guinéennes préparées par notre chef étoilé. Petit-déjeuner buffet, déjeuner et dîner à la carte dans un cadre élégant.', icon: 'UtensilsCrossed', sortOrder: 1 },
    { name: 'Piscine', slug: 'piscine', description: 'Profitez de notre piscine extérieure chauffée avec pool bar. Transats, serviettes et service de boissons inclus pour un moment de détente parfait.', icon: 'Waves', sortOrder: 2 },
    { name: 'Salle de Conférence', slug: 'conference', description: 'Nos salles de conférence modernes accueillent vos réunions, séminaires et événements. Équipement audiovisuel, wifi haut débit et service traiteur disponibles.', icon: 'Presentation', sortOrder: 3 },
    { name: 'Spa & Bien-être', slug: 'spa', description: 'Offrez-vous un moment de détente dans notre spa. Massages, soins du visage et du corps, sauna et hammam pour une relaxation complète.', icon: 'Sparkles', sortOrder: 4 },
    { name: 'Navette Aéroport', slug: 'navette', description: 'Service de navette privée depuis et vers l\'aéroport international de Conakry. Réservation à l\'avance recommandée, disponible 24h/24.', icon: 'Bus', sortOrder: 5 },
    { name: 'Blanchisserie', slug: 'blanchisserie', description: 'Service de blanchisserie et pressing express. Vos vêtements sont traités avec soin et livrés dans votre chambre.', icon: 'WashingMachine', sortOrder: 6 },
    { name: 'Salle de Sport', slug: 'gym', description: 'Notre salle de sport entièrement équipée est accessible 24h/24. Machines cardio, poids libres et espace stretching.', icon: 'Dumbbell', sortOrder: 7 },
    { name: 'Excursions & Tourisme', slug: 'tourisme', description: 'Découvrez la Guinée avec nos excursions organisées. Îles de Loos, marché de Madina, musée national et bien plus encore.', icon: 'Mountain', sortOrder: 8 },
  ];

  for (const service of services) {
    await prisma.hotelService.upsert({
      where: { slug: service.slug },
      update: {},
      create: { ...service, isActive: true },
    });
    console.log('Service created:', service.name);
  }

  const reviews = [
    { customerName: 'Jean-Pierre Dupont', rating: 5, comment: 'Un hôtel exceptionnel à Conakry. Le personnel est d\'une gentillesse rare et les chambres sont magnifiques. Je recommande vivement !', isApproved: true },
    { customerName: 'Aminata Diallo', rating: 5, comment: 'Séjour parfait pour notre voyage d\'affaires. Le restaurant est excellent et la connexion wifi très rapide. Nous reviendrons !', isApproved: true },
    { customerName: 'Mohamed Camara', rating: 4, comment: 'Très bon hôtel, propre et bien situé. Le petit-déjeuner est varié et délicieux. Juste un petit bémol sur le parking.', isApproved: true },
    { customerName: 'Sophie Martin', rating: 5, comment: 'La suite présidentielle est absolument magnifique. Vue imprenable, jacuzzi, service impeccable. Un vrai luxe en Guinée !', isApproved: true },
    { customerName: 'Ibrahim Bah', rating: 4, comment: 'Excellent rapport qualité-prix. L\'hôtel est moderne, les chambres confortables. La piscine est un vrai plus.', isApproved: true },
  ];

  for (const review of reviews) {
    await prisma.review.create({ data: review });
  }
  console.log('Reviews created');

  const settings = [
    { key: 'hotel_name', value: 'Hotel SETIFANA', type: 'string', description: 'Nom de l\'hôtel' },
    { key: 'hotel_email', value: 'contact@setifana.com', type: 'string', description: 'Email de contact' },
    { key: 'hotel_phone', value: '+224 600 000 000', type: 'string', description: 'Téléphone' },
    { key: 'hotel_whatsapp', value: '+224 600 000 000', type: 'string', description: 'WhatsApp' },
    { key: 'hotel_address', value: 'Conakry, République de Guinée', type: 'string', description: 'Adresse' },
    { key: 'hotel_currency', value: 'GNF', type: 'string', description: 'Devise' },
    { key: 'hotel_tax_rate', value: '18', type: 'number', description: 'Taux de taxe (%)' },
    { key: 'stripe_enabled', value: 'true', type: 'boolean', description: 'Paiement Stripe activé' },
    { key: 'paypal_enabled', value: 'true', type: 'boolean', description: 'Paiement PayPal activé' },
    { key: 'mobile_money_enabled', value: 'true', type: 'boolean', description: 'Paiement Mobile Money activé' },
    { key: 'pay_at_hotel_enabled', value: 'true', type: 'boolean', description: 'Paiement à l\'hôtel activé' },
    { key: 'cancellation_hours', value: '48', type: 'number', description: 'Heures avant annulation gratuite' },
    { key: 'check_in_time', value: '14:00', type: 'string', description: 'Heure de check-in' },
    { key: 'check_out_time', value: '12:00', type: 'string', description: 'Heure de check-out' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('Settings created');

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
