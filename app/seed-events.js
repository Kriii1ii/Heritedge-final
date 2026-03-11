const prisma = require('./config/prisma');

async function seedEvents() {
    await prisma.event.createMany({
        data: [
            {
                name: "Mithila Art Workshop",
                description: "Celebrate the vibrant tapestry of Nepal through this immersive painting workshop.",
                location: "Patan Museum Square",
                eventDate: new Date("2023-10-24T10:00:00.000Z"),
                artists: ["Sunita Devi", "Ranjana Kumari"]
            },
            {
                name: "Indra Jatra Showcase",
                description: "Masked dancers and traditional music celebration.",
                location: "Kathmandu Durbar Square",
                eventDate: new Date("2023-10-28T14:00:00.000Z"),
                artists: ["Traditional Troupe A", "Musician B"]
            },
            {
                name: "Pottery Making Class",
                description: "Traditional Newari pottery wheel in action.",
                location: "Bhaktapur Pottery Square",
                eventDate: new Date("2023-11-02T11:00:00.000Z"),
                artists: ["Shyam Prajapati"]
            }
        ]
    });
    console.log("Events seeded successfully.");
    process.exit(0);
}

seedEvents().catch(console.error);
