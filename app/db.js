const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data.json');

// Initialize if empty
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [], artworks: [], events: [], orders: [] }, null, 2));
}

function readData() {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeData(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    // Users
    async createUser(email, password, name, role) {
        const data = readData();
        if (data.users.find(u => u.email === email)) {
            throw new Error('User already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            email,
            password: hashedPassword,
            name,
            role, // 'creator', 'buyer', 'admin'
            story: '',
            avatar: ''
        };
        data.users.push(newUser);
        writeData(data);
        return newUser;
    },

    async authenticateUser(email, password) {
        const data = readData();
        const user = data.users.find(u => u.email === email);
        if (!user) return null;
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;
        return user;
    },

    getUserById(id) {
        return readData().users.find(u => u.id === id);
    },

    updateUserStory(id, story) {
        const data = readData();
        const user = data.users.find(u => u.id === id);
        if (user) {
            user.story = story;
            writeData(data);
        }
    },

    // Artworks
    getArtworks() {
        return readData().artworks;
    },

    getArtworksByArtist(artistId) {
        return readData().artworks.filter(a => a.artistId === artistId);
    },

    createArtwork(artistId, title, desc, price, category, image) {
        const data = readData();
        const newArt = {
            id: Date.now().toString(),
            artistId,
            title,
            desc,
            price: Number(price),
            category,
            image,
            createdAt: new Date().toISOString()
        };
        data.artworks.push(newArt);
        writeData(data);
        return newArt;
    }
};
