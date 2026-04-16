// src/lib/countries.ts
// Centralised list of countries with dial codes, nationalities, and major cities.

export interface Country {
  code: string;       // ISO 3166-1 alpha-2
  name: string;       // Display name
  nationality: string; // Nationality adjective
  dialCode: string;   // E.g. "+383"
  flag: string;       // Emoji flag
}

export const COUNTRIES: Country[] = [
  { code: "XK", name: "Kosovo", nationality: "Kosovar", dialCode: "+383", flag: "🇽🇰" },
  { code: "AL", name: "Albania", nationality: "Albanian", dialCode: "+355", flag: "🇦🇱" },
  { code: "MK", name: "North Macedonia", nationality: "Macedonian", dialCode: "+389", flag: "🇲🇰" },
  { code: "RS", name: "Serbia", nationality: "Serbian", dialCode: "+381", flag: "🇷🇸" },
  { code: "ME", name: "Montenegro", nationality: "Montenegrin", dialCode: "+382", flag: "🇲🇪" },
  { code: "BA", name: "Bosnia & Herzegovina", nationality: "Bosnian", dialCode: "+387", flag: "🇧🇦" },
  { code: "HR", name: "Croatia", nationality: "Croatian", dialCode: "+385", flag: "🇭🇷" },
  { code: "SI", name: "Slovenia", nationality: "Slovenian", dialCode: "+386", flag: "🇸🇮" },
  { code: "DE", name: "Germany", nationality: "German", dialCode: "+49", flag: "🇩🇪" },
  { code: "AT", name: "Austria", nationality: "Austrian", dialCode: "+43", flag: "🇦🇹" },
  { code: "CH", name: "Switzerland", nationality: "Swiss", dialCode: "+41", flag: "🇨🇭" },
  { code: "GB", name: "United Kingdom", nationality: "British", dialCode: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", nationality: "American", dialCode: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", nationality: "Canadian", dialCode: "+1", flag: "🇨🇦" },
  { code: "FR", name: "France", nationality: "French", dialCode: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italy", nationality: "Italian", dialCode: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", nationality: "Spanish", dialCode: "+34", flag: "🇪🇸" },
  { code: "PT", name: "Portugal", nationality: "Portuguese", dialCode: "+351", flag: "🇵🇹" },
  { code: "NL", name: "Netherlands", nationality: "Dutch", dialCode: "+31", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", nationality: "Belgian", dialCode: "+32", flag: "🇧🇪" },
  { code: "SE", name: "Sweden", nationality: "Swedish", dialCode: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norway", nationality: "Norwegian", dialCode: "+47", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", nationality: "Danish", dialCode: "+45", flag: "🇩🇰" },
  { code: "FI", name: "Finland", nationality: "Finnish", dialCode: "+358", flag: "🇫🇮" },
  { code: "PL", name: "Poland", nationality: "Polish", dialCode: "+48", flag: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", nationality: "Czech", dialCode: "+420", flag: "🇨🇿" },
  { code: "SK", name: "Slovakia", nationality: "Slovak", dialCode: "+421", flag: "🇸🇰" },
  { code: "HU", name: "Hungary", nationality: "Hungarian", dialCode: "+36", flag: "🇭🇺" },
  { code: "RO", name: "Romania", nationality: "Romanian", dialCode: "+40", flag: "🇷🇴" },
  { code: "BG", name: "Bulgaria", nationality: "Bulgarian", dialCode: "+359", flag: "🇧🇬" },
  { code: "GR", name: "Greece", nationality: "Greek", dialCode: "+30", flag: "🇬🇷" },
  { code: "TR", name: "Turkey", nationality: "Turkish", dialCode: "+90", flag: "🇹🇷" },
  { code: "RU", name: "Russia", nationality: "Russian", dialCode: "+7", flag: "🇷🇺" },
  { code: "UA", name: "Ukraine", nationality: "Ukrainian", dialCode: "+380", flag: "🇺🇦" },
  { code: "LU", name: "Luxembourg", nationality: "Luxembourgish", dialCode: "+352", flag: "🇱🇺" },
  { code: "IE", name: "Ireland", nationality: "Irish", dialCode: "+353", flag: "🇮🇪" },
  { code: "LT", name: "Lithuania", nationality: "Lithuanian", dialCode: "+370", flag: "🇱🇹" },
  { code: "LV", name: "Latvia", nationality: "Latvian", dialCode: "+371", flag: "🇱🇻" },
  { code: "EE", name: "Estonia", nationality: "Estonian", dialCode: "+372", flag: "🇪🇪" },
  { code: "CY", name: "Cyprus", nationality: "Cypriot", dialCode: "+357", flag: "🇨🇾" },
  { code: "MT", name: "Malta", nationality: "Maltese", dialCode: "+356", flag: "🇲🇹" },
  { code: "AU", name: "Australia", nationality: "Australian", dialCode: "+61", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", nationality: "New Zealander", dialCode: "+64", flag: "🇳🇿" },
  { code: "JP", name: "Japan", nationality: "Japanese", dialCode: "+81", flag: "🇯🇵" },
  { code: "CN", name: "China", nationality: "Chinese", dialCode: "+86", flag: "🇨🇳" },
  { code: "IN", name: "India", nationality: "Indian", dialCode: "+91", flag: "🇮🇳" },
  { code: "BR", name: "Brazil", nationality: "Brazilian", dialCode: "+55", flag: "🇧🇷" },
  { code: "AR", name: "Argentina", nationality: "Argentine", dialCode: "+54", flag: "🇦🇷" },
  { code: "MX", name: "Mexico", nationality: "Mexican", dialCode: "+52", flag: "🇲🇽" },
  { code: "ZA", name: "South Africa", nationality: "South African", dialCode: "+27", flag: "🇿🇦" },
  { code: "EG", name: "Egypt", nationality: "Egyptian", dialCode: "+20", flag: "🇪🇬" },
  { code: "SA", name: "Saudi Arabia", nationality: "Saudi", dialCode: "+966", flag: "🇸🇦" },
  { code: "AE", name: "United Arab Emirates", nationality: "Emirati", dialCode: "+971", flag: "🇦🇪" },
  { code: "IL", name: "Israel", nationality: "Israeli", dialCode: "+972", flag: "🇮🇱" },
  { code: "KR", name: "South Korea", nationality: "South Korean", dialCode: "+82", flag: "🇰🇷" },
  { code: "TH", name: "Thailand", nationality: "Thai", dialCode: "+66", flag: "🇹🇭" },
  { code: "SG", name: "Singapore", nationality: "Singaporean", dialCode: "+65", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", nationality: "Malaysian", dialCode: "+60", flag: "🇲🇾" },
  { code: "PH", name: "Philippines", nationality: "Filipino", dialCode: "+63", flag: "🇵🇭" },
  { code: "ID", name: "Indonesia", nationality: "Indonesian", dialCode: "+62", flag: "🇮🇩" },
  { code: "NG", name: "Nigeria", nationality: "Nigerian", dialCode: "+234", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", nationality: "Kenyan", dialCode: "+254", flag: "🇰🇪" },
  { code: "MA", name: "Morocco", nationality: "Moroccan", dialCode: "+212", flag: "🇲🇦" },
];

// ─── Cities by country ────────────────────────────────────────────────────────
// Top cities for common countries. Used to show dependent city suggestions.

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  XK: ["Pristina", "Prizren", "Peja", "Gjakova", "Mitrovica", "Gjilan", "Ferizaj", "Vushtrri", "Podujeva", "Suhareka"],
  AL: ["Tirana", "Durrës", "Vlorë", "Shkodër", "Korçë", "Fier", "Berat", "Lushnjë", "Elbasan", "Saranda"],
  MK: ["Skopje", "Bitola", "Kumanovo", "Tetovo", "Ohrid", "Veles", "Štip", "Gostivar", "Strumica", "Kičevo"],
  RS: ["Belgrade", "Novi Sad", "Niš", "Kragujevac", "Subotica", "Zrenjanin", "Pančevo", "Čačak", "Leskovac", "Novi Pazar"],
  ME: ["Podgorica", "Nikšić", "Herceg Novi", "Pljevlja", "Bijelo Polje", "Bar", "Cetinje", "Budva", "Berane"],
  BA: ["Sarajevo", "Banja Luka", "Tuzla", "Zenica", "Mostar", "Bijeljina", "Brčko", "Prijedor", "Trebinje"],
  HR: ["Zagreb", "Split", "Rijeka", "Osijek", "Zadar", "Slavonski Brod", "Pula", "Karlovac", "Dubrovnik"],
  SI: ["Ljubljana", "Maribor", "Celje", "Kranj", "Velenje", "Koper", "Novo Mesto", "Ptuj"],
  DE: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Dortmund", "Leipzig", "Essen"],
  AT: ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels", "Sankt Pölten"],
  CH: ["Zurich", "Geneva", "Basel", "Bern", "Lausanne", "Winterthur", "Lucerne", "St. Gallen"],
  GB: ["London", "Birmingham", "Manchester", "Glasgow", "Leeds", "Liverpool", "Sheffield", "Edinburgh", "Bristol", "Cardiff"],
  US: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"],
  CA: ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton"],
  FR: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille"],
  IT: ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Venice"],
  ES: ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Palma", "Las Palmas", "Bilbao"],
  PT: ["Lisbon", "Porto", "Braga", "Amadora", "Setúbal", "Coimbra", "Funchal", "Almada", "Aveiro"],
  NL: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Almere", "Breda"],
  BE: ["Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges", "Namur", "Leuven"],
  SE: ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås", "Örebro", "Linköping", "Helsingborg"],
  NO: ["Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen", "Fredrikstad", "Kristiansand"],
  DK: ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding"],
  FI: ["Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku", "Jyväskylä", "Lahti"],
  PL: ["Warsaw", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Bydgoszcz"],
  CZ: ["Prague", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "České Budějovice"],
  SK: ["Bratislava", "Košice", "Prešov", "Žilina", "Banská Bystrica", "Nitra", "Trnava"],
  HU: ["Budapest", "Debrecen", "Miskolc", "Szeged", "Pécs", "Győr", "Nyíregyháza", "Kecskemét"],
  RO: ["Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Brașov", "Craiova", "Galați"],
  BG: ["Sofia", "Plovdiv", "Varna", "Burgas", "Ruse", "Stara Zagora", "Pleven", "Sliven"],
  GR: ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa", "Volos", "Rhodes", "Ioannina"],
  TR: ["Istanbul", "Ankara", "Izmir", "Bursa", "Adana", "Gaziantep", "Konya", "Antalya"],
  RU: ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", "Nizhny Novgorod", "Chelyabinsk"],
  UA: ["Kyiv", "Kharkiv", "Dnipro", "Odesa", "Donetsk", "Zaporizhzhia", "Lviv", "Kryvyi Rih"],
  AU: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle", "Canberra"],
  JP: ["Tokyo", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto", "Kawasaki", "Yokohama"],
  IN: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur"],
  CN: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Tianjin", "Wuhan", "Hangzhou"],
  BR: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Curitiba"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah"],
};

/** Return city list for a country code, or empty array if not curated. */
export function getCitiesForCountry(countryCode: string): string[] {
  return CITIES_BY_COUNTRY[countryCode] ?? [];
}

/** Find country by name (case-insensitive). */
export function findCountryByName(name: string): Country | undefined {
  return COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase());
}

/** Find country by code. */
export function findCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

/** Find country by dial code (returns first match). */
export function findCountryByDialCode(dialCode: string): Country | undefined {
  return COUNTRIES.find(c => c.dialCode === dialCode);
}

/** Default country for this app (Kosovo). */
export const DEFAULT_COUNTRY: Country = COUNTRIES[0];
