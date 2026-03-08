const { z } = require('zod');

exports.orderSchema = z.object({
    artworkId: z.string().uuid("Invalid artwork ID format")
});
