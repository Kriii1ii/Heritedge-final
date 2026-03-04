const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const db = require('./db');

const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});
const upload = multer({ storage });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'heritedge-secret',
    resave: false,
    saveUninitialized: true
}));

// Route Middlewares
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.render('index', { primaryColor: '#f2b90d' });
});

app.get('/auth', (req, res) => {
    res.render('auth', {
        primaryColor: '#d42511',
        error: req.query.error === 'exists' ? 'Email already in use.' : (req.query.error === 'invalid' ? 'Invalid credentials' : null)
    });
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.authenticateUser(email, password);
    if (!user) return res.redirect('/auth?error=invalid');
    req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    res.redirect('/home');
});

app.post('/auth/signup', async (req, res) => {
    const { email, password, name, role } = req.body;
    try {
        const user = await db.createUser(email, password, name, role);
        req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role };
        res.redirect('/home');
    } catch (err) {
        res.redirect('/auth?error=exists');
    }
});

app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


app.get('/home', (req, res) => {
    if (!req.session.user) return res.redirect('/auth');
    const user = db.getUserById(req.session.user.id);
    const myArtworks = db.getArtworksByArtist(user.id);

    // Serve dashboard based on role implicitly context
    res.render('dashboard', {
        primaryColor: '#b81430',
        activeUser: user,
        artworks: myArtworks
    });
});

app.get('/marketplace', (req, res) => {
    const allArtworks = db.getArtworks();
    // Get artist name for each artwork
    const enrichedArtworks = allArtworks.map(art => {
        const artist = db.getUserById(art.artistId);
        return { ...art, artistName: artist ? artist.name : 'Unknown Artist' };
    });

    res.render('marketplace', {
        primaryColor: '#8b0000',
        artworks: enrichedArtworks
    });
});

app.get('/artist/:id', (req, res) => {
    const artist = db.getUserById(req.params.id);
    if (!artist || artist.role !== 'creator') return res.status(404).send("Artist not found");
    const artworks = db.getArtworksByArtist(artist.id);

    res.render('artist', {
        primaryColor: '#f2b90d',
        artist,
        artworks
    });
});

app.post('/api/story', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'creator') return res.status(403).send("Unauthorized");
    db.updateUserStory(req.session.user.id, req.body.story);
    res.redirect('/home');
});

app.post('/api/artwork', upload.single('image'), (req, res) => {
    if (!req.session.user || req.session.user.role !== 'creator') return res.status(403).send("Unauthorized");
    const { title, desc, price, category } = req.body;
    const imagePath = req.file ? '/uploads/' + req.file.filename : '/images/placeholder.jpg';
    db.createArtwork(req.session.user.id, title, desc, price, category, imagePath);
    res.redirect('/home');
});

app.get('/events', (req, res) => {
    res.render('events', { primaryColor: '#eead2b' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`HeritEdge platform running on http://localhost:${PORT}`);
});
