const fs = require('fs');
let content = fs.readFileSync('views/partials/header.ejs', 'utf-8');

// We simply rewrite the <nav> entirely to be safe
const newNav = `<nav class="hidden lg:flex flex-1 justify-center items-center gap-8 font-mono-header">
        <% const currentUser=locals.user || null; %>
        <a class="text-white hover:text-amber-yellow text-[17px] font-bold tracking-wide transition-colors" href="/">Home</a>
        <a class="text-white hover:text-amber-yellow text-[17px] font-bold tracking-wide transition-colors" href="/about">About Us</a>
        <a class="text-white hover:text-amber-yellow text-[17px] font-bold tracking-wide transition-colors" href="/marketplace">Art Marketplace</a>
        <a class="text-white hover:text-amber-yellow text-[17px] font-bold tracking-wide transition-colors" href="/events">Events</a>
        
        <% if (!currentUser) { %>
        <% } else if (currentUser.role==='BUYER' ) { %>
            <a class="text-white hover:text-amber-yellow text-[17px] font-bold tracking-wide transition-colors" href="/become-artist">Become an Artist</a>
            <a class="text-white hover:text-amber-yellow text-[17px] font-bold tracking-wide transition-colors" href="/profile">Profile</a>
        <% } else if (currentUser.role==='CREATOR' ) { %>
            <a class="text-white hover:text-amber-yellow text-[17px] font-bold tracking-wide transition-colors" href="/creator/home">Dashboard</a>
            <a class="text-white hover:text-amber-yellow text-[17px] font-bold tracking-wide transition-colors" href="/profile">Profile</a>
        <% } else if (currentUser.role==='ADMIN' ) { %>
            <a class="text-white hover:text-amber-yellow text-[17px] font-bold tracking-wide transition-colors" href="/admin">Admin Hub</a>
        <% } %>
    </nav>`;

content = content.replace(/<nav[\s\S]*?<\/nav>/, newNav);

const newMobileBaseNav = `<a class="text-white/90 hover:text-amber-yellow text-lg font-medium transition-colors" href="/">Home</a>
        <a class="text-white/90 hover:text-amber-yellow text-lg font-medium transition-colors" href="/about">About Us</a>
        <a class="text-white/90 hover:text-amber-yellow text-lg font-medium transition-colors" href="/marketplace">Art Marketplace</a>
        <a class="text-white/90 hover:text-amber-yellow text-lg font-medium transition-colors" href="/events">Events</a>`;

content = content.replace(/<a class="text-white\/90 hover:text-amber-yellow text-lg font-medium transition-colors" href="\/">Home<\/a>[\s\S]*?href="\/marketplace">Marketplace<\/a>/, newMobileBaseNav);
content = content.replace(/<a class="text-white\/90 hover:text-amber-yellow text-lg font-medium transition-colors"[\s\S]*?href="\/marketplace">Marketplace<\/a>/g, newMobileBaseNav);

fs.writeFileSync('views/partials/header.ejs', content);
