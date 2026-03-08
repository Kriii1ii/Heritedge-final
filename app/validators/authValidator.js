const { z } = require('zod');

exports.registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address").toLowerCase(),
    password: z.string().min(6, "Password must be at least 6 characters").max(100),
    confirm_password: z.string().min(6, "Confirm Password must be at least 6 characters").max(100),
    role: z.enum(['buyer', 'creator'], {
        errorMap: () => ({ message: "Role must be 'buyer' or 'creator'" })
    })
}).refine(data => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"]
});

exports.loginSchema = z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
    password: z.string().min(1, "Password is required")
});
