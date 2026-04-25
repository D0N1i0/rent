// prisma/seed.ts
import { PrismaClient, Role, TransmissionType, FuelType, ExtraPricingType, BookingStatus, PaymentStatus, ContentBlockType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding AutoKos database...");

  // ─── ADMIN USER ──────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@autokos.com" },
    update: {},
    create: {
      email: "admin@autokos.com",
      passwordHash: adminPassword,
      firstName: "Arben",
      lastName: "Krasniqi",
      phone: "+383 44 123 456",
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // Demo customers
  const custPass = await bcrypt.hash("Customer@123", 12);
  await prisma.user.upsert({
    where: { email: "john.doe@example.com" },
    update: {},
    create: {
      email: "john.doe@example.com",
      passwordHash: custPass,
      firstName: "John",
      lastName: "Doe",
      phone: "+1 555 0100",
      nationality: "American",
      licenseNumber: "DL-9871234",
      role: Role.CUSTOMER,
    },
  });

  await prisma.user.upsert({
    where: { email: "besa.berisha@gmail.com" },
    update: {},
    create: {
      email: "besa.berisha@gmail.com",
      passwordHash: custPass,
      firstName: "Besa",
      lastName: "Berisha",
      phone: "+383 45 678 901",
      nationality: "Kosovar",
      licenseNumber: "KS-123456",
      role: Role.CUSTOMER,
    },
  });

  await prisma.user.upsert({
    where: { email: "muharrem.gashi@gmail.com" },
    update: {},
    create: {
      email: "muharrem.gashi@gmail.com",
      passwordHash: custPass,
      firstName: "Muharrem",
      lastName: "Gashi",
      phone: "+49 176 12345678",
      nationality: "German-Kosovar",
      licenseNumber: "DE-456789",
      role: Role.CUSTOMER,
    },
  });

  // ─── CAR CATEGORIES ───────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.carCategory.upsert({
      where: { slug: "economy" },
      update: {},
      create: { name: "Economy", slug: "economy", description: "Affordable and fuel-efficient cars perfect for city driving and short trips.", sortOrder: 1 },
    }),
    prisma.carCategory.upsert({
      where: { slug: "compact" },
      update: {},
      create: { name: "Compact", slug: "compact", description: "Comfortable compact cars ideal for families and business travelers.", sortOrder: 2 },
    }),
    prisma.carCategory.upsert({
      where: { slug: "sedan" },
      update: {},
      create: { name: "Sedan", slug: "sedan", description: "Elegant sedans offering style, comfort, and performance.", sortOrder: 3 },
    }),
    prisma.carCategory.upsert({
      where: { slug: "suv" },
      update: {},
      create: { name: "SUV", slug: "suv", description: "Versatile SUVs ready for city roads and mountain adventures across Kosovo.", sortOrder: 4 },
    }),
    prisma.carCategory.upsert({
      where: { slug: "premium" },
      update: {},
      create: { name: "Premium", slug: "premium", description: "Luxury vehicles for those who demand the very best in comfort and prestige.", sortOrder: 5 },
    }),
    prisma.carCategory.upsert({
      where: { slug: "family-van" },
      update: {},
      create: { name: "Family & Van", slug: "family-van", description: "Spacious vans and family vehicles for groups and long-distance travel.", sortOrder: 6 },
    }),
  ]);

  const [economy, compact, sedan, suv, premium, familyVan] = categories;

  // ─── CARS ─────────────────────────────────────────────────────────────────────
  const cars = [
    {
      slug: "volkswagen-polo-2023",
      name: "Volkswagen Polo",
      brand: "Volkswagen",
      model: "Polo",
      year: 2023,
      categoryId: economy.id,
      transmission: TransmissionType.MANUAL,
      fuelType: FuelType.PETROL,
      seats: 5,
      doors: 5,
      luggageSmall: 1,
      luggageLarge: 1,
      hasAC: true,
      hasBluetooth: true,
      hasGPS: false,
      hasUSB: true,
      mileageLimit: 300,
      extraKmFee: 0.15,
      fuelPolicy: "Full to Full",
      minAge: 21,
      licenseYears: 1,
      pricePerDay: 35,
      pricePerWeek: 210,
      pricePerMonth: 750,
      deposit: 150,
      isFeatured: true,
      shortDescription: "Reliable economy car, perfect for city drives in Prishtina.",
      description: "The Volkswagen Polo is our most popular economy choice. Fuel-efficient, easy to park in Prishtina's busy streets, and equipped with modern Bluetooth connectivity. Ideal for tourists and business travelers who want a reliable, cost-effective vehicle.",
      features: ["Bluetooth", "USB Charging", "Air Conditioning", "Central Locking", "Electric Windows"],
    },
    {
      slug: "toyota-yaris-2022",
      name: "Toyota Yaris",
      brand: "Toyota",
      model: "Yaris",
      year: 2022,
      categoryId: economy.id,
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.HYBRID,
      seats: 5,
      doors: 5,
      luggageSmall: 1,
      luggageLarge: 1,
      hasAC: true,
      hasBluetooth: true,
      hasGPS: false,
      hasUSB: true,
      mileageLimit: 300,
      extraKmFee: 0.15,
      fuelPolicy: "Full to Full",
      minAge: 21,
      licenseYears: 1,
      pricePerDay: 42,
      pricePerWeek: 252,
      pricePerMonth: 900,
      deposit: 150,
      isFeatured: false,
      shortDescription: "Eco-friendly hybrid, automatic transmission — smooth and efficient.",
      description: "The Toyota Yaris Hybrid offers the perfect blend of economy and environmental consciousness. With automatic transmission and hybrid technology, it delivers outstanding fuel efficiency while providing a smooth, effortless drive.",
      features: ["Hybrid Engine", "Automatic Transmission", "Bluetooth", "USB Charging", "Air Conditioning", "Backup Camera"],
    },
    {
      slug: "skoda-octavia-2023",
      name: "Škoda Octavia",
      brand: "Škoda",
      model: "Octavia",
      year: 2023,
      categoryId: compact.id,
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.DIESEL,
      seats: 5,
      doors: 5,
      luggageSmall: 2,
      luggageLarge: 2,
      hasAC: true,
      hasBluetooth: true,
      hasGPS: true,
      hasUSB: true,
      mileageLimit: null,
      extraKmFee: 0,
      fuelPolicy: "Full to Full",
      minAge: 21,
      licenseYears: 2,
      pricePerDay: 55,
      pricePerWeek: 330,
      pricePerMonth: 1200,
      deposit: 200,
      isFeatured: true,
      shortDescription: "Spacious compact with unlimited mileage — perfect for road trips.",
      description: "The Škoda Octavia is the sweet spot between space, comfort, and value. With its generous boot space, modern infotainment system, and diesel engine that sips fuel, it's the perfect companion for longer journeys across Kosovo and the wider Balkans.",
      features: ["Unlimited Mileage", "Built-in GPS", "Diesel Engine", "Bluetooth", "Cruise Control", "Parking Sensors", "Air Conditioning"],
    },
    {
      slug: "bmw-3-series-2023",
      name: "BMW 3 Series",
      brand: "BMW",
      model: "3 Series",
      year: 2023,
      categoryId: sedan.id,
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.DIESEL,
      seats: 5,
      doors: 4,
      luggageSmall: 1,
      luggageLarge: 2,
      hasAC: true,
      hasBluetooth: true,
      hasGPS: true,
      hasUSB: true,
      mileageLimit: 300,
      extraKmFee: 0.25,
      fuelPolicy: "Full to Full",
      minAge: 25,
      licenseYears: 3,
      pricePerDay: 89,
      pricePerWeek: 534,
      pricePerMonth: 1900,
      deposit: 400,
      isFeatured: true,
      shortDescription: "Ultimate driving machine for business and pleasure.",
      description: "Make an impression wherever you go with the BMW 3 Series. Whether it's an important business meeting or a pleasure trip through Kosovo's stunning landscapes, this executive sedan delivers the perfect balance of performance, luxury, and technology.",
      features: ["iDrive Navigation", "Heated Seats", "Sunroof", "Apple CarPlay / Android Auto", "Lane Departure Warning", "LED Headlights", "Keyless Entry"],
    },
    {
      slug: "toyota-rav4-2023",
      name: "Toyota RAV4",
      brand: "Toyota",
      model: "RAV4",
      year: 2023,
      categoryId: suv.id,
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.HYBRID,
      seats: 5,
      doors: 5,
      luggageSmall: 2,
      luggageLarge: 3,
      hasAC: true,
      hasBluetooth: true,
      hasGPS: true,
      hasUSB: true,
      mileageLimit: null,
      extraKmFee: 0,
      fuelPolicy: "Full to Full",
      minAge: 23,
      licenseYears: 2,
      pricePerDay: 79,
      pricePerWeek: 474,
      pricePerMonth: 1700,
      deposit: 350,
      isFeatured: true,
      shortDescription: "Hybrid SUV with AWD — from Prishtina streets to mountain roads.",
      description: "The Toyota RAV4 Hybrid is our best-selling SUV, and for good reason. With all-wheel drive and hybrid efficiency, it handles everything from Prishtina's urban streets to the scenic mountain roads of Kosovo with ease. Spacious, reliable, and tech-packed.",
      features: ["AWD", "Hybrid Engine", "Unlimited Mileage", "Panoramic Sunroof", "Wireless Charging", "Safety Sense 2.0", "8-inch Touchscreen", "Backup Camera"],
    },
    {
      slug: "mercedes-glc-2023",
      name: "Mercedes GLC",
      brand: "Mercedes-Benz",
      model: "GLC",
      year: 2023,
      categoryId: premium.id,
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.DIESEL,
      seats: 5,
      doors: 5,
      luggageSmall: 2,
      luggageLarge: 3,
      hasAC: true,
      hasBluetooth: true,
      hasGPS: true,
      hasUSB: true,
      mileageLimit: 250,
      extraKmFee: 0.35,
      fuelPolicy: "Full to Full",
      minAge: 25,
      licenseYears: 3,
      pricePerDay: 129,
      pricePerWeek: 774,
      pricePerMonth: 2800,
      deposit: 600,
      isFeatured: true,
      shortDescription: "Luxury premium SUV — arrive in style, every time.",
      description: "The Mercedes-Benz GLC represents the pinnacle of luxury SUV motoring. With its stunning interior, cutting-edge MBUX infotainment system, and commanding road presence, this vehicle is perfect for VIP transfers, weddings, and those special occasions when only the best will do.",
      features: ["MBUX Infotainment", "Leather Interior", "Panoramic Sunroof", "360° Camera", "Ambient Lighting", "Heated & Ventilated Seats", "Head-Up Display", "Burmester Sound System"],
    },
    {
      slug: "volkswagen-transporter-2022",
      name: "Volkswagen Transporter",
      brand: "Volkswagen",
      model: "Transporter T6.1",
      year: 2022,
      categoryId: familyVan.id,
      transmission: TransmissionType.MANUAL,
      fuelType: FuelType.DIESEL,
      seats: 9,
      doors: 5,
      luggageSmall: 5,
      luggageLarge: 5,
      hasAC: true,
      hasBluetooth: true,
      hasGPS: false,
      hasUSB: true,
      mileageLimit: 400,
      extraKmFee: 0.20,
      fuelPolicy: "Full to Full",
      minAge: 25,
      licenseYears: 3,
      pricePerDay: 95,
      pricePerWeek: 570,
      pricePerMonth: 2000,
      deposit: 400,
      isFeatured: false,
      shortDescription: "9-seat minibus — ideal for groups, families, and transfers.",
      description: "Our Volkswagen Transporter minibus is the ultimate group transport solution. With 9 comfortable seats and generous luggage space, it's perfect for airport transfers, family holidays, group tours, and corporate travel throughout Kosovo and the region.",
      features: ["9 Seats", "Large Luggage Space", "Diesel Engine", "Air Conditioning", "Bluetooth", "Dual Sliding Doors", "USB Charging"],
    },
    {
      slug: "hyundai-tucson-2023",
      name: "Hyundai Tucson",
      brand: "Hyundai",
      model: "Tucson",
      year: 2023,
      categoryId: suv.id,
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.PETROL,
      seats: 5,
      doors: 5,
      luggageSmall: 2,
      luggageLarge: 2,
      hasAC: true,
      hasBluetooth: true,
      hasGPS: true,
      hasUSB: true,
      mileageLimit: 300,
      extraKmFee: 0.18,
      fuelPolicy: "Full to Full",
      minAge: 22,
      licenseYears: 2,
      pricePerDay: 68,
      pricePerWeek: 408,
      pricePerMonth: 1500,
      deposit: 300,
      isFeatured: false,
      shortDescription: "Modern compact SUV with striking design and smart tech.",
      description: "The Hyundai Tucson combines bold design with practical versatility. Its panoramic sunroof, advanced safety features, and roomy interior make it an excellent choice for families and adventurers exploring Kosovo's diverse landscapes.",
      features: ["Panoramic Sunroof", "Apple CarPlay", "Blind Spot Monitor", "Lane Keep Assist", "Automatic Transmission", "Rear Camera", "Smart Cruise Control"],
    },
  ];

  const createdCars: any[] = [];
  for (const carData of cars) {
    const { features, ...rest } = carData;
    const car = await prisma.car.upsert({
      where: { slug: carData.slug },
      update: {},
      create: { ...rest, features },
    });
    createdCars.push(car);

    // Add placeholder image
    await prisma.carImage.deleteMany({ where: { carId: car.id } });
    await prisma.carImage.create({
      data: {
        carId: car.id,
        url: `/images/cars/${carData.slug}-1.jpg`,
        alt: `${carData.name} - AutoKos`,
        isPrimary: true,
        sortOrder: 1,
      },
    });
    await prisma.carImage.create({
      data: {
        carId: car.id,
        url: `/images/cars/${carData.slug}-2.jpg`,
        alt: `${carData.name} Interior - AutoKos`,
        isPrimary: false,
        sortOrder: 2,
      },
    });
  }

  // ─── LOCATIONS ────────────────────────────────────────────────────────────────
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { slug: "prishtina-airport" },
      update: {},
      create: {
        name: "Prishtina International Airport Adem Jashari",
        slug: "prishtina-airport",
        address: "Aeroporti Ndërkombëtar i Prishtinës, Fushë Kosovë",
        city: "Fushë Kosovë",
        isAirport: true,
        pickupFee: 15,
        dropoffFee: 15,
        isPickupPoint: true,
        isDropoffPoint: true,
        isActive: true,
        sortOrder: 1,
        description: "Direct delivery to the arrivals hall. Meet & greet service available.",
      },
    }),
    prisma.location.upsert({
      where: { slug: "prishtina-city-center" },
      update: {},
      create: {
        name: "Prishtina City Center",
        slug: "prishtina-city-center",
        address: "Rr. Nënë Tereza, Prishtinë",
        city: "Prishtina",
        isAirport: false,
        pickupFee: 0,
        dropoffFee: 0,
        isPickupPoint: true,
        isDropoffPoint: true,
        isActive: true,
        sortOrder: 2,
        description: "Main office in the heart of Prishtina. Free parking available.",
      },
    }),
    prisma.location.upsert({
      where: { slug: "gjilan" },
      update: {},
      create: {
        name: "Gjilan",
        slug: "gjilan",
        address: "Gjilan City Center",
        city: "Gjilan",
        isAirport: false,
        pickupFee: 25,
        dropoffFee: 25,
        isPickupPoint: true,
        isDropoffPoint: true,
        isActive: true,
        sortOrder: 3,
      },
    }),
    prisma.location.upsert({
      where: { slug: "prizren" },
      update: {},
      create: {
        name: "Prizren",
        slug: "prizren",
        address: "Prizren City Center",
        city: "Prizren",
        isAirport: false,
        pickupFee: 30,
        dropoffFee: 30,
        isPickupPoint: true,
        isDropoffPoint: true,
        isActive: true,
        sortOrder: 4,
      },
    }),
    prisma.location.upsert({
      where: { slug: "peje" },
      update: {},
      create: {
        name: "Pejë",
        slug: "peje",
        address: "Pejë City Center",
        city: "Pejë",
        isAirport: false,
        pickupFee: 30,
        dropoffFee: 30,
        isPickupPoint: true,
        isDropoffPoint: true,
        isActive: true,
        sortOrder: 5,
      },
    }),
    prisma.location.upsert({
      where: { slug: "ferizaj" },
      update: {},
      create: {
        name: "Ferizaj",
        slug: "ferizaj",
        address: "Ferizaj City Center",
        city: "Ferizaj",
        isAirport: false,
        pickupFee: 20,
        dropoffFee: 20,
        isPickupPoint: true,
        isDropoffPoint: true,
        isActive: true,
        sortOrder: 6,
      },
    }),
    prisma.location.upsert({
      where: { slug: "mitrovice" },
      update: {},
      create: {
        name: "Mitrovicë",
        slug: "mitrovice",
        address: "Mitrovicë City Center",
        city: "Mitrovicë",
        isAirport: false,
        pickupFee: 25,
        dropoffFee: 25,
        isPickupPoint: true,
        isDropoffPoint: true,
        isActive: true,
        sortOrder: 7,
      },
    }),
  ]);

  // ─── EXTRAS ───────────────────────────────────────────────────────────────────
  const extras = await Promise.all([
    prisma.extra.upsert({
      where: { id: "extra-gps" },
      update: {},
      create: {
        id: "extra-gps",
        name: "Portable GPS Navigator",
        description: "Standalone GPS device with up-to-date Balkans maps, including Kosovo.",
        pricingType: ExtraPricingType.PER_DAY,
        price: 5,
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.extra.upsert({
      where: { id: "extra-child-seat" },
      update: {},
      create: {
        id: "extra-child-seat",
        name: "Child Seat",
        description: "Certified child safety seat (0–36 kg). Please specify age/weight when booking.",
        pricingType: ExtraPricingType.PER_DAY,
        price: 7,
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.extra.upsert({
      where: { id: "extra-additional-driver" },
      update: {},
      create: {
        id: "extra-additional-driver",
        name: "Additional Driver",
        description: "Add a second authorized driver to your rental agreement.",
        pricingType: ExtraPricingType.PER_BOOKING,
        price: 25,
        isActive: true,
        sortOrder: 3,
      },
    }),
    prisma.extra.upsert({
      where: { id: "extra-full-insurance" },
      update: {},
      create: {
        id: "extra-full-insurance",
        name: "Full Coverage Insurance",
        description: "Zero-deductible comprehensive insurance. Complete peace of mind — no deposit on damage.",
        pricingType: ExtraPricingType.PER_DAY,
        price: 12,
        isActive: true,
        sortOrder: 4,
      },
    }),
    prisma.extra.upsert({
      where: { id: "extra-airport-meet" },
      update: {},
      create: {
        id: "extra-airport-meet",
        name: "Airport Meet & Greet",
        description: "Our driver will meet you in the arrivals hall with a name sign. Available 24/7.",
        pricingType: ExtraPricingType.ONE_TIME,
        price: 20,
        isActive: true,
        sortOrder: 5,
      },
    }),
    prisma.extra.upsert({
      where: { id: "extra-wifi" },
      update: {},
      create: {
        id: "extra-wifi",
        name: "Mobile WiFi Hotspot",
        description: "Stay connected across Kosovo and the region with our portable 4G WiFi device.",
        pricingType: ExtraPricingType.PER_DAY,
        price: 6,
        isActive: true,
        sortOrder: 6,
      },
    }),
  ]);

  // ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
  await prisma.testimonial.createMany({
    skipDuplicates: true,
    data: [
      { name: "James Wilson", location: "London, UK", rating: 5, content: "Outstanding service! The Toyota RAV4 was spotless and we were met right at the airport. We drove all across Kosovo — Pristina to Prizren, Peja, and back — without a single issue. Will definitely use AutoKos on our next visit.", isFeatured: true, sortOrder: 1 },
      { name: "Ana Müller", location: "Munich, Germany", rating: 5, content: "As a diaspora returning home every summer, AutoKos has become my go-to. The prices are transparent, the cars are always new and clean, and the team is incredibly helpful. Highly recommended!", isFeatured: true, sortOrder: 2 },
      { name: "Darko Stojanović", location: "Belgrade, Serbia", rating: 5, content: "Needed a car for a business trip to Prishtina. Booked the BMW 3 Series online, was picked up from the airport, and everything was perfectly professional. Great experience.", isFeatured: true, sortOrder: 3 },
      { name: "Sophie Leclerc", location: "Paris, France", rating: 4, content: "We rented the Škoda Octavia for a 10-day Kosovo road trip. The car was perfect, the price was fair, and when we had a small question, the team responded within minutes on WhatsApp. Really professional.", isFeatured: true, sortOrder: 4 },
      { name: "Blerta Morina", location: "Prishtina, Kosovo", rating: 5, content: "Kemi marrë me qira veturë nga AutoKos disa herë. Gjithmonë janë shumë profesionalë, çmimet janë transparente dhe vetura janë gjithmonë të pastra dhe në gjendje të shkëlqyer. Rekomandoj!", isFeatured: false, sortOrder: 5 },
      { name: "Thomas Berg", location: "Stockholm, Sweden", rating: 5, content: "Excellent company! The online booking system is very easy to use, the Mercedes GLC was immaculate, and the drop-off was effortless. Premium service at a fair price.", isFeatured: false, sortOrder: 6 },
    ],
  });

  // ─── FAQ ──────────────────────────────────────────────────────────────────────
  await prisma.faqItem.createMany({
    skipDuplicates: true,
    data: [
      { question: "What documents do I need to rent a car?", answer: "You will need: (1) A valid passport or national ID, (2) A valid driving licence held for at least 1 year, (3) A credit or debit card for the security deposit. Non-EU licences may require an International Driving Permit.", category: "requirements", sortOrder: 1 },
      { question: "What is the minimum age to rent a car?", answer: "The minimum age is 21 years for economy and compact cars, 23 for SUVs and larger vehicles, and 25 for premium and luxury vehicles. A young driver surcharge may apply for drivers under 25.", category: "requirements", sortOrder: 2 },
      { question: "How does the security deposit work?", answer: "A refundable security deposit (ranging from €150 to €600 depending on the vehicle) is held on your credit card at pickup. It is fully released within 5–7 business days after return, provided the car is returned in the same condition.", category: "payment", sortOrder: 3 },
      { question: "Can I pick up the car from Prishtina Airport?", answer: "Yes! Airport pickup and delivery is one of our most popular services. We offer direct airport collection from the arrivals hall. An airport service fee applies. You can also choose hotel or address delivery.", category: "pickup", sortOrder: 4 },
      { question: "Can I return the car to a different location?", answer: "Yes, one-way rentals are available between our service locations across Kosovo. A one-way fee may apply depending on the locations selected.", category: "pickup", sortOrder: 5 },
      { question: "Is insurance included in the rental price?", answer: "Basic third-party liability insurance is included in all rental prices. We also offer Collision Damage Waiver (CDW) and Full Coverage upgrades for complete peace of mind.", category: "insurance", sortOrder: 6 },
      { question: "What is the fuel policy?", answer: "All our vehicles operate on a Full-to-Full fuel policy. You receive the car with a full tank and must return it full. If you return the car with less fuel, a refuelling charge plus a service fee will apply.", category: "general", sortOrder: 7 },
      { question: "Can I cancel or modify my booking?", answer: "Free cancellation is available up to 48 hours before your pickup time. Cancellations within 48 hours may incur a fee. Booking modifications (date changes, upgrades) are available subject to availability.", category: "booking", sortOrder: 8 },
      { question: "Can I take the car outside Kosovo?", answer: "Cross-border travel is permitted to select neighbouring countries (Albania, North Macedonia, Montenegro) with prior written approval. Please inform us at the time of booking. Additional insurance may be required.", category: "general", sortOrder: 9 },
      { question: "Are there mileage limits?", answer: "Most vehicles include a generous daily mileage allowance (typically 300 km/day). Some vehicles offer unlimited mileage. Monthly rentals include unlimited mileage. Extra kilometres are charged at the rate shown in each car's listing.", category: "general", sortOrder: 10 },
    ],
  });

  // ─── OFFERS ───────────────────────────────────────────────────────────────────
  await prisma.offer.createMany({
    skipDuplicates: true,
    data: [
      {
        title: "Summer Explorer Deal",
        description: "Book for 7+ days this summer and save 15% on your entire rental. Perfect for the summer holidays!",
        code: "SUMMER15",
        discountPct: 15,
        minRentalDays: 7,
        validFrom: new Date("2025-06-01"),
        validUntil: new Date("2025-08-31"),
        isActive: true,
        sortOrder: 1,
      },
      {
        title: "Long-Term Discount — Monthly Rentals",
        description: "Renting for a month or more? Save 20% on all monthly rentals. Contact us for longer-term business solutions.",
        code: "MONTHLY20",
        discountPct: 20,
        minRentalDays: 30,
        isActive: true,
        sortOrder: 2,
      },
      {
        title: "Diaspora Welcome Home",
        description: "Welcome back to Kosovo! Show your diaspora ID or foreign passport and get a 10% discount on your first rental.",
        code: "DIASPORA10",
        discountPct: 10,
        isActive: true,
        sortOrder: 3,
      },
      {
        title: "Early Bird Booking",
        description: "Book at least 7 days in advance and get €10 off any rental. Planning ahead pays off!",
        code: "EARLYBIRD",
        discountAmt: 10,
        minSubtotal: 50,
        isActive: true,
        sortOrder: 4,
      },
    ],
  });

  // ─── LEGAL PAGES ──────────────────────────────────────────────────────────────
  await prisma.legalPage.upsert({
    where: { slug: "terms-and-conditions" },
    update: {},
    create: {
      slug: "terms-and-conditions",
      title: "Terms & Conditions",
      content: `# Terms and Conditions

**Last updated: January 2025**

## 1. Introduction

Welcome to AutoKos ("the Company", "we", "our", "us"). These Terms and Conditions govern your use of our vehicle rental services and website at autokos.com ("the Service"). By accessing or using our Service, you agree to be bound by these Terms.

## 2. Rental Agreement

By completing a booking, you enter into a legally binding rental agreement with AutoKos. The renter must be present at vehicle collection and present all required documents.

### 2.1 Required Documents
- Valid passport or Kosovo/EU national identity card
- Valid driving licence (held for minimum 1 year; 3 years for premium vehicles)
- Credit or debit card in the driver's name for the security deposit
- International Driving Permit (where applicable for non-EU licences)

### 2.2 Age Requirements
- Minimum age: 21 years for economy/compact vehicles
- Minimum age: 23 years for SUV and mid-size vehicles
- Minimum age: 25 years for premium and luxury vehicles
- Young driver surcharge applies for drivers aged 21–24

## 3. Vehicle Use

The rental vehicle must only be used by authorised drivers listed in the agreement. The vehicle must not be used for: illegal purposes, racing, off-road driving (unless the vehicle is authorised for this), transporting dangerous goods, or sub-renting.

## 4. Security Deposit

A security deposit (€150–€600 depending on vehicle category) will be pre-authorised on your credit card at pickup. This is not a charge — it is a hold. The hold is released within 5–7 business days after the vehicle is returned in satisfactory condition.

## 5. Insurance

Third-party liability insurance is included in all rentals as required by Kosovo law. Optional Collision Damage Waiver (CDW) and Full Coverage Insurance are available at additional cost. The renter is responsible for any damage not covered by the selected insurance option.

## 6. Fuel Policy

All vehicles are provided with a full fuel tank. The vehicle must be returned with a full tank. Failure to do so will result in a fuel charge at commercial rates plus a €15 administration fee.

## 7. Cancellation Policy

- Free cancellation: more than 48 hours before pickup
- 50% charge: cancellation within 24–48 hours of pickup
- Full charge: cancellation within 24 hours or no-show

## 8. Damage and Liability

Any damage to the vehicle must be reported immediately. The renter is responsible for damage occurring during the rental period, subject to the limits of the selected insurance coverage.

## 9. Governing Law

These Terms are governed by the laws of the Republic of Kosovo. Any disputes shall be subject to the exclusive jurisdiction of the courts of Prishtina, Kosovo.

## 10. Contact

AutoKos | Rr. Nënë Tereza, Prishtinë, Kosovo | Tel: +383 44 123 456 | Email: legal@autokos.com`,
    },
  });

  await prisma.legalPage.upsert({
    where: { slug: "privacy-policy" },
    update: {},
    create: {
      slug: "privacy-policy",
      title: "Privacy Policy",
      content: `# Privacy Policy

**Last updated: January 2025**

## 1. Introduction

AutoKos ("we", "our", "us") is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and protect your information when you use our services.

## 2. Data We Collect

We collect the following personal data:
- **Identity data**: Full name, date of birth, ID/passport number, driving licence number
- **Contact data**: Email address, phone number, postal address
- **Booking data**: Rental history, vehicle preferences, payment records
- **Technical data**: IP address, browser type, device information, cookies

## 3. How We Use Your Data

We use your personal data to:
- Process and manage your vehicle rental bookings
- Verify your identity and driving eligibility
- Process payments and security deposits
- Send booking confirmations and important updates
- Comply with our legal obligations
- Improve our services and website experience
- Send marketing communications (with your consent)

## 4. Legal Basis for Processing

We process your personal data based on:
- **Contract performance**: To fulfil your rental agreement
- **Legal obligation**: To comply with Kosovo law and regulations
- **Legitimate interests**: To improve our services and prevent fraud
- **Consent**: For marketing communications

## 5. Data Retention

We retain your personal data for:
- Active account data: Duration of your account plus 3 years
- Booking records: 7 years (for legal/tax purposes)
- Marketing data: Until you withdraw consent

## 6. Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data (subject to legal retention requirements)
- Object to processing
- Data portability

## 7. Cookies

We use cookies to improve your browsing experience. You can manage cookie preferences in your browser settings.

## 8. Contact

For privacy-related enquiries: privacy@autokos.com | AutoKos, Rr. Nënë Tereza, Prishtinë, Kosovo`,
    },
  });

  await prisma.legalPage.upsert({
    where: { slug: "rental-policy" },
    update: {},
    create: {
      slug: "rental-policy",
      title: "Rental Policy",
      content: `# Rental Policy

**AutoKos — Rental Requirements & Conditions**

## Driver Requirements

### Age & Licence
- Minimum age: 21 years
- Valid driving licence held for at least 1 year
- Premium vehicles require 3 years licence history and minimum age 25
- International Driving Permit required for non-EU/non-Kosovo licences

### Required Documents at Pickup
1. Valid passport or national identity card
2. Original driving licence (not a copy)
3. International Driving Permit (if applicable)
4. Credit or debit card in driver's name

## Fuel Policy
All vehicles use a **Full-to-Full** policy:
- Vehicle is collected with full tank
- Must be returned with full tank
- Failure to return full: fuel cost + €15 admin fee

## Mileage Policy
- Economy/Compact: 300 km/day included
- SUV/Premium: 250–300 km/day included
- Family Van: 400 km/day included
- Monthly rentals: Unlimited mileage
- Excess: €0.15–€0.35 per km depending on vehicle

## Security Deposit
| Vehicle Category | Deposit Amount |
|-----------------|---------------|
| Economy | €150 |
| Compact | €200 |
| Sedan | €300 |
| SUV | €350 |
| Premium | €400–€600 |
| Family Van | €400 |

Deposit is pre-authorised (not charged) and released within 5–7 business days after return.

## Cross-Border Policy
Cross-border travel to Albania, North Macedonia, and Montenegro is permitted with prior approval. Additional green card insurance required. Travel to other countries requires special written permission.

## Vehicle Care
- No smoking in any vehicle
- No pets unless prior approval obtained
- Vehicle must be returned in clean condition (exterior cleaning charge: €30 if excessively dirty)
- All damage must be reported immediately

## Late Return Policy
Late returns of more than 60 minutes incur an additional half-day charge. Please call us if you anticipate being late.`,
    },
  });

  // ─── SITE SETTINGS ────────────────────────────────────────────────────────────
  const settings = [
    { key: "business_name", value: "AutoKos", group: "business", label: "Business Name", type: "text" },
    { key: "business_tagline", value: "Premium Car Rental in Kosovo", group: "business", label: "Tagline", type: "text" },
    { key: "business_description", value: "Kosovo's most trusted car rental service. Premium fleet, transparent pricing, and exceptional service — from Prishtina Airport to every corner of Kosovo.", group: "business", label: "Description", type: "textarea" },
    { key: "contact_phone", value: "+383 49 181 884", group: "contact", label: "Phone Number", type: "text" },
    { key: "contact_phone_2", value: "+383 49 987 654", group: "contact", label: "Phone Number 2", type: "text" },
    { key: "contact_email", value: "info@autokos.com", group: "contact", label: "Email", type: "text" },
    { key: "contact_address", value: "Rr. Nënë Tereza, Nr. 45, Prishtinë 10000, Kosovo", group: "contact", label: "Address", type: "textarea" },
    { key: "whatsapp_number", value: "+38349181884", group: "contact", label: "WhatsApp Number", type: "text" },
    { key: "business_nipt", value: "", group: "business", label: "Business NIPT (Tax ID)", type: "text" },
    { key: "support_hours", value: "24/7 — We are always here for you", group: "contact", label: "Support Hours", type: "text" },
    { key: "logo_url", value: "/images/logo.png", group: "branding", label: "Logo URL", type: "image" },
    { key: "favicon_url", value: "/images/favicon.ico", group: "branding", label: "Favicon URL", type: "image" },
    { key: "primary_color", value: "#0F1E3C", group: "branding", label: "Primary Color", type: "text" },
    { key: "accent_color", value: "#E63B2E", group: "branding", label: "Accent Color", type: "text" },
    { key: "social_facebook", value: "https://facebook.com/autokos", group: "social", label: "Facebook URL", type: "url" },
    { key: "social_instagram", value: "https://instagram.com/autokos", group: "social", label: "Instagram URL", type: "url" },
    { key: "social_tiktok", value: "https://tiktok.com/@autokos", group: "social", label: "TikTok URL", type: "url" },
    { key: "social_youtube", value: "", group: "social", label: "YouTube URL", type: "url" },
    { key: "google_maps_embed", value: "https://maps.google.com/?q=Prishtina+Kosovo", group: "contact", label: "Google Maps Link", type: "url" },
    { key: "currency_symbol", value: "€", group: "business", label: "Currency Symbol", type: "text" },
    { key: "currency_code", value: "EUR", group: "business", label: "Currency Code", type: "text" },
    { key: "default_language", value: "en", group: "business", label: "Default Language", type: "text" },
    { key: "booking_advance_hours", value: "2", group: "booking", label: "Min Booking Advance (hours)", type: "text" },
    { key: "cancellation_free_hours", value: "48", group: "booking", label: "Free Cancellation (hours before)", type: "text" },
    { key: "hero_title_en", value: "Drive Kosovo in Style", group: "homepage", label: "Hero Title (English)", type: "text" },
    { key: "hero_subtitle_en", value: "Premium car rental from Prishtina Airport and across Kosovo. Transparent pricing, clean vehicles, exceptional service.", group: "homepage", label: "Hero Subtitle (English)", type: "textarea" },
    { key: "hero_title_sq", value: "Udhëto Kosovën me Stil", group: "homepage", label: "Hero Title (Albanian)", type: "text" },
    { key: "hero_subtitle_sq", value: "Marrje me qira veturash premium nga Aeroporti i Prishtinës dhe kudo në Kosovë. Çmime transparente, vetura të pastra, shërbim i shkëlqyer.", group: "homepage", label: "Hero Subtitle (Albanian)", type: "textarea" },
    { key: "footer_about", value: "AutoKos is Kosovo's premier car rental service, offering a modern fleet, transparent pricing, and 24/7 support. Based in Prishtina, serving all of Kosovo.", group: "footer", label: "Footer About Text", type: "textarea" },
    // Why Choose Us section
    { key: "why_title", value: "Why Choose AutoKos?", group: "homepage", label: "Why Choose Us — Title", type: "text" },
    { key: "why_subtitle", value: "We're not just a car rental service — we're your trusted partner for every journey across Kosovo.", group: "homepage", label: "Why Choose Us — Subtitle", type: "textarea" },
    { key: "why_1_title", value: "Fully Insured Fleet", group: "homepage", label: "Why #1 Title", type: "text" },
    { key: "why_1_body", value: "Every vehicle comes with comprehensive insurance. Drive with complete confidence and zero worries.", group: "homepage", label: "Why #1 Body", type: "textarea" },
    { key: "why_2_title", value: "24/7 Support", group: "homepage", label: "Why #2 Title", type: "text" },
    { key: "why_2_body", value: "Our team is always available by phone or WhatsApp — before, during, and after your rental.", group: "homepage", label: "Why #2 Body", type: "textarea" },
    { key: "why_3_title", value: "No Hidden Fees", group: "homepage", label: "Why #3 Title", type: "text" },
    { key: "why_3_body", value: "What you see is what you pay. Transparent pricing with full breakdown before you confirm.", group: "homepage", label: "Why #3 Body", type: "textarea" },
    { key: "why_4_title", value: "Airport Delivery", group: "homepage", label: "Why #4 Title", type: "text" },
    { key: "why_4_body", value: "We'll meet you at Prishtina Airport arrivals. No waiting, no stress — just pick up the keys and drive.", group: "homepage", label: "Why #4 Body", type: "textarea" },
    { key: "why_5_title", value: "Modern Fleet", group: "homepage", label: "Why #5 Title", type: "text" },
    { key: "why_5_body", value: "All our vehicles are regularly serviced and cleaned. Never more than 3 years old.", group: "homepage", label: "Why #5 Body", type: "textarea" },
    { key: "why_6_title", value: "Easy Booking", group: "homepage", label: "Why #6 Title", type: "text" },
    { key: "why_6_body", value: "Book online in under 3 minutes. Instant confirmation via email and WhatsApp.", group: "homepage", label: "Why #6 Body", type: "textarea" },
    // How It Works section
    { key: "how_title", value: "How It Works", group: "homepage", label: "How It Works — Title", type: "text" },
    { key: "how_subtitle", value: "Renting a car with AutoKos is simple, fast, and stress-free.", group: "homepage", label: "How It Works — Subtitle", type: "textarea" },
    { key: "how_1_title", value: "Choose Your Car", group: "homepage", label: "Step 1 Title", type: "text" },
    { key: "how_1_body", value: "Browse our fleet and filter by category, transmission, or dates. Find the perfect car for your trip.", group: "homepage", label: "Step 1 Body", type: "textarea" },
    { key: "how_2_title", value: "Book Online", group: "homepage", label: "Step 2 Title", type: "text" },
    { key: "how_2_body", value: "Select your pickup/drop-off location and dates. Complete the simple booking form in minutes.", group: "homepage", label: "Step 2 Body", type: "textarea" },
    { key: "how_3_title", value: "Pick Up Your Car", group: "homepage", label: "Step 3 Title", type: "text" },
    { key: "how_3_body", value: "Meet us at your chosen location — including Prishtina Airport. We'll hand you the keys and you're ready to go.", group: "homepage", label: "Step 3 Body", type: "textarea" },
    { key: "how_4_title", value: "Drive & Enjoy", group: "homepage", label: "Step 4 Title", type: "text" },
    { key: "how_4_body", value: "Explore Kosovo freely with full insurance and 24/7 support always available on WhatsApp or phone.", group: "homepage", label: "Step 4 Body", type: "textarea" },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // ─── SEO METADATA ─────────────────────────────────────────────────────────────
  const seoPages = [
    { page: "home", title: "AutoKos — Premium Car Rental in Kosovo | Prishtina Airport & City", description: "Rent a car in Kosovo with AutoKos. Best prices, newest fleet, airport pickup. Economy, SUV, Premium & Van rentals in Prishtina. Book online today.", keywords: "car rental Kosovo, rent a car Prishtina, car hire Kosovo airport, AutoKos" },
    { page: "fleet", title: "Our Fleet — Economy to Premium Cars | AutoKos Kosovo", description: "Browse our complete fleet of rental cars in Kosovo. Economy cars, SUVs, sedans, premium vehicles and vans. Daily, weekly and monthly rentals available.", keywords: "car rental fleet Kosovo, SUV rental Kosovo, economy car Kosovo" },
    { page: "about", title: "About AutoKos — Kosovo's Trusted Car Rental Company", description: "Learn about AutoKos, Kosovo's most trusted car rental company based in Prishtina. Our story, our commitment, and our team.", keywords: "AutoKos about, Kosovo car rental company, Prishtina car hire" },
    { page: "contact", title: "Contact AutoKos — Prishtina, Kosovo", description: "Get in touch with AutoKos. Visit us in Prishtina, call us, or message us on WhatsApp. We're available 24/7.", keywords: "AutoKos contact, car rental Kosovo contact, Prishtina car hire contact" },
    { page: "airport-rental", title: "Prishtina Airport Car Rental — AutoKos | Direct Arrivals Hall Pickup", description: "Rent a car at Prishtina International Airport Adem Jashari. Meet & greet service, direct arrivals hall pickup. Pre-book online.", keywords: "Prishtina airport car rental, Kosovo airport car hire, Adem Jashari airport rent a car" },
    { page: "long-term", title: "Monthly Car Rental Kosovo — Long-Term & Corporate Rentals | AutoKos", description: "Long-term car rentals in Kosovo starting from 30 days. Special monthly rates, unlimited mileage, full flexibility. Ideal for businesses and expats.", keywords: "monthly car rental Kosovo, long term car hire Kosovo, corporate car rental Prishtina" },
  ];

  for (const seo of seoPages) {
    await prisma.seoMetadata.upsert({
      where: { page: seo.page },
      update: {},
      create: seo,
    });
  }

  // ─── SAMPLE BOOKINGS ──────────────────────────────────────────────────────────
  const users = await prisma.user.findMany({ where: { role: Role.CUSTOMER } });
  const allCars = await prisma.car.findMany();
  const allLocations = await prisma.location.findMany();
  const airport = allLocations.find(l => l.isAirport)!;
  const cityCenter = allLocations.find(l => l.slug === "prishtina-city-center")!;

  const sampleBookings = [
    {
      bookingRef: "AK-2025-0001",
      userId: users[0]?.id,
      carId: allCars[0].id,
      pickupLocationId: airport.id,
      dropoffLocationId: cityCenter.id,
      pickupDateTime: new Date("2025-07-15T10:00:00"),
      dropoffDateTime: new Date("2025-07-22T10:00:00"),
      durationDays: 7,
      basePricePerDay: allCars[0].pricePerDay,
      subtotal: Number(allCars[0].pricePerDay) * 7,
      extrasTotal: 35,
      pickupFee: 15,
      dropoffFee: 0,
      discount: 0,
      depositAmount: allCars[0].deposit,
      totalAmount: Number(allCars[0].pricePerDay) * 7 + 35 + 15,
      pricingTier: "daily",
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      guestFirstName: "John",
      guestLastName: "Doe",
      guestEmail: "john.doe@example.com",
      guestPhone: "+1 555 0100",
    },
    {
      bookingRef: "AK-2025-0002",
      userId: users[1]?.id,
      carId: allCars[4].id,
      pickupLocationId: cityCenter.id,
      dropoffLocationId: cityCenter.id,
      pickupDateTime: new Date("2025-07-20T09:00:00"),
      dropoffDateTime: new Date("2025-07-27T09:00:00"),
      durationDays: 7,
      basePricePerDay: allCars[4].pricePerDay,
      subtotal: Number(allCars[4].pricePerDay) * 7,
      extrasTotal: 0,
      pickupFee: 0,
      dropoffFee: 0,
      discount: 0,
      depositAmount: allCars[4].deposit,
      totalAmount: Number(allCars[4].pricePerDay) * 7,
      pricingTier: "daily",
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      guestFirstName: "Besa",
      guestLastName: "Berisha",
      guestEmail: "besa.berisha@gmail.com",
      guestPhone: "+383 45 678 901",
    },
    {
      bookingRef: "AK-2025-0003",
      userId: users[2]?.id,
      carId: allCars[3].id,
      pickupLocationId: airport.id,
      dropoffLocationId: airport.id,
      pickupDateTime: new Date("2025-08-01T14:00:00"),
      dropoffDateTime: new Date("2025-08-14T14:00:00"),
      durationDays: 13,
      basePricePerDay: allCars[3].pricePerDay,
      subtotal: Number(allCars[3].pricePerDay) * 13,
      extrasTotal: 156,
      pickupFee: 15,
      dropoffFee: 15,
      discount: 0,
      depositAmount: allCars[3].deposit,
      totalAmount: Number(allCars[3].pricePerDay) * 13 + 156 + 30,
      pricingTier: "daily",
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      guestFirstName: "Muharrem",
      guestLastName: "Gashi",
      guestEmail: "muharrem.gashi@gmail.com",
      guestPhone: "+49 176 12345678",
    },
    {
      bookingRef: "AK-2025-0004",
      userId: null,
      carId: allCars[5].id,
      pickupLocationId: airport.id,
      dropoffLocationId: airport.id,
      pickupDateTime: new Date("2025-06-10T11:00:00"),
      dropoffDateTime: new Date("2025-06-17T11:00:00"),
      durationDays: 7,
      basePricePerDay: allCars[5].pricePerDay,
      subtotal: Number(allCars[5].pricePerDay) * 7,
      extrasTotal: 84,
      pickupFee: 15,
      dropoffFee: 15,
      discount: 0,
      depositAmount: allCars[5].deposit,
      totalAmount: Number(allCars[5].pricePerDay) * 7 + 84 + 30,
      pricingTier: "daily",
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      guestFirstName: "Sophie",
      guestLastName: "Leclerc",
      guestEmail: "sophie.leclerc@gmail.com",
      guestPhone: "+33 6 12 34 56 78",
    },
  ];

  for (const booking of sampleBookings) {
    await prisma.booking.upsert({
      where: { bookingRef: booking.bookingRef },
      update: {},
      create: booking,
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log("\n🔑 Admin credentials:");
  console.log("   Email: admin@autokos.com");
  console.log("   Password: Admin@123456");
  console.log("\n👤 Customer credentials:");
  console.log("   Email: john.doe@example.com");
  console.log("   Password: Customer@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// ─── PATCH: This content is appended to fix the seed for v2 schema ───────────
// The above code creates bookings without pricingTier (uses DB default "daily")
// and without BookingStatusHistory entries. This is fine for seeding.
// The BookingStatusHistory records are created by the booking API at runtime.
