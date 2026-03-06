const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'snapbook-secret-key-2024';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database setup
const db = new sqlite3.Database('./snapbook.db');

// Initialize database tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        city TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS photographers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        bio TEXT,
        experience_years INTEGER,
        specialty TEXT,
        style TEXT,
        profile_photo TEXT,
        rating REAL,
        base_price REAL,
        city TEXT,
        phone TEXT,
        email TEXT,
        portfolio_url TEXT,
        equipment TEXT,
        languages TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS studios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT,
        city TEXT,
        state TEXT,
        facilities TEXT,
        area_sqft INTEGER,
        contact_number TEXT,
        email TEXT,
        parking_available BOOLEAN,
        ac_available BOOLEAN,
        price_per_hour REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        photographer_id INTEGER,
        name TEXT,
        type TEXT,
        duration_hours INTEGER,
        price REAL,
        description TEXT,
        deliverables TEXT,
        FOREIGN KEY (photographer_id) REFERENCES photographers (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        photographer_id INTEGER,
        session_date DATE,
        start_time TIME,
        end_time TIME,
        session_type TEXT,
        location_type TEXT,
        price REAL,
        status TEXT DEFAULT 'available',
        FOREIGN KEY (photographer_id) REFERENCES photographers (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        session_id INTEGER,
        package_id INTEGER,
        event_type TEXT,
        event_details TEXT,
        total_amount REAL,
        booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'confirmed',
        payment_method TEXT DEFAULT 'Cash',
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (session_id) REFERENCES sessions (id),
        FOREIGN KEY (package_id) REFERENCES packages (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        photographer_id INTEGER,
        rating INTEGER,
        comment TEXT,
        review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (photographer_id) REFERENCES photographers (id)
    )`);

    insertSampleData();
});

// ─── Sample Data ──────────────────────────────────────────────────────────────

function insertPhotographers() {
    const photographers = [
        ['Rajesh Sharma', 'Award-winning wedding photographer with 12+ years capturing beautiful moments. Known for candid storytelling style.', 12, 'Wedding', 'Candid, Traditional', 'https://randomuser.me/api/portraits/men/32.jpg', 8.9, 15000, 'Mumbai', '9876543210', 'rajesh@snapbook.com', 'https://rajesh-portfolio.com', 'Canon EOS R5, 24-70mm f/2.8, Profoto B10', 'Hindi, English, Marathi'],
        ['Priya Patel', 'Creative portrait photographer specializing in lifestyle and editorial shoots. Published in Vogue India.', 8, 'Portrait', 'Natural Light, Editorial', 'https://randomuser.me/api/portraits/women/44.jpg', 9.2, 12000, 'Delhi', '9876543211', 'priya@snapbook.com', 'https://priya-portfolio.com', 'Sony A7IV, 85mm f/1.4, Godox AD600', 'Hindi, English, Gujarati'],
        ['Arjun Reddy', 'Dynamic event photographer who captures the energy and emotion of every occasion.', 10, 'Event', 'Documentary, Photojournalistic', 'https://randomuser.me/api/portraits/men/15.jpg', 8.5, 10000, 'Bangalore', '9876543212', 'arjun@snapbook.com', 'https://arjun-portfolio.com', 'Nikon Z8, 70-200mm f/2.8', 'Telugu, English, Kannada'],
        ['Sneha Kapoor', 'Fashion photographer with international experience. Worked with leading brands and magazines.', 15, 'Fashion', 'High Fashion, Commercial', 'https://randomuser.me/api/portraits/women/68.jpg', 9.4, 25000, 'Mumbai', '9876543213', 'sneha@snapbook.com', 'https://sneha-portfolio.com', 'Phase One XF, Broncolor Siros', 'Hindi, English'],
        ['Vikram Mehta', 'Product photography expert making brands stand out with stunning visual content.', 7, 'Product', 'Commercial, Flat Lay', 'https://randomuser.me/api/portraits/men/52.jpg', 8.3, 8000, 'Chennai', '9876543214', 'vikram@snapbook.com', 'https://vikram-portfolio.com', 'Canon 5D Mark IV, Macro 100mm', 'Tamil, English, Hindi'],
        ['Anita Desai', 'Food photographer creating mouthwatering images for restaurants and food brands.', 6, 'Food', 'Styled, Rustic', 'https://randomuser.me/api/portraits/women/22.jpg', 8.8, 9000, 'Delhi', '9876543215', 'anita@snapbook.com', 'https://anita-portfolio.com', 'Nikon D850, 50mm f/1.4', 'Hindi, English'],
        ['Karthik Nair', 'Landscape and travel photographer with work published in National Geographic Traveller India.', 14, 'Landscape', 'Fine Art, Documentary', 'https://randomuser.me/api/portraits/men/28.jpg', 9.1, 18000, 'Kochi', '9876543216', 'karthik@snapbook.com', 'https://karthik-portfolio.com', 'Sony A7RV, 16-35mm f/2.8', 'Malayalam, English, Hindi'],
        ['Deepika Verma', 'Specialized in newborn and maternity photography with a gentle, artistic approach.', 9, 'Newborn', 'Artistic, Lifestyle', 'https://randomuser.me/api/portraits/women/33.jpg', 9.0, 14000, 'Bangalore', '9876543217', 'deepika@snapbook.com', 'https://deepika-portfolio.com', 'Canon EOS R6, 35mm f/1.4', 'Kannada, English, Hindi'],
        ['Rahul Gupta', 'Corporate photographer delivering professional headshots and business imagery.', 11, 'Corporate', 'Professional, Clean', 'https://randomuser.me/api/portraits/men/41.jpg', 8.4, 7000, 'Hyderabad', '9876543218', 'rahul@snapbook.com', 'https://rahul-portfolio.com', 'Sony A9II, 70-200mm f/2.8', 'Telugu, Hindi, English'],
        ['Meera Iyer', 'Romantic wedding photographer known for capturing emotions and cultural traditions beautifully.', 13, 'Wedding', 'Fine Art, Romantic', 'https://randomuser.me/api/portraits/women/55.jpg', 9.0, 20000, 'Chennai', '9876543219', 'meera@snapbook.com', 'https://meera-portfolio.com', 'Canon EOS R3, Profoto A2', 'Tamil, English'],
        ['Sanjay Kumar', 'Wildlife photographer with expeditions across Indian national parks and forests.', 16, 'Wildlife', 'Documentary, Nature', 'https://randomuser.me/api/portraits/men/61.jpg', 8.7, 22000, 'Jaipur', '9876543220', 'sanjay@snapbook.com', 'https://sanjay-portfolio.com', 'Nikon D6, 600mm f/4', 'Hindi, English'],
        ['Kavitha Menon', 'Portrait photographer creating stunning personal branding and artistic portraits.', 5, 'Portrait', 'Studio, Creative', 'https://randomuser.me/api/portraits/women/17.jpg', 8.6, 6000, 'Kochi', '9876543221', 'kavitha@snapbook.com', 'https://kavitha-portfolio.com', 'Fujifilm GFX 50S II', 'Malayalam, English'],
        ['Arun Mathew', 'Event and conference photographer trusted by top corporates for flawless coverage.', 8, 'Event', 'Corporate, Live', 'https://randomuser.me/api/portraits/men/73.jpg', 8.5, 9000, 'Pune', '9876543222', 'arun@snapbook.com', 'https://arun-portfolio.com', 'Sony A1, 24-105mm f/4', 'Marathi, English, Hindi'],
        ['Pooja Singh', 'Maternity and family photographer who creates warm, timeless portraits.', 7, 'Maternity', 'Warm, Intimate', 'https://randomuser.me/api/portraits/women/29.jpg', 8.8, 11000, 'Lucknow', '9876543223', 'pooja@snapbook.com', 'https://pooja-portfolio.com', 'Canon EOS R5, 50mm f/1.2', 'Hindi, English'],
        ['Manish Tiwari', 'Fashion and editorial photographer with campaigns for major Indian designers.', 10, 'Fashion', 'Editorial, Avant-garde', 'https://randomuser.me/api/portraits/men/85.jpg', 8.3, 16000, 'Mumbai', '9876543224', 'manish@snapbook.com', 'https://manish-portfolio.com', 'Hasselblad X2D, Profoto Pro-11', 'Hindi, English'],
        ['Lakshmi Rao', 'Food stylist and photographer creating drool-worthy imagery for top restaurants.', 9, 'Food', 'Modern, Minimalist', 'https://randomuser.me/api/portraits/women/42.jpg', 9.0, 10000, 'Hyderabad', '9876543225', 'lakshmi@snapbook.com', 'https://lakshmi-portfolio.com', 'Nikon Z7II, Tilt-shift lens', 'Telugu, English, Hindi'],
        ['Nikhil Das', 'Architecture and interior photographer with an eye for geometry and light.', 12, 'Architecture', 'Minimalist, Technical', 'https://randomuser.me/api/portraits/men/19.jpg', 8.4, 13000, 'Kolkata', '9876543226', 'nikhil@snapbook.com', 'https://nikhil-portfolio.com', 'Canon TS-E 17mm, Tripod Gitzo GT5', 'Bengali, English, Hindi'],
        ['Ritu Sharma', 'Destination wedding photographer who has shot beautiful weddings across India and abroad.', 11, 'Wedding', 'Destination, Luxury', 'https://randomuser.me/api/portraits/women/64.jpg', 8.9, 30000, 'Jaipur', '9876543227', 'ritu@snapbook.com', 'https://ritu-portfolio.com', 'Sony A7IV, Drone DJI Mavic 3', 'Hindi, English'],
        ['Gaurav Joshi', 'Sports photographer covering cricket, football, and extreme sports events.', 13, 'Sports', 'Action, Dynamic', 'https://randomuser.me/api/portraits/men/38.jpg', 8.2, 12000, 'Delhi', '9876543228', 'gaurav@snapbook.com', 'https://gaurav-portfolio.com', 'Canon EOS R3, 400mm f/2.8', 'Hindi, English'],
        ['Swathi Krishnan', 'Creative portrait photographer blending traditional and contemporary aesthetics.', 6, 'Portrait', 'Cultural, Art', 'https://randomuser.me/api/portraits/women/71.jpg', 8.7, 7000, 'Coimbatore', '9876543229', 'swathi@snapbook.com', 'https://swathi-portfolio.com', 'Nikon Z6III, 85mm f/1.8', 'Tamil, English'],
        ['Amit Patel', 'Product and e-commerce photographer helping businesses sell through stunning images.', 8, 'Product', 'E-commerce, Lifestyle', 'https://randomuser.me/api/portraits/men/46.jpg', 8.5, 6000, 'Ahmedabad', '9876543230', 'amit@snapbook.com', 'https://amit-portfolio.com', 'Sony A7C, Light tent setup', 'Gujarati, Hindi, English'],
        ['Divya Nambiar', 'Event and party photographer who captures the joy and energy of celebrations.', 5, 'Event', 'Fun, Vibrant', 'https://randomuser.me/api/portraits/women/83.jpg', 8.6, 5000, 'Mysore', '9876543231', 'divya@snapbook.com', 'https://divya-portfolio.com', 'Fujifilm X-T5, 23mm f/1.4', 'Kannada, English'],
        ['Rohit Saxena', 'Travel photographer documenting cultures and landscapes across the subcontinent.', 15, 'Landscape', 'Travel, Street', 'https://randomuser.me/api/portraits/men/57.jpg', 9.1, 15000, 'Chandigarh', '9876543232', 'rohit@snapbook.com', 'https://rohit-portfolio.com', 'Leica Q3, DJI Air 3', 'Hindi, Punjabi, English'],
        ['Nandini Hegde', 'Newborn photographer creating beautiful keepsakes for new parents.', 4, 'Newborn', 'Posed, Lifestyle', 'https://randomuser.me/api/portraits/women/36.jpg', 8.8, 8000, 'Bangalore', '9876543233', 'nandini@snapbook.com', 'https://nandini-portfolio.com', 'Canon EOS R6 II, Macro 100mm', 'Kannada, English, Hindi'],
        ['Suresh Pillai', 'Wedding and pre-wedding photographer known for cinematic shots and drone coverage.', 10, 'Wedding', 'Cinematic, Drone', 'https://randomuser.me/api/portraits/men/22.jpg', 8.7, 18000, 'Trivandrum', '9876543234', 'suresh@snapbook.com', 'https://suresh-portfolio.com', 'Sony A7III, DJI Mavic 3 Pro', 'Malayalam, English, Tamil'],
        ['Tanvi Shah', 'Corporate headshot and branding photographer for executives and entrepreneurs.', 7, 'Corporate', 'Modern, Polished', 'https://randomuser.me/api/portraits/women/48.jpg', 8.5, 8000, 'Pune', '9876543235', 'tanvi@snapbook.com', 'https://tanvi-portfolio.com', 'Nikon Z8, Elinchrom ELC 500', 'Marathi, Hindi, English'],
        ['Vishnu Prasad', 'Cinematic pre-wedding and engagement photographer with a storytelling approach.', 9, 'Wedding', 'Cinematic, Storytelling', 'https://randomuser.me/api/portraits/men/67.jpg', 8.8, 16000, 'Hyderabad', '9876543236', 'vishnu@snapbook.com', 'https://vishnu-portfolio.com', 'Sony A7SIII, Gimbal DJI RS3', 'Telugu, Hindi, English'],
        ['Aditi Kulkarni', 'Fine art and conceptual portrait photographer pushing creative boundaries.', 6, 'Portrait', 'Fine Art, Conceptual', 'https://randomuser.me/api/portraits/women/91.jpg', 9.0, 11000, 'Pune', '9876543237', 'aditi@snapbook.com', 'https://aditi-portfolio.com', 'Canon EOS R5, Prism Lens FX filters', 'Marathi, Hindi, English'],
        ['Manoj Verma', 'Commercial and advertising photographer working with top brands across India.', 14, 'Product', 'Advertising, Luxury', 'https://randomuser.me/api/portraits/men/78.jpg', 8.6, 20000, 'Delhi', '9876543238', 'manoj@snapbook.com', 'https://manoj-portfolio.com', 'Phase One IQ4, Broncolor Move', 'Hindi, English'],
        ['Shreya Bhat', 'Lifestyle and family photographer creating authentic, joyful memories.', 5, 'Portrait', 'Lifestyle, Family', 'https://randomuser.me/api/portraits/women/59.jpg', 8.7, 7000, 'Bangalore', '9876543239', 'shreya@snapbook.com', 'https://shreya-portfolio.com', 'Sony A7IV, 35mm f/1.4 GM', 'Kannada, English, Hindi']
    ];

    photographers.forEach(p => {
        db.run(`INSERT OR IGNORE INTO photographers 
            (name, bio, experience_years, specialty, style, profile_photo, rating, base_price, city, phone, email, portfolio_url, equipment, languages) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, p);
    });
    console.log(`${photographers.length} photographers inserted`);
}

function insertStudios() {
    const studios = [
        ['PixelPerfect Studio', 'Andheri West', 'Mumbai', 'Maharashtra', 'Cyclorama Wall, Natural Light, Makeup Room', 2000, '022-11111111', 'andheri@pixelperfect.com', 1, 1, 3000],
        ['LightBox Studio', 'Bandra', 'Mumbai', 'Maharashtra', 'Infinity Cove, Props, Green Screen', 2500, '022-22222222', 'bandra@lightbox.com', 0, 1, 4000],
        ['ClickArt Studio', 'Connaught Place', 'Delhi', 'Delhi', 'Multiple Backdrops, Kitchen Set, Living Room Set', 3000, '011-11111111', 'cp@clickart.com', 1, 1, 3500],
        ['Studio Luminance', 'Hauz Khas', 'Delhi', 'Delhi', 'Rooftop, Natural Light Studio, Dressing Room', 1800, '011-22222222', 'hauzkhas@luminance.com', 0, 1, 2500],
        ['ShutterSpace', 'Koramangala', 'Bangalore', 'Karnataka', 'White Studio, Dark Studio, Outdoor Terrace', 2200, '080-11111111', 'koramangala@shutterspace.com', 1, 1, 2800],
        ['FocusPoint Studio', 'Indiranagar', 'Bangalore', 'Karnataka', 'Infinity Wall, Props Library, Lounge', 2500, '080-22222222', 'indiranagar@focuspoint.com', 1, 1, 3200],
        ['FrameWorks Studio', 'T Nagar', 'Chennai', 'Tamil Nadu', 'Cyclorama, Natural Light, Vintage Sets', 1800, '044-11111111', 'tnagar@frameworks.com', 1, 1, 2500],
        ['LensKraft Studio', 'Adyar', 'Chennai', 'Tamil Nadu', 'Product Table, Kitchen Set, Green Screen', 2000, '044-22222222', 'adyar@lenskraft.com', 0, 1, 2000],
        ['FlashForward Studio', 'Banjara Hills', 'Hyderabad', 'Telangana', 'Multiple Sets, Makeup Room, Wardrobe', 2500, '040-11111111', 'banjara@flashforward.com', 1, 1, 3000],
        ['Studio Aperture', 'Jubilee Hills', 'Hyderabad', 'Telangana', 'Rooftop Garden, White Cove, Props', 2200, '040-22222222', 'jubilee@aperture.com', 1, 1, 2800],
        ['ChromaStudio', 'Salt Lake', 'Kolkata', 'West Bengal', 'Classic Sets, Modern Backdrops, Green Screen', 1500, '033-11111111', 'saltlake@chroma.com', 1, 1, 2000],
        ['IrisLens Studio', 'Park Street', 'Kolkata', 'West Bengal', 'Heritage Room, Natural Light, Darkroom', 1800, '033-22222222', 'parkst@irislens.com', 0, 1, 2500],
        ['ZoomIn Studio', 'Shivaji Nagar', 'Pune', 'Maharashtra', 'Cyclorama, Product Setup, Garden', 2000, '020-11111111', 'shivaji@zoomin.com', 1, 1, 2200],
        ['SnapZone Studio', 'Viman Nagar', 'Pune', 'Maharashtra', 'Multiple Backdrops, Props, AC', 1800, '020-22222222', 'viman@snapzone.com', 1, 1, 2000],
        ['LightRoom Studio', 'C G Road', 'Ahmedabad', 'Gujarat', 'White Cove, Colored Walls, Props Room', 1600, '079-11111111', 'cgroad@lightroom.com', 1, 1, 1800],
        ['PrimeShot Studio', 'Vastrapur', 'Ahmedabad', 'Gujarat', 'Two Studios, Kitchen Set, Lounge', 2000, '079-22222222', 'vastrapur@primeshot.com', 1, 1, 2200],
        ['StudioCraft', 'MI Road', 'Jaipur', 'Rajasthan', 'Rajasthani Themed Sets, Terrace, Props', 1500, '0141-111111', 'miroad@studiocraft.com', 0, 1, 1800],
        ['RoyalClick Studio', 'Malviya Nagar', 'Jaipur', 'Rajasthan', 'Palace Set, Garden, Vintage Props', 2000, '0141-222222', 'malviya@royalclick.com', 1, 1, 2500],
        ['PhotoHub Studio', 'Hazratganj', 'Lucknow', 'Uttar Pradesh', 'Modern Sets, Green Screen, Makeup Area', 1400, '0522-111111', 'hazrat@photohub.com', 1, 1, 1500],
        ['VividFrame Studio', 'Gomti Nagar', 'Lucknow', 'Uttar Pradesh', 'White Studio, Outdoor Area, Props', 1600, '0522-222222', 'gomti@vividframe.com', 1, 1, 1800],
        ['BlinkStudio', 'Sector 17', 'Chandigarh', 'Chandigarh', 'Infinity Cove, Natural Light, Modern Props', 1800, '0172-111111', 'sec17@blink.com', 1, 1, 2000],
        ['StudioNova', 'MG Road', 'Kochi', 'Kerala', 'Tropical Sets, Natural Light, AC', 1500, '0484-111111', 'mgroad@studionova.com', 1, 1, 1800],
        ['LensMaster Studio', 'Edappally', 'Kochi', 'Kerala', 'White Cove, Product Table, Garden', 1800, '0484-222222', 'edappally@lensmaster.com', 1, 1, 2200],
        ['ClickStudio', 'RS Puram', 'Coimbatore', 'Tamil Nadu', 'Traditional Sets, Modern Backdrops', 1200, '0422-111111', 'rspuram@clickstudio.com', 1, 1, 1500],
        ['AuraShot Studio', 'Vijayanagar', 'Mysore', 'Karnataka', 'Garden Studio, Heritage Room, AC', 1400, '0821-111111', 'vijay@aurashot.com', 1, 1, 1600],
        ['FocalPoint Studio', 'Pattom', 'Trivandrum', 'Kerala', 'Beach Themed, White Studio, Props', 1500, '0471-111111', 'pattom@focalpoint.com', 1, 1, 1800],
        ['ExposureHub Studio', 'Dwaraka Nagar', 'Visakhapatnam', 'Andhra Pradesh', 'Multiple Sets, Green Screen, Props', 1300, '0891-111111', 'dwarka@exposurehub.com', 1, 1, 1500],
        ['FilmGrain Studio', 'GS Road', 'Guwahati', 'Assam', 'Natural Light, Indoor Garden, Props', 1200, '0361-111111', 'gsroad@filmgrain.com', 0, 1, 1400],
        ['CaptureLab Studio', 'MP Nagar', 'Bhopal', 'Madhya Pradesh', 'White Cove, Colored Backdrops, AC', 1300, '0755-111111', 'mp@capturelab.com', 1, 1, 1500],
        ['ProShot Studio', 'Vijay Nagar', 'Indore', 'Madhya Pradesh', 'Modern Studio, Props, Makeup Room', 1400, '0731-111111', 'vijay@proshot.com', 1, 1, 1600]
    ];

    studios.forEach(s => {
        db.run(`INSERT OR IGNORE INTO studios 
            (name, location, city, state, facilities, area_sqft, contact_number, email, parking_available, ac_available, price_per_hour) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, s);
    });
    console.log(`${studios.length} studios inserted`);
}

function insertPackages() {
    db.all('SELECT id, base_price, specialty FROM photographers', [], (err, photographers) => {
        if (err) { console.error('Error fetching photographers:', err); return; }

        photographers.forEach(p => {
            const base = p.base_price;
            const packages = [
                [p.id, 'Basic', 'Basic', 2, Math.round(base * 0.6), `Basic ${p.specialty} photography session`, '50 edited digital photos, Online gallery'],
                [p.id, 'Standard', 'Standard', 4, base, `Standard ${p.specialty} photography with extended coverage`, '150 edited digital photos, Online gallery, 10 prints (8x10)'],
                [p.id, 'Premium', 'Premium', 8, Math.round(base * 2.2), `Premium full-day ${p.specialty} photography experience`, '300+ edited digital photos, Online gallery, Photo album, 20 prints, Drone shots']
            ];

            packages.forEach(pkg => {
                db.run(`INSERT OR IGNORE INTO packages 
                    (photographer_id, name, type, duration_hours, price, description, deliverables) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`, pkg);
            });
        });
        console.log('Packages inserted for all photographers');
    });
}

function insertSessions() {
    db.all('SELECT id, base_price FROM photographers', [], (err, photographers) => {
        if (err) { console.error('Error fetching photographers:', err); return; }

        const sessionTimes = [
            { start: '06:00', end: '08:00', type: 'Early Morning' },
            { start: '09:00', end: '12:00', type: 'Morning' },
            { start: '13:00', end: '16:00', type: 'Afternoon' },
            { start: '16:30', end: '18:30', type: 'Golden Hour' },
            { start: '19:00', end: '22:00', type: 'Evening' }
        ];

        const locationTypes = ['Studio', 'Outdoor', 'Client Location', 'Studio', 'Outdoor'];
        const today = new Date();

        for (let day = 0; day < 14; day++) {
            const sessionDate = new Date(today);
            sessionDate.setDate(today.getDate() + day);
            const dateStr = sessionDate.toISOString().split('T')[0];

            photographers.forEach(p => {
                // Each photographer has 2-3 available slots per day
                const numSlots = 2 + Math.floor(Math.random() * 2);
                const shuffledTimes = [...sessionTimes].sort(() => Math.random() - 0.5);

                for (let i = 0; i < numSlots; i++) {
                    const timeSlot = shuffledTimes[i];
                    const priceMult = timeSlot.type === 'Golden Hour' ? 1.3 : (timeSlot.type === 'Evening' ? 1.2 : 1.0);
                    const price = Math.round(p.base_price * priceMult);

                    db.run(`INSERT OR IGNORE INTO sessions 
                        (photographer_id, session_date, start_time, end_time, session_type, location_type, price, status) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'available')`,
                        [p.id, dateStr, timeSlot.start, timeSlot.end, timeSlot.type, locationTypes[i], price]);
                }
            });
        }
        console.log('Sessions inserted for 14 days');
    });
}

function insertSampleData() {
    console.log('Inserting sample data...');
    insertPhotographers();
    insertStudios();
    setTimeout(() => insertPackages(), 1000);
    setTimeout(() => insertSessions(), 2000);
    console.log('Sample data insertion completed!');
}

// ─── Auth Middleware ───────────────────────────────────────────────────────────

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

// ─── API Routes ───────────────────────────────────────────────────────────────

// Home
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to SnapBook API', version: '1.0' });
});

// Get all photographers
app.get('/api/photographers', (req, res) => {
    const limit = parseInt(req.query.limit) || 30;
    const offset = parseInt(req.query.offset) || 0;
    const specialty = req.query.specialty;
    const city = req.query.city;
    const priceRange = req.query.price;

    let query = 'SELECT * FROM photographers WHERE 1=1';
    const params = [];

    if (specialty) { query += ' AND specialty LIKE ?'; params.push(`%${specialty}%`); }
    if (city) { query += ' AND city = ?'; params.push(city); }
    if (priceRange === 'budget') { query += ' AND base_price < 5000'; }
    else if (priceRange === 'mid') { query += ' AND base_price >= 5000 AND base_price <= 15000'; }
    else if (priceRange === 'premium') { query += ' AND base_price > 15000'; }

    query += ' ORDER BY rating DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    db.all(query, params, (err, photographers) => {
        if (err) return res.status(500).json({ error: err.message });

        db.get('SELECT COUNT(*) as total FROM photographers', [], (err, count) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ photographers, total: count.total });
        });
    });
});

// Search photographers
app.get('/api/photographers/search', (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Search query required' });

    db.all(`SELECT * FROM photographers 
            WHERE name LIKE ? OR specialty LIKE ? OR style LIKE ? OR city LIKE ? OR bio LIKE ?`,
        [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`],
        (err, photographers) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(photographers);
        });
});

// Get photographer by ID
app.get('/api/photographers/:id', (req, res) => {
    db.get('SELECT * FROM photographers WHERE id = ?', [req.params.id], (err, photographer) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!photographer) return res.status(404).json({ error: 'Photographer not found' });
        res.json(photographer);
    });
});

// Get packages for a photographer
app.get('/api/photographers/:id/packages', (req, res) => {
    db.all('SELECT * FROM packages WHERE photographer_id = ? ORDER BY price ASC', 
        [req.params.id], (err, packages) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(packages);
        });
});

// Get sessions for a photographer
app.get('/api/photographers/:id/sessions', (req, res) => {
    const { date } = req.query;
    let query = `SELECT s.*, p.name as photographer_name, p.profile_photo, p.specialty 
                 FROM sessions s 
                 JOIN photographers p ON s.photographer_id = p.id 
                 WHERE s.photographer_id = ? AND s.status = 'available'`;
    const params = [req.params.id];

    if (date) { query += ' AND s.session_date = ?'; params.push(date); }
    query += ' ORDER BY s.session_date, s.start_time';

    db.all(query, params, (err, sessions) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(sessions);
    });
});

// Get session details
app.get('/api/sessions/:id', (req, res) => {
    db.get(`SELECT s.*, p.name as photographer_name, p.profile_photo, p.specialty, p.base_price,
                   p.phone as photographer_phone, p.email as photographer_email
            FROM sessions s 
            JOIN photographers p ON s.photographer_id = p.id 
            WHERE s.id = ?`, [req.params.id], (err, session) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!session) return res.status(404).json({ error: 'Session not found' });

        // Get packages for this photographer
        db.all('SELECT * FROM packages WHERE photographer_id = ? ORDER BY price ASC',
            [session.photographer_id], (err, packages) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ session, packages });
            });
    });
});

// Get all studios
app.get('/api/studios', (req, res) => {
    const city = req.query.city;
    let query = 'SELECT * FROM studios';
    const params = [];

    if (city) { query += ' WHERE city = ?'; params.push(city); }
    query += ' ORDER BY name';

    db.all(query, params, (err, studios) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(studios);
    });
});

// Get all cities
app.get('/api/cities', (req, res) => {
    db.all(`SELECT DISTINCT city FROM (
                SELECT city FROM photographers 
                UNION 
                SELECT city FROM studios
            ) ORDER BY city`, [], (err, cities) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(cities.map(c => c.city));
    });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    db.get('SELECT COUNT(*) as cnt FROM photographers', [], (err, pCount) => {
        if (err) return res.status(500).json({ error: err.message });
        db.get('SELECT COUNT(*) as cnt FROM studios', [], (err, sCount) => {
            if (err) return res.status(500).json({ error: err.message });
            db.get('SELECT COUNT(DISTINCT city) as cnt FROM photographers', [], (err, cCount) => {
                if (err) return res.status(500).json({ error: err.message });
                db.get("SELECT COUNT(*) as cnt FROM sessions WHERE session_date >= DATE('now') AND status = 'available'", [], (err, sessCount) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({
                        photographers: pCount.cnt,
                        studios: sCount.cnt,
                        cities: cCount.cnt,
                        availableSessions: sessCount.cnt
                    });
                });
            });
        });
    });
});

// Create booking
app.post('/api/bookings', authenticateToken, (req, res) => {
    const { sessionId, packageId, eventType, eventDetails } = req.body;
    const userId = req.user.id;

    if (!sessionId || !packageId) {
        return res.status(400).json({ error: 'Session and package are required' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Get session
        db.get('SELECT * FROM sessions WHERE id = ? AND status = "available"', [sessionId], (err, session) => {
            if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }
            if (!session) { db.run('ROLLBACK'); return res.status(400).json({ error: 'Session not available' }); }

            // Get package
            db.get('SELECT * FROM packages WHERE id = ?', [packageId], (err, pkg) => {
                if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }
                if (!pkg) { db.run('ROLLBACK'); return res.status(400).json({ error: 'Package not found' }); }

                const totalAmount = pkg.price;

                // Create booking
                db.run(`INSERT INTO bookings (user_id, session_id, package_id, event_type, event_details, total_amount) 
                        VALUES (?, ?, ?, ?, ?, ?)`,
                    [userId, sessionId, packageId, eventType || '', eventDetails || '', totalAmount],
                    function(err) {
                        if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }

                        const bookingId = this.lastID;

                        // Mark session as booked
                        db.run('UPDATE sessions SET status = "booked" WHERE id = ?', [sessionId], (err) => {
                            if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }

                            db.run('COMMIT', (err) => {
                                if (err) return res.status(500).json({ error: err.message });
                                res.status(201).json({
                                    message: 'Booking confirmed!',
                                    bookingId,
                                    totalAmount,
                                    sessionId,
                                    packageName: pkg.name
                                });
                            });
                        });
                    });
            });
        });
    });
});

// Get user bookings
app.get('/api/my-bookings', authenticateToken, (req, res) => {
    const query = `
        SELECT b.*, s.session_date, s.start_time, s.end_time, s.session_type, s.location_type,
               p.name as photographer_name, p.profile_photo, p.specialty, p.phone as photographer_phone,
               pkg.name as package_name, pkg.type as package_type, pkg.duration_hours, pkg.deliverables
        FROM bookings b
        JOIN sessions s ON b.session_id = s.id
        JOIN photographers p ON s.photographer_id = p.id
        LEFT JOIN packages pkg ON b.package_id = pkg.id
        WHERE b.user_id = ?
        ORDER BY b.booking_date DESC`;

    db.all(query, [req.user.id], (err, bookings) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(bookings);
    });
});

// Cancel booking
app.post('/api/bookings/:id/cancel', authenticateToken, (req, res) => {
    const bookingId = req.params.id;
    const userId = req.user.id;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.get('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [bookingId, userId], (err, booking) => {
            if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }
            if (!booking) { db.run('ROLLBACK'); return res.status(404).json({ error: 'Booking not found' }); }
            if (booking.status === 'cancelled') { db.run('ROLLBACK'); return res.status(400).json({ error: 'Already cancelled' }); }

            db.run('UPDATE bookings SET status = "cancelled" WHERE id = ?', [bookingId], (err) => {
                if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }

                // Re-open the session
                db.run('UPDATE sessions SET status = "available" WHERE id = ?', [booking.session_id], (err) => {
                    if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }

                    db.run('COMMIT', (err) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ message: 'Booking cancelled successfully', bookingId });
                    });
                });
            });
        });
    });
});

// Add review
app.post('/api/photographers/:id/review', authenticateToken, (req, res) => {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 10) {
        return res.status(400).json({ error: 'Rating must be between 1 and 10' });
    }

    db.run('INSERT INTO reviews (user_id, photographer_id, rating, comment) VALUES (?, ?, ?, ?)',
        [req.user.id, req.params.id, rating, comment],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Review added', reviewId: this.lastID });
        });
});

// Get reviews
app.get('/api/photographers/:id/reviews', (req, res) => {
    db.all(`SELECT r.*, u.name as user_name 
            FROM reviews r JOIN users u ON r.user_id = u.id 
            WHERE r.photographer_id = ? ORDER BY r.review_date DESC`,
        [req.params.id], (err, reviews) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(reviews);
        });
});

// User Registration
app.post('/api/register', async (req, res) => {
    const { name, email, password, phone, city } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (name, email, password, phone, city) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, phone, city],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed'))
                        return res.status(400).json({ error: 'Email already exists' });
                    return res.status(500).json({ error: err.message });
                }
                const token = jwt.sign({ id: this.lastID, email }, SECRET_KEY);
                res.status(201).json({ 
                    message: 'Registration successful',
                    token, 
                    user: { id: this.lastID, name, email, city } 
                });
            });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY);
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, phone: user.phone, city: user.city }
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`SnapBook server running on http://localhost:${PORT}`);
    console.log(`Photographers: 30 | Studios: 30 | Cities: 15+`);
});
