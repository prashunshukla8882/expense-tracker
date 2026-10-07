// ==================== INDIAN CALENDAR - COMPLETE ====================

const IndianCalendar = {
    // Current mode: 'simple' or 'indian'
    mode: localStorage.getItem('calendarMode') || 'simple',

    // Tithi names
    tithis: [
        { name: 'Pratipada', nameHi: 'प्रतिपदा', num: '१' },
        { name: 'Dwitiya', nameHi: 'द्वितीया', num: '२' },
        { name: 'Tritiya', nameHi: 'तृतीया', num: '३' },
        { name: 'Chaturthi', nameHi: 'चतुर्थी', num: '४' },
        { name: 'Panchami', nameHi: 'पंचमी', num: '५' },
        { name: 'Shashthi', nameHi: 'षष्ठी', num: '६' },
        { name: 'Saptami', nameHi: 'सप्तमी', num: '७' },
        { name: 'Ashtami', nameHi: 'अष्टमी', num: '८' },
        { name: 'Navami', nameHi: 'नवमी', num: '९' },
        { name: 'Dashami', nameHi: 'दशमी', num: '१०' },
        { name: 'Ekadashi', nameHi: 'एकादशी', num: '११' },
        { name: 'Dwadashi', nameHi: 'द्वादशी', num: '१२' },
        { name: 'Trayodashi', nameHi: 'त्रयोदशी', num: '१३' },
        { name: 'Chaturdashi', nameHi: 'चतुर्दशी', num: '१४' },
        { name: 'Purnima', nameHi: 'पूर्णिमा', num: '१५' },
        { name: 'Amavasya', nameHi: 'अमावस्या', num: '३०' }
    ],

    // Nakshatra names
    nakshatras: [
        { name: 'Ashwini', nameHi: 'अश्विनी', symbol: '🐴' },
        { name: 'Bharani', nameHi: 'भरणी', symbol: '🔺' },
        { name: 'Krittika', nameHi: 'कृत्तिका', symbol: '🔥' },
        { name: 'Rohini', nameHi: 'रोहिणी', symbol: '🐂' },
        { name: 'Mrigashira', nameHi: 'मृगशिरा', symbol: '🦌' },
        { name: 'Ardra', nameHi: 'आर्द्रा', symbol: '💧' },
        { name: 'Punarvasu', nameHi: 'पुनर्वसु', symbol: '🏹' },
        { name: 'Pushya', nameHi: 'पुष्य', symbol: '🌸' },
        { name: 'Ashlesha', nameHi: 'आश्लेषा', symbol: '🐍' },
        { name: 'Magha', nameHi: 'मघा', symbol: '👑' },
        { name: 'P.Phalguni', nameHi: 'पू.फाल्गुनी', symbol: '🛏️' },
        { name: 'U.Phalguni', nameHi: 'उ.फाल्गुनी', symbol: '☀️' },
        { name: 'Hasta', nameHi: 'हस्त', symbol: '✋' },
        { name: 'Chitra', nameHi: 'चित्रा', symbol: '💎' },
        { name: 'Swati', nameHi: 'स्वाति', symbol: '🌬️' },
        { name: 'Vishakha', nameHi: 'विशाखा', symbol: '🌿' },
        { name: 'Anuradha', nameHi: 'अनुराधा', symbol: '🪷' },
        { name: 'Jyeshtha', nameHi: 'ज्येष्ठा', symbol: '☂️' },
        { name: 'Mula', nameHi: 'मूल', symbol: '🦁' },
        { name: 'P.Ashadha', nameHi: 'पू.आषाढ़ा', symbol: '🌊' },
        { name: 'U.Ashadha', nameHi: 'उ.आषाढ़ा', symbol: '🐘' },
        { name: 'Shravana', nameHi: 'श्रवण', symbol: '👂' },
        { name: 'Dhanishta', nameHi: 'धनिष्ठा', symbol: '🥁' },
        { name: 'Shatabhisha', nameHi: 'शतभिषा', symbol: '⭕' },
        { name: 'P.Bhadra', nameHi: 'पू.भाद्रपद', symbol: '⚡' },
        { name: 'U.Bhadra', nameHi: 'उ.भाद्रपद', symbol: '🌙' },
        { name: 'Revati', nameHi: 'रेवती', symbol: '🐟' }
    ],

    // Hindu months
    hinduMonths: [
        { name: 'Chaitra', nameHi: 'चैत्र', season: 'Vasant (Spring)' },
        { name: 'Vaishakha', nameHi: 'वैशाख', season: 'Grishma (Summer)' },
        { name: 'Jyeshtha', nameHi: 'ज्येष्ठ', season: 'Grishma (Summer)' },
        { name: 'Ashadha', nameHi: 'आषाढ़', season: 'Varsha (Monsoon)' },
        { name: 'Shravana', nameHi: 'श्रावण', season: 'Varsha (Monsoon)' },
        { name: 'Bhadrapada', nameHi: 'भाद्रपद', season: 'Sharad (Autumn)' },
        { name: 'Ashwin', nameHi: 'आश्विन', season: 'Sharad (Autumn)' },
        { name: 'Kartik', nameHi: 'कार्तिक', season: 'Hemant (Pre-winter)' },
        { name: 'Margashirsha', nameHi: 'मार्गशीर्ष', season: 'Hemant (Pre-winter)' },
        { name: 'Pausha', nameHi: 'पौष', season: 'Shishir (Winter)' },
        { name: 'Magha', nameHi: 'माघ', season: 'Shishir (Winter)' },
        { name: 'Phalguna', nameHi: 'फाल्गुन', season: 'Vasant (Spring)' }
    ],

    // Calculate moon age
    getMoonAge(date) {
    let d;
    
    // Fix timezone issue
    if (date instanceof Date) {
        d = date;
    } else if (typeof date === 'string' && date.includes('-')) {
        // Parse "YYYY-MM-DD" format correctly
        const [year, month, day] = date.split('-').map(Number);
        d = new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid timezone issues
    } else {
        d = new Date(date);
    }
    
    const knownNewMoon = new Date('2024-01-11T11:57:00Z');
    const lunarCycle = 29.53058867;
    const daysSince = (d - knownNewMoon) / (1000 * 60 * 60 * 24);
    return ((daysSince % lunarCycle) + lunarCycle) % lunarCycle;
},

    // Get Tithi for a date
    getTithi(date) {
        const moonAge = this.getMoonAge(date);
        const tithiInCycle = (moonAge / 29.53) * 30;
        let index = Math.floor(tithiInCycle);
        
        // Purnima (day 15)
        if (index >= 14 && index < 16) {
            return this.tithis[14]; // Purnima
        }
        // Amavasya (day 29-30 or 0)
        if (index >= 29 || index < 1) {
            return this.tithis[15]; // Amavasya
        }
        
        // Map 0-14 and 15-29 to 0-14
        if (index >= 15) index = index - 15;
        
        return this.tithis[index] || this.tithis[0];
    },

    // Get Nakshatra for a date
    getNakshatra(date) {
        const moonAge = this.getMoonAge(date);
        const moonLong = (moonAge / 29.53 * 360) % 360;
        const index = Math.floor(moonLong / (360 / 27)) % 27;
        return this.nakshatras[index] || this.nakshatras[0];
    },

    // Get Moon Phase
    getMoonPhase(date) {
        const age = this.getMoonAge(date);
        
        if (age < 1.85) return { name: 'New Moon', emoji: '🌑' };
        if (age < 7.38) return { name: 'Waxing Crescent', emoji: '🌒' };
        if (age < 11.07) return { name: 'First Quarter', emoji: '🌓' };
        if (age < 14.77) return { name: 'Waxing Gibbous', emoji: '🌔' };
        if (age < 18.46) return { name: 'Full Moon', emoji: '🌕' };
        if (age < 22.15) return { name: 'Waning Gibbous', emoji: '🌖' };
        if (age < 25.84) return { name: 'Last Quarter', emoji: '🌗' };
        return { name: 'Waning Crescent', emoji: '🌘' };
    },

    // Get Paksha
    getPaksha(date) {
        const moonAge = this.getMoonAge(date);
        return moonAge < 14.77 ?
            { name: 'Shukla Paksha', nameHi: 'शुक्ल पक्ष' } :
            { name: 'Krishna Paksha', nameHi: 'कृष्ण पक्ष' };
    },

    // Get Hindu Month
    getHinduMonth(date) {
        const d = date instanceof Date ? date : new Date(date);
        const month = d.getMonth();
        // Approximate mapping
        const map = [9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8];
        return this.hinduMonths[map[month]] || this.hinduMonths[0];
    },

    // Get complete Panchang for a date (SYNC)
    getPanchang(date) {
    // Ensure we have a proper Date object
    let d;
    if (date instanceof Date) {
        d = date;
    } else if (typeof date === 'string' && date.includes('-')) {
        const [year, month, day] = date.split('-').map(Number);
        d = new Date(year, month - 1, day, 12, 0, 0);
    } else {
        d = new Date(date);
    }
    
    return {
        tithi: this.getTithi(d),
        nakshatra: this.getNakshatra(d),
        moonPhase: this.getMoonPhase(d),
        paksha: this.getPaksha(d),
        hinduMonth: this.getHinduMonth(d)
    };
},

    // Local holidays data
    holidays: {},

    // Fetch holidays (returns local data for now)
    async fetchHolidays(year) {
        // Return empty for now - can add API later
        return this.holidays[year] || {};
    },

    // Toggle mode
    setMode(mode) {
        this.mode = mode;
        localStorage.setItem('calendarMode', mode);
        console.log('Calendar mode set to:', mode);
    }
};

// Make it globally available
window.IndianCalendar = IndianCalendar;

console.log('IndianCalendar loaded, mode:', IndianCalendar.mode);