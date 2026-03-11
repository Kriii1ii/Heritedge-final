const prisma = require('../config/prisma');

exports.getMarketplace = async (req, res, next) => {
    try {
        const { category, region, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;

        const currentPage = Math.max(1, parseInt(page) || 1);
        const pageSize = Math.max(1, parseInt(limit) || 12);
        const skip = (currentPage - 1) * pageSize;

        const filter = {
            status: 'PUBLISHED'
        };

        if (category) filter.category = category;
        if (region) filter.region = region;

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.gte = parseFloat(minPrice);
            if (maxPrice) filter.price.lte = parseFloat(maxPrice);
        }

        let orderBy = undefined;
        if (sort === 'newest') {
            orderBy = { createdAt: 'desc' };
        } else if (sort === 'price_asc') {
            orderBy = { price: 'asc' };
        } else if (sort === 'price_desc') {
            orderBy = { price: 'desc' };
        }

        const [artworks, totalCount] = await Promise.all([
            prisma.artwork.findMany({
                where: filter,
                orderBy: orderBy,
                skip: skip,
                take: pageSize,
                include: { creator: true }
            }),
            prisma.artwork.count({ where: filter })
        ]);

        const totalPages = Math.ceil(totalCount / pageSize);

        const enrichedArtworks = artworks.map(art => ({
            id: art.id,
            title: art.title,
            description: art.description,
            price: art.price,
            category: art.category,
            image: art.images[0] || '/images/placeholder.jpg',
            creatorName: art.creator.name,
            creatorId: art.creatorId
        }));

        let recommendedArtworks = [];
        if (req.session.user && req.session.user.role === 'BUYER') {
            const purchasedOrders = await prisma.order.findMany({
                where: { buyerId: req.session.user.id },
                include: { artwork: true }
            });
            const purchasedCategories = [...new Set(purchasedOrders.map(o => o.artwork.category))];

            if (purchasedCategories.length > 0) {
                recommendedArtworks = await prisma.artwork.findMany({
                    where: {
                        status: 'PUBLISHED',
                        category: { in: purchasedCategories },
                        id: { notIn: purchasedOrders.map(o => o.artworkId) }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 4,
                    include: { creator: true }
                });
            } else {
                recommendedArtworks = await prisma.artwork.findMany({
                    where: { status: 'PUBLISHED' },
                    orderBy: { createdAt: 'desc' },
                    take: 4,
                    include: { creator: true }
                });
            }
        }

        const enrichedRecommended = recommendedArtworks.map(art => ({
            id: art.id,
            title: art.title,
            description: art.description,
            price: art.price,
            category: art.category,
            image: art.images[0] || '/images/placeholder.jpg',
            creatorName: art.creator.name,
            creatorId: art.creatorId
        }));

        res.render('marketplace', {
            primaryColor: '#8b0000',
            artworks: enrichedArtworks,
            recommendedArtworks: enrichedRecommended,
            query: req.query,
            pagination: {
                totalCount,
                currentPage,
                totalPages,
                pageSize
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.getArtworkDetail = async (req, res, next) => {
    try {
        const artwork = await prisma.artwork.findUnique({
            where: { id: req.params.id },
            include: { creator: true }
        });

        if (!artwork || artwork.status !== 'PUBLISHED') {
            return res.status(404).render('error', {
                primaryColor: '#8b0000',
                message: 'Artwork not found or unavailable'
            });
        }

        res.render('artwork', {
            primaryColor: '#8b0000',
            artwork
        });
    } catch (err) {
        next(err);
    }
};

exports.getArtistPage = async (req, res, next) => {
    try {
        const artist = await prisma.user.findUnique({
            where: { id: req.params.id }
        });

        if (!artist || artist.role !== 'CREATOR') return res.status(404).send("Artist not found");

        const artworksDb = await prisma.artwork.findMany({
            where: { creatorId: artist.id, status: 'PUBLISHED' }
        });

        res.render('artist', {
            primaryColor: '#f2b90d',
            artist,
            artworks: artworksDb
        });
    } catch (err) {
        next(err);
    }
};
