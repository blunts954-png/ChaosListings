import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ===== SEED DIRECTORIES =====
  console.log('📂 Seeding directories...');

  const directories = [
    { name: 'Google Business Profile', slug: 'google_business', type: 'engine_managed', yextPublisherId: 'GOOGLEMYBUSINESS', priority: 100, logoUrl: 'https://www.google.com/favicon.ico' },
    { name: 'Yelp', slug: 'yelp', type: 'engine_managed', yextPublisherId: 'YELP', priority: 90, logoUrl: 'https://s3-media0.fl.yelpcdn.com/assets/srv0/yelp_favicon/5f5afc80e8e8/favicon.ico' },
    { name: 'Facebook', slug: 'facebook', type: 'engine_managed', yextPublisherId: 'FACEBOOKPAGES', priority: 85, logoUrl: 'https://www.facebook.com/favicon.ico' },
    { name: 'Bing Places', slug: 'bing_places', type: 'engine_managed', yextPublisherId: 'BING', priority: 75, logoUrl: 'https://www.bing.com/favicon.ico' },
    { name: 'Apple Maps', slug: 'apple_maps', type: 'engine_managed', yextPublisherId: 'APPLEMAPS', priority: 80, logoUrl: 'https://www.apple.com/favicon.ico' },
    { name: 'Yahoo', slug: 'yahoo', type: 'engine_managed', yextPublisherId: 'YAHOO', priority: 60, logoUrl: 'https://www.yahoo.com/favicon.ico' },
    { name: 'YP.com', slug: 'yp', type: 'engine_managed', yextPublisherId: 'YP', priority: 50, logoUrl: 'https://www.yp.com/favicon.ico' },
    { name: 'Foursquare', slug: 'foursquare', type: 'engine_managed', yextPublisherId: 'FOURSQUARE', priority: 55, logoUrl: 'https://foursquare.com/favicon.ico' },
    { name: 'MapQuest', slug: 'mapquest', type: 'engine_managed', yextPublisherId: 'MAPQUEST', priority: 45, logoUrl: 'https://www.mapquest.com/favicon.ico' },
    { name: 'Angi', slug: 'angi', type: 'engine_managed', yextPublisherId: 'ANGIESLIST', priority: 70, logoUrl: 'https://www.angi.com/favicon.ico' },
    { name: 'HomeAdvisor', slug: 'homeadvisor', type: 'engine_managed', yextPublisherId: 'HOMEADVISOR', priority: 65, logoUrl: 'https://www.homeadvisor.com/favicon.ico' },
    { name: 'Nextdoor', slug: 'nextdoor', type: 'engine_managed', yextPublisherId: 'NEXTDOOR', priority: 60, logoUrl: 'https://nextdoor.com/favicon.ico' },
    { name: 'BBB', slug: 'bbb', type: 'engine_managed', yextPublisherId: 'BBB', priority: 55, logoUrl: 'https://www.bbb.org/favicon.ico' },
    { name: 'Superpages', slug: 'superpages', type: 'engine_managed', yextPublisherId: 'SUPERPAGES', priority: 40, logoUrl: 'https://www.superpages.com/favicon.ico' },
    { name: 'Citysearch', slug: 'citysearch', type: 'engine_managed', yextPublisherId: 'CITYSEARCH', priority: 35, logoUrl: 'https://www.citysearch.com/favicon.ico' },
  ];

  for (const dir of directories) {
    await prisma.directory.upsert({
      where: { slug: dir.slug },
      update: dir,
      create: dir,
    });
  }

  console.log(`✅ Created ${directories.length} directories\n`);

  // ===== CREATE MASTER ACCOUNT =====
  console.log('👤 Creating master account...');

  // Create master agency
  const masterAgency = await prisma.agency.upsert({
    where: { slug: 'chaoslistings-master' },
    update: {},
    create: {
      name: 'ChaosListings Master',
      slug: 'chaoslistings-master',
      email: 'admin@chaoslistings.com',
      plan: 'enterprise',
      status: 'active',
    },
  });

  console.log(`✅ Created agency: ${masterAgency.name} (${masterAgency.slug})`);

  // Create master user
  const passwordHash = await bcrypt.hash('MasterPass123!', 10);

  const masterUser = await prisma.user.upsert({
    where: { email: 'admin@chaoslistings.com' },
    update: {
      passwordHash,
      status: 'active',
      emailVerified: true,
    },
    create: {
      email: 'admin@chaoslistings.com',
      passwordHash,
      firstName: 'Master',
      lastName: 'Admin',
      status: 'active',
      emailVerified: true,
    },
  });

  console.log(`✅ Created user: ${masterUser.email}`);

  // Create membership
  await prisma.agencyMembership.upsert({
    where: {
      agencyId_userId: {
        agencyId: masterAgency.id,
        userId: masterUser.id,
      },
    },
    update: {},
    create: {
      agencyId: masterAgency.id,
      userId: masterUser.id,
      role: 'owner',
      permissions: ['*'],
      status: 'active',
    },
  });

  console.log(`✅ Created agency membership\n`);

  // ===== SUMMARY =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 DATABASE SEEDED SUCCESSFULLY!\n');
  console.log('📧 Email:    admin@chaoslistings.com');
  console.log('🔑 Password: MasterPass123!');
  console.log('🏢 Agency:   ChaosListings Master');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('👉 Use these credentials to login at http://localhost:3001\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
