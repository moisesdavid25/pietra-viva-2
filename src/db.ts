import Database from 'better-sqlite3';

const db = new Database(':memory:');

db.exec(`
  CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section TEXT NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    price_unit TEXT,
    image_url TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    price REAL NOT NULL,
    entree TEXT,
    primo TEXT,
    secondo TEXT,
    contorno TEXT,
    desert TEXT,
    bevande TEXT
  );

  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed Settings
const settings = [
  { key: 'home_image_cucina', value: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&h=400&fit=crop' },
  { key: 'home_image_pizza', value: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=400&fit=crop' },
  { key: 'home_image_vino', value: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=400&fit=crop' },
  { key: 'home_image_menu', value: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop' }
];

const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
settings.forEach(s => insertSetting.run(s.key, s.value));

// Seed Categories
const categories = [
  { id: 1, section: 'Cucina', name: 'Antipasti' },
  { id: 2, section: 'Cucina', name: 'Primi' },
  { id: 3, section: 'Cucina', name: 'Secondi' },
  { id: 4, section: 'Cucina', name: 'Contorni' },
  { id: 5, section: 'Pizza', name: 'Rosse' },
  { id: 6, section: 'Pizza', name: 'Bianche' },
  { id: 7, section: 'Pizza', name: 'Special' },
  { id: 8, section: 'Vino e Drinks', name: 'Rossi' },
  { id: 9, section: 'Vino e Drinks', name: 'Bianchi' },
  { id: 10, section: 'Vino e Drinks', name: 'Bollicine' },
  { id: 11, section: 'Vino e Drinks', name: 'Amari' },
  { id: 12, section: 'Vino e Drinks', name: 'Bevande/Birre' }
];

const insertCategory = db.prepare('INSERT INTO categories (id, section, name) VALUES (?, ?, ?)');
categories.forEach(c => insertCategory.run(c.id, c.section, c.name));

// Seed Products
const products = [
  // Cucina - Antipasti
  { category_id: 1, name: 'Selezione di salumi, formaggi verdure grigliate, olive e caldi dello chef', description: '', price: 10, price_unit: null, image_url: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=500&h=500&fit=crop' },
  { category_id: 1, name: 'Tris di bruschette a fantasia dello chef', description: '', price: 5, price_unit: null, image_url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=500&h=500&fit=crop' },
  { category_id: 1, name: 'Polpette al sugo', description: '', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=500&h=500&fit=crop' },
  { category_id: 1, name: 'Caprese', description: 'Mozzarella di bufala, pomodoro e origano', price: 10, price_unit: null, image_url: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=500&h=500&fit=crop' },
  { category_id: 1, name: 'Tagliere della casa (2 persone)', description: '', price: 20, price_unit: null, image_url: 'https://images.unsplash.com/photo-1626200419188-f1a160700d40?w=500&h=500&fit=crop' },
  { category_id: 1, name: 'Insalata di seppia', description: '', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1599084990807-3334394e0be7?w=500&h=500&fit=crop' },
  { category_id: 1, name: 'Polipetti alla luciana', description: '', price: 14, price_unit: null, image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&h=500&fit=crop' },
  { category_id: 1, name: 'Soutè di cozze', description: '', price: 10, price_unit: null, image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&h=500&fit=crop' },
  { category_id: 1, name: 'Alici fritte', description: '', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1599084990807-3334394e0be7?w=500&h=500&fit=crop' },

  // Cucina - Primi
  { category_id: 2, name: 'Spaghetti alla carbonara', description: '', price: 11, price_unit: null, image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&h=500&fit=crop' },
  { category_id: 2, name: 'Rigatoni alla genovese', description: '', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&h=500&fit=crop' },
  { category_id: 2, name: 'Panciotti ripieni di melanzane e scamorza al Pomodoro', description: '', price: 14, price_unit: null, image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&h=500&fit=crop' },
  { category_id: 2, name: 'Tonnarelli alla norcina', description: '', price: 11, price_unit: null, image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&h=500&fit=crop' },
  { category_id: 2, name: 'Bauletti ripieni di pesce spada e lime', description: '', price: 14, price_unit: null, image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&h=500&fit=crop' },
  { category_id: 2, name: 'Tonnarelli alla scoglio', description: '', price: 16, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500&h=500&fit=crop' },
  { category_id: 2, name: 'Linguine all\'astice', description: '', price: 22, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500&h=500&fit=crop' },
  { category_id: 2, name: 'Spaghetti con vongole', description: '', price: 16, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500&h=500&fit=crop' },
  { category_id: 2, name: 'Spaghetti aglio, olio, peperoncino e baccalà', description: '', price: 14, price_unit: null, image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&h=500&fit=crop' },

  // Cucina - Secondi
  { category_id: 3, name: 'Bistecca di vitello', description: '', price: 6, price_unit: '/etto', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&h=500&fit=crop' },
  { category_id: 3, name: 'Tagliata di vitello', description: '', price: 18, price_unit: null, image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&h=500&fit=crop' },
  { category_id: 3, name: 'Agnello con patate', description: '', price: 18, price_unit: null, image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&h=500&fit=crop' },
  { category_id: 3, name: 'Scaloppine al limone', description: '', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&h=500&fit=crop' },
  { category_id: 3, name: 'Spigola fritta in crosta di sale', description: '', price: 22, price_unit: null, image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&h=500&fit=crop' },
  { category_id: 3, name: 'Orata grigliata', description: '', price: 22, price_unit: null, image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&h=500&fit=crop' },
  { category_id: 3, name: 'Salmone in crosta di pistacchio con chips di patate', description: '', price: 15, price_unit: null, image_url: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=500&h=500&fit=crop' },
  { category_id: 3, name: 'Frittura calamari e gamberi', description: '', price: 15, price_unit: null, image_url: 'https://images.unsplash.com/photo-1599084990807-3334394e0be7?w=500&h=500&fit=crop' },
  { category_id: 3, name: 'Frittura di paranza', description: '', price: 13, price_unit: null, image_url: 'https://images.unsplash.com/photo-1599084990807-3334394e0be7?w=500&h=500&fit=crop' },

  // Cucina - Contorni
  { category_id: 4, name: 'Verdure di stagione grigliate', description: '', price: 4, price_unit: null, image_url: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=500&h=500&fit=crop' },
  { category_id: 4, name: 'Patate al forno', description: '', price: 4, price_unit: null, image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&h=500&fit=crop' },
  { category_id: 4, name: 'Bieta con olive e acciughe', description: '', price: 4, price_unit: null, image_url: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=500&h=500&fit=crop' },
  { category_id: 4, name: 'Broccoli ripassati', description: '', price: 4, price_unit: null, image_url: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=500&h=500&fit=crop' },

  // Pizza - Rosse
  { category_id: 5, name: 'Margherita', description: 'Pomodoro, mozzarella, basilico, e olio d\'oliva', price: 6, price_unit: null, image_url: 'https://images.unsplash.com/photo-1604068549290-dea0e4a30536?w=500&h=500&fit=crop' },
  { category_id: 5, name: 'Marinara', description: 'Pomodoro, aglio, origano, e olio d\'oliva', price: 5, price_unit: null, image_url: 'https://images.unsplash.com/photo-1604068549290-dea0e4a30536?w=500&h=500&fit=crop' },
  { category_id: 5, name: 'Capricciosa', description: 'Pomodoro, mozzarella, funghi, carciofi, prosciutto cotto, olive nere, olio d\'oliva e basilico', price: 9, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },
  { category_id: 5, name: 'Diavola', description: 'Pomodoro, mozzarella, salame piccante e basilico', price: 7, price_unit: null, image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&h=500&fit=crop' },
  { category_id: 5, name: 'Parmigiana', description: 'Pomodoro, mozzarella, melanzane alla parmigiana e basilico', price: 7, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },
  { category_id: 5, name: 'Calzone rosso', description: 'Pomodoro, mozzarella e prosciutto cotto', price: 9, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },
  { category_id: 5, name: 'Tonno e cipolla', description: 'Pomodoro (ombra), tonno, olio d\'oliva, mozzarella e cipolla', price: 10, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },
  { category_id: 5, name: '4 stagioni', description: 'Pomodoro, carciofini, funghi, salame piccante, olive e prosciutto cotto', price: 9, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },
  { category_id: 5, name: 'Amatriciana', description: 'Pomodoro, guanciale, mozzarella e pecorino romano', price: 10, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },
  { category_id: 5, name: 'Napoletana', description: 'Pomodoro, capperi, alici, aglio e origano', price: 7.50, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },

  // Pizza - Bianche
  { category_id: 6, name: 'Quattro Formaggi', description: 'Mozzarella, gorgonzola, fontina e parmigiano reggiano', price: 9, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },
  { category_id: 6, name: 'Tartufo', description: 'Mozzarella, crema di tartufo, salsiccia, funghi champignon e basilico', price: 9, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },
  { category_id: 6, name: 'Mortadella', description: 'Mozzarella, mortadella, ricotta e pistacchio', price: 9, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },
  { category_id: 6, name: 'Sorrentina', description: 'Mozzarella, prosciutto crudo, rucola e parmigiano reggiano', price: 9, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },
  { category_id: 6, name: 'Tedesca', description: 'Mozzarella, wurstel e patatine fritte', price: 9, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },
  { category_id: 6, name: 'Crocchè', description: 'Mozzarella, crocchette e prosciutto crudo', price: 9, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },
  { category_id: 6, name: 'Pizzucca', description: 'Mozzarella, crema di zucca, gorgonzola e speck', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },
  { category_id: 6, name: 'La Porcina', description: 'Mozzarella, porcini, salamino nero casertano e provolone del monaco', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },
  { category_id: 6, name: 'Calzone bianco', description: 'Mozzarella, prosciutto cotto e provola', price: 9, price_unit: null, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop' },

  // Pizza - Special
  { category_id: 7, name: 'Fior di Bufala', description: 'Crema porcini, prosciutto crudo porcini, mozzarella di bufala e fonduta di parmigiano', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=500&fit=crop' },
  { category_id: 7, name: 'Nduja', description: 'Crema di zucchine, nduja calabrese, speck e mozzarella di Bufala', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=500&fit=crop' },
  { category_id: 7, name: 'Friarielli', description: 'Broccoli ripassati, porchetta, Mozzarella di bufala, peperoncino', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=500&fit=crop' },
  { category_id: 7, name: 'La Rustica', description: 'Patate al forno, porchetta, mozzarella di Bufala e Rosmarino', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=500&fit=crop' },
  { category_id: 7, name: 'Pacchetelle', description: 'Pacchetelle rosse, pacchetelle gialle, alici di cetara, capperi con gambo e origano', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=500&fit=crop' },
  { category_id: 7, name: 'Tris di Pomodori', description: 'Pacchetella gialla, pacchetella rossa, pomodorino rosso, mozzarella di bufala, origano e basilico', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=500&fit=crop' },
  { category_id: 7, name: 'Poker', description: 'Salsa tartufata, salame piccante, fior di latte e parmigiano', price: 10, price_unit: null, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=500&fit=crop' },
  { category_id: 7, name: 'La Valtellina', description: 'Pomodoro (ombra), in uscita: rucola, Bresaola, Stracciata di bufala e glassa di aceto balsamico', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=500&fit=crop' },
  { category_id: 7, name: 'Parmi(stagionale)', description: 'Pomodoro, mozzarella, melanzane alla parmigiana, basilico, polpettine al tartufo e cornicione ripieno di ricotta', price: 12, price_unit: null, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=500&fit=crop' },

  // Vino - Rossi
  { category_id: 8, name: 'Costabella', description: 'Colore rosso rubino. Profumo vinoso e piacevolmente persistente. Al palato risulta asciutto e di buona struttura.', price: 18, price_unit: null, image_url: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=500&h=500&fit=crop' },
  { category_id: 8, name: 'Hesperum', description: 'Colore rosso rubino intenso con riflessi violacei. Al naso offre sentori complessi di amarena, frutti di bosco maturi e note speziate di pepe nero e cuoio. Al palato è corposo e avvolgente, con tannini vellutati e un finale lungo ed elegante.', price: 30, price_unit: null, image_url: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=500&h=500&fit=crop' },
  { category_id: 8, name: 'Cesanese', description: 'Colore rosso rubino. Profumo intenso con note fruttate. Al palato risulta asciutto ed equilibrato, caratterizzato da piacevoli note minerali nel finale.', price: 20, price_unit: null, image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=500&h=500&fit=crop' },
  { category_id: 8, name: 'Aglianico', description: 'Intenso e armonioso, sprigiona sentori di frutti rossi, spezie ed erbe mediterranee, seguiti da sfumature di cioccolato e vaniglia. Al palato presenta struttura ed eleganza, con tannini complessi e avvolgenti.', price: 18, price_unit: null, image_url: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=500&h=500&fit=crop' },
  { category_id: 8, name: 'Syrah', description: 'Colore rosso porpora. Evidenti sentori di frutta, vaniglia e spezie. Al palato risulta secco, caldo e morbido.', price: 20, price_unit: null, image_url: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=500&h=500&fit=crop' },
  { category_id: 8, name: 'Sangiovese', description: 'Colore rosso porpora con riflessi violacei. Profumo intenso e persistente con note speziate. Al palato risulta equilibrato e di struttura robusta.', price: 18, price_unit: null, image_url: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=500&h=500&fit=crop' },
  { category_id: 8, name: 'Montepulciano', description: 'Vino della casa', price: 3, price_unit: '/ calice', image_url: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=500&h=500&fit=crop' },

  // Vino - Bianchi
  { category_id: 9, name: 'Costabella', description: 'Vino da tutto pasto, indicato ad accompagnare carni rosse, arrosti e formaggi saporiti', price: 18, price_unit: null, image_url: 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4?w=500&h=500&fit=crop' },
  { category_id: 9, name: 'Hesperum Reale', description: 'Colore giallo paglierino con riflessi dorati. Al naso è elegante e fine, con note floreali e sentori di frutta a polpa bianca e agrumi. Al palato è fresco, sapido e minerale, con una piacevole persistenza.', price: 30, price_unit: null, image_url: 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4?w=500&h=500&fit=crop' },
  { category_id: 9, name: 'Greco', description: 'Colore giallo dorato. Profumo intenso e persistente con note fruttate. Al palato risulta elegante, asciutto e armonioso.', price: 20, price_unit: null, image_url: 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4?w=500&h=500&fit=crop' },
  { category_id: 9, name: 'Malvasia Puntinata', description: 'Colore giallo dorato. Profumi intensi e piacevolmente floreali. Al palato presenta un caratteristico gusto semi-aromatico di buona struttura.', price: 25, price_unit: null, image_url: 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4?w=500&h=500&fit=crop' },
  { category_id: 9, name: 'Chardonnay', description: 'Colore giallo acceso. Note floreali di buona intensità e persistenza. Al palato risulta deciso, fresco e giustamente sapido.', price: 18, price_unit: null, image_url: 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4?w=500&h=500&fit=crop' },
  { category_id: 9, name: 'Bellone', description: 'Colore giallo dorato. Profumo intenso con note fruttate. Al palato risulta asciutto ed equilibrato, caratterizzato da piacevoli note minerali nel finale.', price: 20, price_unit: null, image_url: 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4?w=500&h=500&fit=crop' },
  { category_id: 9, name: 'Pecorino', description: 'Vino della casa', price: 3, price_unit: '/ calice', image_url: 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4?w=500&h=500&fit=crop' },

  // Vino - Bollicine
  { category_id: 10, name: 'Prosecco Campe', description: 'Colore giallo tenue. Al naso sentori di mela verde e agrumi. Gusto vivace, fresco e minerale.', price: 20, price_unit: null, image_url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&h=500&fit=crop' },
  { category_id: 10, name: 'Prosecco Broccato', description: 'Giallo paglierino con perlage fine. Note di fiori d\'acacia e mela. Gusto armonico, elegante e aromatico.', price: 20, price_unit: null, image_url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&h=500&fit=crop' },
  { category_id: 10, name: 'Prosecco La Gioiosa', description: 'Colore giallo paglierino scarico con perlage fine e persistente. Al naso è intensamente fruttato con note di mela golden matura e fiori di acacia. Al palato è fresco, sapido e armonico, con un finale piacevolmente vivace.', price: 25, price_unit: null, image_url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&h=500&fit=crop' },

  // Vino - Amari
  { category_id: 11, name: 'Amaro del capo', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },
  { category_id: 11, name: 'Amaro lucano', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },
  { category_id: 11, name: 'Jägermeister', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },
  { category_id: 11, name: 'Averna', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },
  { category_id: 11, name: 'Montenegro', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },
  { category_id: 11, name: 'Genziana', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },
  { category_id: 11, name: 'Fernet', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },
  { category_id: 11, name: 'Jefferson', description: '', price: 5, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },
  { category_id: 11, name: 'Limoncello', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },
  { category_id: 11, name: 'Baileys', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },
  { category_id: 11, name: 'Grappa barricata', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },
  { category_id: 11, name: 'Sambuca', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },
  { category_id: 11, name: 'Agricanto', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },
  { category_id: 11, name: 'Grappa bianca Frattina', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },
  { category_id: 11, name: 'Whisky', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=500&h=500&fit=crop' },

  // Drinks - Bevande/Birre
  { category_id: 12, name: 'Acqua naturale 0,75L', description: '', price: 2.50, price_unit: null, image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Acqua gassata 0,75L', description: '', price: 2.50, price_unit: null, image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Coca cola 1L', description: '', price: 4, price_unit: null, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Coca cola 0,33L', description: '', price: 2.50, price_unit: null, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Fanta 1L', description: '', price: 4, price_unit: null, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Fanta 0,33L', description: '', price: 2.50, price_unit: null, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Peroni 33cL', description: '', price: 2.50, price_unit: null, image_url: 'https://images.unsplash.com/photo-1614315584056-02061254211d?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Heineken 33cL', description: '', price: 3, price_unit: null, image_url: 'https://images.unsplash.com/photo-1614315584056-02061254211d?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Messina 33cL', description: '', price: 3.50, price_unit: null, image_url: 'https://images.unsplash.com/photo-1614315584056-02061254211d?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Paulaner Weissbier 50cL', description: '', price: 5, price_unit: null, image_url: 'https://images.unsplash.com/photo-1614315584056-02061254211d?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Ichnusa 33cL', description: '', price: 3.50, price_unit: null, image_url: 'https://images.unsplash.com/photo-1614315584056-02061254211d?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Ichnusa 66cL', description: '', price: 5, price_unit: null, image_url: 'https://images.unsplash.com/photo-1614315584056-02061254211d?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Ichnusa non Filtrata 33cL', description: '', price: 4, price_unit: null, image_url: 'https://images.unsplash.com/photo-1614315584056-02061254211d?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Montecassino 33cL', description: '', price: 7, price_unit: null, image_url: 'https://images.unsplash.com/photo-1614315584056-02061254211d?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Mastri Birrai Umbri 33cL', description: '', price: 6, price_unit: null, image_url: 'https://images.unsplash.com/photo-1614315584056-02061254211d?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Caffè', description: '', price: 1.50, price_unit: null, image_url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&h=500&fit=crop' },
  { category_id: 12, name: 'Caffè decaffeinato', description: '', price: 2, price_unit: null, image_url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&h=500&fit=crop' }
];

const insertProduct = db.prepare('INSERT INTO products (category_id, name, description, price, price_unit, image_url) VALUES (?, ?, ?, ?, ?, ?)');
products.forEach(p => insertProduct.run(p.category_id, p.name, p.description, p.price, p.price_unit, p.image_url));

// Seed Menus
const menus = [
  {
    type: 'Carne',
    price: 16,
    entree: 'Bruschette al pomodoro',
    primo: 'Gnocchi crema di zucchine, guanciale croccante e stracciatella',
    secondo: 'Salsiccia con scamorza ai ferri',
    contorno: 'Patate al forno, Insalata mista',
    desert: 'Dolce della casa',
    bevande: 'Acqua o calice di vino'
  },
  {
    type: 'Pesce',
    price: 22,
    entree: 'Bruschette al pomodoro',
    primo: 'Spaghetti con lupini e pomodori',
    secondo: 'Frittura di mare',
    contorno: 'Patate al forno, Insalata mista',
    desert: 'Dolce della casa',
    bevande: 'Acqua o calice di vino'
  },
  {
    type: 'Pizza',
    price: 16,
    entree: 'Bruschette al pomodoro',
    primo: 'Margherita o Capricciosa, 4 Formaggi, Diavola, Wurstel e patatine',
    secondo: '',
    contorno: 'Patatine Fritte',
    desert: 'Dolce della casa',
    bevande: 'Acqua 50cl'
  }
];

const insertMenu = db.prepare('INSERT INTO menus (type, price, entree, primo, secondo, contorno, desert, bevande) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
menus.forEach(m => insertMenu.run(m.type, m.price, m.entree, m.primo, m.secondo, m.contorno, m.desert, m.bevande));

export default db;
