import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hashPassword = (password: string) => bcrypt.hash(password, 10);

async function main() {
  console.log('Seeding database...');

  // 1. Admin
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@karigor.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@12345';
  const adminHash = await hashPassword(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      name: 'Karigor Admin',
      email: adminEmail,
      role: 'ADMIN',
      passwordHash: adminHash,
      status: 'ACTIVE',
    },
  });
  console.log(`Admin ready: ${admin.email}`);

  // 2. Categories
  const categoryNames = [
    'Plumbing',
    'Electrical',
    'Cleaning',
    'Painting',
    'Carpentry',
    'AC Repair',
  ];
  const categories: Record<string, string> = {};

  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, isActive: true },
    });
    categories[name] = cat.id;
  }
  console.log(`Created/verified ${categoryNames.length} categories`);

  // Common password
  const defaultPasswordHash = await hashPassword('Password@123');

  // 3. Customer
  const customerEmail = 'customer@karigor.com';
  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: 'Anis Customer',
      email: customerEmail,
      passwordHash: defaultPasswordHash,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      phone: '+8801700000001',
    },
  });
  console.log(`Customer ready: ${customer.email}`);

  // 4. Technicians
  const techniciansData = [
    {
      email: 'tech1@karigor.com',
      name: 'Rahim Electrician',
      phone: '+8801800000001',
      bio: 'Licensed electrician with 8 years of home & industrial electrical maintenance experience.',
      skills: ['Wiring', 'Circuit Breaker', 'Appliance Repair'],
      experienceYears: 8,
      location: 'Dhanmondi, Dhaka',
      hourlyRate: 40,
      services: [
        {
          title: 'Full House Wiring Inspection',
          description:
            'Comprehensive electrical inspection for residential properties.',
          price: 60,
          categoryName: 'Electrical',
        },
        {
          title: 'Circuit Breaker Installation',
          description:
            'Safe installation and testing of main and distribution breakers.',
          price: 45,
          categoryName: 'Electrical',
        },
      ],
    },
    {
      email: 'tech2@karigor.com',
      name: 'Karim Plumber',
      phone: '+8801800000002',
      bio: 'Certified master plumber specializing in pipe fittings, leak repairs and sanitary wares.',
      skills: ['Pipe Fitting', 'Drain Cleaning', 'Water Heater Repair'],
      experienceYears: 6,
      location: 'Gulshan, Dhaka',
      hourlyRate: 35,
      services: [
        {
          title: 'Emergency Pipe Leak Repair',
          description:
            'Rapid detection and fix for burst pipes and kitchen/bathroom leakages.',
          price: 50,
          categoryName: 'Plumbing',
        },
        {
          title: 'Water Heater Installation',
          description:
            'Installation and pressure testing for geysers and instant water heaters.',
          price: 75,
          categoryName: 'Plumbing',
        },
      ],
    },
    {
      email: 'tech3@karigor.com',
      name: 'Sabbir AC Expert',
      phone: '+8801800000003',
      bio: 'HVAC and air conditioner maintenance specialist for split, inverter and window AC units.',
      skills: ['AC Servicing', 'Gas Refill', 'Compressor Repair'],
      experienceYears: 5,
      location: 'Uttara, Dhaka',
      hourlyRate: 50,
      services: [
        {
          title: 'Master AC Servicing & Cleaning',
          description:
            'Deep foam cleaning of indoor & outdoor units with filter restoration.',
          price: 55,
          categoryName: 'AC Repair',
        },
        {
          title: 'AC Gas Refill & Leak Detection',
          description:
            'Precision nitrogen leak testing and R410A / R32 gas charging.',
          price: 70,
          categoryName: 'AC Repair',
        },
      ],
    },
  ];

  for (let idx = 0; idx < techniciansData.length; idx++) {
    const tData = techniciansData[idx];

    const techUser = await prisma.user.upsert({
      where: { email: tData.email },
      update: {
        name: tData.name,
        passwordHash: defaultPasswordHash,
        phone: tData.phone,
        status: 'ACTIVE',
      },
      create: {
        name: tData.name,
        email: tData.email,
        passwordHash: defaultPasswordHash,
        role: 'TECHNICIAN',
        status: 'ACTIVE',
        phone: tData.phone,
      },
    });

    const profile = await prisma.technicianProfile.upsert({
      where: { userId: techUser.id },
      update: {
        bio: tData.bio,
        skills: tData.skills,
        experienceYears: tData.experienceYears,
        location: tData.location,
        hourlyRate: new Prisma.Decimal(tData.hourlyRate),
      },
      create: {
        userId: techUser.id,
        bio: tData.bio,
        skills: tData.skills,
        experienceYears: tData.experienceYears,
        location: tData.location,
        hourlyRate: new Prisma.Decimal(tData.hourlyRate),
      },
    });

    for (const s of tData.services) {
      const catId = categories[s.categoryName];
      const existingService = await prisma.service.findFirst({
        where: { technicianId: profile.id, title: s.title },
      });
      if (existingService) {
        await prisma.service.update({
          where: { id: existingService.id },
          data: {
            price: new Prisma.Decimal(s.price),
            description: s.description,
            categoryId: catId,
          },
        });
      } else {
        await prisma.service.create({
          data: {
            technicianId: profile.id,
            categoryId: catId,
            title: s.title,
            description: s.description,
            price: new Prisma.Decimal(s.price),
          },
        });
      }
    }

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 1 + idx);

    for (let slotHour = 10; slotHour <= 14; slotHour += 2) {
      const start = new Date(baseDate);
      start.setHours(slotHour, 0, 0, 0);
      const end = new Date(start);
      end.setHours(slotHour + 2, 0, 0, 0);

      const existingSlot = await prisma.availabilitySlot.findFirst({
        where: { technicianId: profile.id, startTime: start },
      });

      if (!existingSlot) {
        await prisma.availabilitySlot.create({
          data: {
            technicianId: profile.id,
            startTime: start,
            endTime: end,
            isBooked: false,
          },
        });
      }
    }

    console.log(`Technician ready: ${tData.name} (${tData.email})`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
