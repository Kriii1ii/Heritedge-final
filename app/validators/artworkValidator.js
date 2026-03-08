const { z } = require('zod');

exports.artworkSchema = z.object({
    title: z.string().min(2, "Title is too short").max(255, "Title is too long"),
    description: z.string().max(2000, "Description is too long").optional(),
    price: z.preprocess((val) => Number(val), z.number().min(0.01, "Price must be greater than 0")),
    category: z.string().min(2, "Category is required"),
    region: z.string().min(2, "Region is required"),
    story: z.string().max(5000, "Story is too long").optional()
});
