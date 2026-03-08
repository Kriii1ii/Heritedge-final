require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const prisma = require('./config/prisma');
const path = require('path');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');
const routes = require('./routes/index');
const errorHandler = require('./middleware/error');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET || 'heritedge-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    },
    store: new PrismaSessionStore(
        prisma,
        {
            checkPeriod: 2 * 60 * 1000,
            dbRecordIdIsSessionId: true,
            dbRecordIdFunction: undefined
        }
    )
}));

const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use('/', routes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`HeritEdge platform running on http://localhost:${PORT}`);
    console.log(`HeritEdge platform running on http://localhost:${PORT}`);
});
