const prisma = require('./config/prisma');
const bcrypt = require('bcryptjs');

async function main() {
    console.log('Seeding database...');

    // Clear existing
    await prisma.order.deleteMany({});
    await prisma.artwork.deleteMany({});
    await prisma.user.deleteMany({});

    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@heritedge.com',
            password: adminPassword,
            role: 'ADMIN',
        }
    });

    const creatorPassword = await bcrypt.hash('creator123', 10);
    const creator = await prisma.user.create({
        data: {
            name: 'Jane Doe',
            email: 'jane@artist.com',
            password: creatorPassword,
            role: 'CREATOR',
            bio: 'Contemporary digital artist exploring heritage.',
            region: 'Asia',
            verificationStatus: 'VERIFIED'
        }
    });

    await prisma.artwork.createMany({
        data: [
            {
                title: 'Neon Heritage',
                description: 'A fusion of cyberpunk and traditional motifs.',
                price: 150.00,
                category: 'Digital Painting',
                region: 'Asia',
                images: ['/images/placeholder.jpg'],
                status: 'PUBLISHED',
                creatorId: creator.id
            },
            {
                title: 'Desert Echoes',
                description: 'Abstract representation of ancestral lands.',
                price: 200.00,
                category: 'Abstract',
                region: 'Africa',
                images: ['/images/placeholder.jpg'],
                status: 'PUBLISHED',
                creatorId: creator.id
            },
            {
                title: 'Forest Whispers',
                description: 'Soundscapes rendered visually.',
                price: 75.50,
                category: 'Generative',
                region: 'Global',
                images: ['/images/placeholder.jpg'],
                status: 'PUBLISHED',
                creatorId: creator.id
            }
        ]
    });

    console.log('Database seeded perfectly!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
