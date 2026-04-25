-- Migration: Albanian content seed
-- 1. Add language column to faq_items
-- 2. Seed Albanian legal pages (slug-al pattern)
-- 3. Seed Albanian FAQ items
-- 4. Seed Albanian homepage SiteSettings (_al suffix keys)

-- ── 1. FaqItem language column ─────────────────────────────────────────────

ALTER TABLE "faq_items" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'en';
CREATE INDEX IF NOT EXISTS "faq_items_language_isActive_idx" ON "faq_items"("language", "isActive");

-- ── 2. Albanian legal pages ───────────────────────────────────────────────────

INSERT INTO "legal_pages" ("id", "slug", "title", "content", "updatedAt")
VALUES (
  'legal-privacy-al',
  'privacy-policy-al',
  'Politika e Privatësisë',
  E'# Politika e Privatësisë\n\nAutoKos respekton privatësinë e çdo klienti dhe angazhohet për mbrojtjen e të dhënave personale në përputhje me Ligjin nr. 06/L-082 për Mbrojtjen e të Dhënave Personale të Kosovës (LPPD), si dhe rregulloret aplikueshme evropiane.\n\nKjo politikë shpjegon se cilat të dhëna mbledhim, si i përdorim, si i mbrojmë dhe cilat janë të drejtat tuaja.\n\n## Të Dhënat që Mbledhim\n\nKur rezervoni ose kontaktoni me ne, mbledhim:\n\n- **Të dhëna identifikimi:** emri, mbiemri, numri i pasaportës ose letërnjoftimit, numri i patentë shoferit\n- **Të dhëna kontakti:** adresa e emailit, numri i telefonit\n- **Të dhëna financiare:** informacioni i kartës bankare përpunohet me siguri nëpërmjet Stripe — ne nuk ruajmë numrat e plotë të kartave\n- **Të dhëna rezervimi:** datat, automjeti i zgjedhur, vendndodhja e marrjes dhe kthimit\n- **Të dhëna teknike:** adresa IP, lloji i shfletuesit, faqet e vizituara — vetëm për qëllime sigurie dhe diagnostike\n\n## Si i Përdorim të Dhënat\n\nTë dhënat tuaja i përdorim për:\n\n- Përpunimin dhe menaxhimin e rezervimeve\n- Komunikimin me ju rreth shërbimeve tona\n- Plotësimin e detyrimeve ligjore dhe kontraktuale\n- Parandalimin e mashtrimit dhe sigurimin e transaksioneve\n- Përmirësimin e vazhdueshëm të shërbimeve tona\n\n**Ne nuk i shesim dhe nuk u japim të dhënat tuaja palëve të treta** për qëllime marketingu pa lejen tuaj.\n\n## Ndarja me Palë të Treta\n\nNdajmë të dhënat tuaja vetëm me:\n\n- **Stripe** — për përpunimin e pagesave (politika e tyre: stripe.com/privacy)\n- **Ofrues emaili** — për dërgimin e konfirmimeve dhe njoftimeve\n- **Autoritete ligjore** — vetëm kur kërkohet me ligj ose urdhër gjykate\n\n## Siguria e të Dhënave\n\nZbatojmë masa teknike dhe organizative të duhura për mbrojtjen e të dhënave tuaja, duke përfshirë enkriptimin SSL/TLS, kontrollet e aksesit dhe monitorimin e sistemit.\n\n## Kohëzgjatja e Ruajtjes\n\n- **Të dhënat e rezervimit:** 7 vjet (detyrim ligjor tatimor)\n- **Të dhënat e llogarisë:** deri sa të fshini llogarinë\n- **Logs teknikë:** 90 ditë\n\n## Të Drejtat Tuaja\n\nNë bazë të legjislacionit kosovar, ju keni të drejtë:\n\n- **Aksesi** — të kërkoni kopje të të dhënave tuaja\n- **Korrigjimit** — të kërkoni korrigjimin e të dhënave të pasakta\n- **Fshirjes** — të kërkoni fshirjen e të dhënave\n- **Kundërshtimit** — të kundërshtoni përpunimin e të dhënave tuaja\n- **Portabilitetit** — të merrni të dhënat tuaja në format të lexueshëm\n\nPër të ushtruar këto të drejta, na kontaktoni me email.\n\n## Cookies\n\nFaqja jonë përdor cookies minimale funksionale: preferencën e gjuhës dhe sesionin e autentifikimit. Nuk përdorim cookies reklamuese ose gjurmues të palëve të treta.\n\n## Ndryshimet në Politikë\n\nMund ta përditësojmë këtë politikë herë pas here. Çdo ndryshim material do t''ju njoftojmë me email ose njoftim në faqe.\n\n## Na Kontaktoni\n\nPër çdo pyetje rreth privatësisë suaj, na shkruani me email ose na kontaktoni nëpërmjet WhatsApp.',
  NOW()
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "legal_pages" ("id", "slug", "title", "content", "updatedAt")
VALUES (
  'legal-terms-al',
  'terms-and-conditions-al',
  'Kushtet dhe Rregullat',
  E'# Kushtet dhe Rregullat\n\n## 1. Palët Kontraktuese\n\nKëto kushte rregullojnë marrëdhënien kontraktuale ndërmjet **AutoKos** dhe **klientit** që rezervon ose merr me qira automjetin. Rezervimi ose marrja e automjetit nënkupton pranim të plotë të këtyre kushteve.\n\n## 2. Kushtet e Kualifikimit\n\nPër të marrë me qira automjet nga AutoKos duhet të:\n\n- Jeni të paktën **21 vjeç** (mosha minimale varion sipas kategorisë)\n- Keni **patentë shoferi të vlefshme** me të paktën 1 vit eksperiencë drejtimi\n- Paraqitni **dokument të vlefshëm identifikimi** — pasaportë ose letërnjoftim\n- Jeni titullar ose të autorizuar për kartën bankare të përdorur për depozitën\n\n## 3. Rezervimi dhe Konfirmimi\n\nRezervimet bëhen online dhe konfirmohen pas marrjes së emailit të konfirmimit. AutoKos rezervon të drejtën të anulojë rezervimet nëse klienti nuk plotëson kushtet e kualifikimit.\n\n## 4. Pagesat dhe Tarifat\n\n- **Pagesa online** bëhet me kartë bankare nëpërmjet Stripe\n- **TVSH-ja 18%** është e përfshirë në çmimin përfundimtar — pa kosto të fshehura\n- **Depozita** mbahet si autorizim bankare dhe lirohet pas kthimit të automjetit pa dëme\n- **Tarifat shtesë** aplikohen për kilometra shtesë, dëme, karburant të mangët ose kthim me vonesë\n\n## 5. Marrja dhe Kthimi\n\n- Automjeti merret dhe kthehet **sipas datave dhe orëve të konfirmuara**\n- Vonesa mbi 2 orë gjatë marrjes pa njoftim mund të çojë në anulim\n- Automjeti kthehet **me po aq karburant** sa ishte gjatë marrjes\n- Kontrolloni automjetin bashkë me agjentin gjatë marrjes dhe shënoni çdo dëmtim ekzistues\n\n## 6. Kufizimet e Kilometrazhit\n\nDisa automjete kanë kufizim të kilometrazhit ditor. Çdo kilometër shtesë tarifon sipas çmimit të specifikuar në kontratë.\n\n## 7. Territoret e Lejuara\n\nAutomjetet lejohen të përdoren **brenda territorit të Kosovës dhe vendeve të Ballkanit Perëndimor** të specifikuara në kontratë. Çdo udhëtim ndërkombëtar jashtë kufijve të lejuar kërkon autorizim paraprak me shkrim.\n\n## 8. Ndalimet\n\nJanë rreptësishtë të ndaluara:\n\n- Drejtimi nën ndikimin e alkoolit ose substancave narkotike\n- Nënqiraja ose huazimi i automjetit tek persona të tretë\n- Pjesëmarrja në gara ose aktivitete jashtë rrugore\n- Transporti i mallrave të paligjshme\n- Pirja e duhanit brenda automjetit\n\n## 9. Dëmet dhe Sigurimi\n\nKlienti mban **përgjegjësi financiare** për dëmet e shkaktuara gjatë periudhës së qirasë, sipas kufijve të paketës së sigurimit. Dëmet e shkaktuara nga pakujdesia ose shkelja e kushteve anulojnë mbrojtjen e sigurimit.\n\n## 10. Anulimi dhe Rimbursimi\n\n- **Anulim 48+ orë para marrjes:** rimbursim i plotë\n- **Anulim 24–48 orë para marrjes:** rimbursim 50%\n- **Anulim nën 24 orë:** pa rimbursim\n\n## 11. Ligji i Aplikueshëm\n\nKëto kushte rregullohen nga ligji i Kosovës. Mosmarrëveshjet trajtohen nga gjykatat kompetente të Prishtinës.\n\n## 12. Na Kontaktoni\n\nPër pyetje rreth kushteve, na kontaktoni me email ose nëpërmjet WhatsApp.',
  NOW()
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "legal_pages" ("id", "slug", "title", "content", "updatedAt")
VALUES (
  'legal-rental-policy-al',
  'rental-policy-al',
  'Politika e Qirasë',
  E'# Politika e Qirasë\n\n## 1. Mosha Minimale\n\n- Kategoritë standarde (Ekonomike, Kompakte, SUV): **21 vjeç**\n- Automjete luksoz ose të kategorive premium: **25 vjeç**\n\n## 2. Patenta e Shoferit\n\n- Patentë e vlefshme me të paktën **1 vit eksperiencë drejtimi**\n- Patenta ndërkombëtare rekomandohet për klientët nga jashtë Kosovës\n- Patenta duhet të jetë e vlefshme gjatë gjithë periudhës së qirasë\n\n## 3. Dokumentat e Nevojshme\n\nGjatë marrjes duhet të paraqisni:\n\n- Pasaportë ose letërnjoftim të vlefshëm\n- Patentë shoferi të vlefshme\n- Kartë bankare në emrin tuaj për depozitën\n\n## 4. Depozita\n\nDepozita mbahet si autorizim bankare (pre-autorizim) dhe lirohet brenda **5–10 ditëve pune** pas kthimit të automjetit pa dëme.\n\nShuma e depozitës sipas kategorisë:\n\n| Kategoria | Depozita |\n|---|---|\n| Ekonomike / Kompakte | €200 |\n| SUV / MPV | €300 |\n| Luksoz | €500+ |\n\n## 5. Karburanti\n\nAutoKos aplikon politikën **full-to-full**:\n\n- Automjeti ju dorëzohet me rezervuar plot\n- Duhet ta ktheni me rezervuar plot\n- Kthim me karburant të mangët: tarifa rimbushje + tarife shërbimi\n\n## 6. Kilometrazhi\n\nÇdo rezervim specifikon kufizimin e kilometrazhit ditor (nëse aplikohet). Kilometrat shtesë tarifohen sipas çmimit të kontratës.\n\n## 7. Oraret dhe Vonesa\n\n- **Grace period:** 30 minuta nga ora e konfirmuar\n- **Vonesa:** tarifohet si ditë shtesë ose orë shtesë sipas tarifave aktuale\n- Njoftoni paraprakisht nëse prisni vonesë gjatë marrjes\n\n## 8. Inspektimi i Automjetit\n\nGjatë marrjes shënohen me shkrim dhe foto të gjitha dëmtimet ekzistuese. Çdo dëmtim i ri gjatë periudhës suaj depozitohet kundrejt depozitës.\n\n## 9. Pastrimi\n\nAutomjeti duhet kthyer i pastër. Tarifa pastrimi aplikohet nëse kthehet me ndotje mbi normalen.\n\n## 10. Aksidentet dhe Emergjencat\n\nNë rast aksidenti:\n\n- Sigurohuni për sigurinë e të gjithëve\n- Njoftoni policinë (numri: 192)\n- Kontaktoni AutoKos menjëherë — numri 24/7 disponibël\n- Mos pranoni faj para deklaratës zyrtare\n\nAutoKos ofron asistencë rrugore 24/7 gjatë gjithë periudhës së qirasë.',
  NOW()
)
ON CONFLICT ("slug") DO NOTHING;

-- ── 3. Albanian FAQ items ──────────────────────────────────────────────────────

INSERT INTO "faq_items" ("id", "question", "answer", "category", "language", "isActive", "sortOrder") VALUES
  ('faq-al-gen-1', 'Çfarë dokumentesh duhen për të marrë me qira një makinë?', 'Duhet pasaportë ose letërnjoftim i vlefshëm, patentë shoferi me të paktën 1 vit eksperiencë dhe kartë bankare në emrin tuaj për depozitën. Klientët ndërkombëtarë rekomandohet të kenë edhe patentë ndërkombëtare.', 'general', 'al', true, 10),
  ('faq-al-gen-2', 'Cila është mosha minimale për të marrë me qira makinë?', 'Mosha minimale është 21 vjeç për shumicën e kategorive. Për automjete luksoz ose të kategorive premium kërkohen 25 vjeç. Na kontaktoni paraprakisht nëse keni pyetje për kategorinë specifike.', 'general', 'al', true, 20),
  ('faq-al-gen-3', 'A mund ta marr makinën nga aeroporti i Prishtinës?', 'Po, ofrojmë shërbim direkt në Aeroportin Ndërkombëtar Adem Jashari të Prishtinës. Agjenti ynë do t''ju presë në sallën e mbërrjeve me tabelë me emrin tuaj. Tarifë shtesë aeroporti aplikohet — shihni faqen tonë për detaje.', 'general', 'al', true, 30),
  ('faq-al-booking-1', 'Si funksionon procesi i rezervimit?', 'Rezervimi është plotësisht online. Zgjidhni makinën, datat dhe vendin e marrjes, plotësoni të dhënat personale dhe paguani. Konfirmimi vjen menjëherë me email. I gjithë procesi zgjat rreth 5 minuta.', 'booking', 'al', true, 10),
  ('faq-al-booking-2', 'A mund ta ndryshoj ose anulem rezervimin?', 'Po. Anulim mbi 48 orë para marrjes — rimbursim i plotë. Anulim 24–48 orë — rimbursim 50%. Nën 24 orë — pa rimbursim. Na kontaktoni nëpërmjet emailit ose WhatsApp-it për ndryshime.', 'booking', 'al', true, 20),
  ('faq-al-booking-3', 'A pranohet pagesa me para cash?', 'Pagesat online bëhen me kartë bankare nëpërmjet Stripe. Rezervimet në terren mund të paguhen cash, por depozita kërkohet gjithmonë me kartë bankare.', 'booking', 'al', true, 30),
  ('faq-al-payment-1', 'Çfarë është depozita dhe kur lirohet?', 'Depozita është autorizim bankare — jo pagesë reale. Mbahet si garanci gjatë qirasë dhe lirohet brenda 5–10 ditëve pune pas kthimit të automjetit pa dëme. Shuma varion nga €200 deri €500+ sipas kategorisë.', 'payment', 'al', true, 10),
  ('faq-al-payment-2', 'A është TVSH-ja e përfshirë në çmim?', 'Po, çmimi final përfshin TVSH-në 18% sipas legjislacionit kosovar. Asnjë kosto e fshehur nuk shtohet pas konfirmimit — çmimi i parë është çmimi i fundit.', 'payment', 'al', true, 20),
  ('faq-al-ins-1', 'Çfarë sigurimi përfshihet në qira?', 'Çdo automjet vjen me sigurim bazë TPL (dëmtim ndaj palëve të treta). Ofrojmë gjithashtu mbrojtje Collision Damage Waiver (CDW) dhe Theft Protection me zbritje të ndryshme. Detajet e plota gjenden në faqen tonë të sigurimit.', 'insurance', 'al', true, 10),
  ('faq-al-ins-2', 'Çfarë ndodh nëse ndodhë aksident?', 'Sigurohuni që të gjithë janë mirë, njoftoni policinë (192) dhe kontaktoni AutoKos menjëherë. Mos pranoni faj para deklaratës zyrtare. Ne jemi 24/7 në dispozicion tuajin për asistencë rrugore dhe administrative.', 'insurance', 'al', true, 20),
  ('faq-al-vehicles-1', 'Cilat kategori makinash keni?', 'Kemi kategori të ndryshme: Ekonomike, Kompakte, SUV, MPV, Luksoz dhe Van. Të gjitha mund t''i shfletoni dhe filtroni sipas nevojave dhe buxhetit tuaj. Flota përditësohet rregullisht me automjete të reja.', 'vehicles', 'al', true, 10),
  ('faq-al-vehicles-2', 'A janë automjetet të sigurta dhe teknike?', 'Po, flota jonë mirëmbahet rregullisht sipas standardeve të prodhuesit. Çdo automjet kontrollohet para çdo qiraje. Gjatë marrjes ju dorëzojmë automjetin të pastër, me karburant plot dhe dokumentacionin e plotë.', 'vehicles', 'al', true, 20),
  ('faq-al-cancel-1', 'Sa kohë para marrjes mund ta anulem?', 'Anulim 48+ orë para marrjes rimbursim i plotë. 24–48 orë rimbursim 50%. Nën 24 orë pa rimbursim. Anulimet bëhen nëpërmjet llogarisë suaj ose duke na kontaktuar direkt.', 'cancellation', 'al', true, 10),
  ('faq-al-cancel-2', 'Çfarë ndodh nëse vonohem gjatë marrjes?', 'Kemi grace period prej 30 minutash. Nëse pritni vonesë, njoftoni paraprakisht — na kontaktoni nëpërmjet WhatsApp. Vonesa mbi 2 orë pa njoftim mund të çojë në anulim të rezervimit.', 'cancellation', 'al', true, 20)
ON CONFLICT ("id") DO NOTHING;

-- ── 4. Albanian homepage SiteSettings (_al suffix keys) ────────────────────

INSERT INTO "site_settings" ("id", "key", "value", "group", "label", "type", "updatedAt") VALUES
  ('ss-al-why-title',    'why_title_al',    'Pse të Zgjidhni AutoKos?', 'homepage', 'Why title (AL)', 'text', NOW()),
  ('ss-al-why-sub',      'why_subtitle_al', 'Nuk jemi thjesht shërbim qiraje — jemi partneri juaj i besuar për çdo udhëtim nëpër Kosovë dhe rajon.', 'homepage', 'Why subtitle (AL)', 'textarea', NOW()),
  ('ss-al-why-1-t',      'why_1_title_al',  'Siguri dhe Besueshmëri', 'homepage', 'Why 1 title (AL)', 'text', NOW()),
  ('ss-al-why-1-b',      'why_1_body_al',   'Flota jonë e mirëmbajtur, sigurimi gjithëpërfshirës dhe ekipi profesional garantojnë eksperiencë pa shqetësime.', 'homepage', 'Why 1 body (AL)', 'textarea', NOW()),
  ('ss-al-why-2-t',      'why_2_title_al',  'Disponibël 24/7', 'homepage', 'Why 2 title (AL)', 'text', NOW()),
  ('ss-al-why-2-b',      'why_2_body_al',   'Shërbimi ynë i klientit dhe asistenca rrugore janë aktive 24 orë në ditë, 7 ditë në javë.', 'homepage', 'Why 2 body (AL)', 'textarea', NOW()),
  ('ss-al-why-3-t',      'why_3_title_al',  'Çmime Transparente', 'homepage', 'Why 3 title (AL)', 'text', NOW()),
  ('ss-al-why-3-b',      'why_3_body_al',   'Pa kosto të fshehura, pa surpriza. Çmimi që shihni është çmimi që paguani — TVSH 18% e përfshirë.', 'homepage', 'Why 3 body (AL)', 'textarea', NOW()),
  ('ss-al-why-4-t',      'why_4_title_al',  'Vendosje Strategjike', 'homepage', 'Why 4 title (AL)', 'text', NOW()),
  ('ss-al-why-4-b',      'why_4_body_al',   'Shërbim aeroporti, dërgesa në hotel dhe vendosje nëpër qytetet kryesore të Kosovës.', 'homepage', 'Why 4 body (AL)', 'textarea', NOW()),
  ('ss-al-why-5-t',      'why_5_title_al',  'Mijëra Klientë të Kënaqur', 'homepage', 'Why 5 title (AL)', 'text', NOW()),
  ('ss-al-why-5-b',      'why_5_body_al',   'Vlerësime të shkëlqyera dhe besim i ndërtuar nga çdo udhëtim — reputacioni ynë flet vetë.', 'homepage', 'Why 5 body (AL)', 'textarea', NOW()),
  ('ss-al-why-6-t',      'why_6_title_al',  'Mbështetje e Personalizuar', 'homepage', 'Why 6 title (AL)', 'text', NOW()),
  ('ss-al-why-6-b',      'why_6_body_al',   'Ekipi ynë ju ndihmon të zgjidhni automjetin e duhur dhe t''i planifikoni udhëtimet me lehtësi.', 'homepage', 'Why 6 body (AL)', 'textarea', NOW()),
  ('ss-al-how-title',    'how_title_al',    'Si Funksionon', 'homepage', 'How title (AL)', 'text', NOW()),
  ('ss-al-how-sub',      'how_subtitle_al', 'Marrja me qira e makinës me AutoKos është e thjeshtë, e shpejtë dhe pa stres.', 'homepage', 'How subtitle (AL)', 'textarea', NOW()),
  ('ss-al-how-1-t',      'how_1_title_al',  'Kërkoni dhe Zgjidhni', 'homepage', 'How 1 title (AL)', 'text', NOW()),
  ('ss-al-how-1-b',      'how_1_body_al',   'Shfletoni flotën tonë online, filtroni sipas kategorisë dhe buxhetit, dhe zgjidhni makinën e përshtatshme.', 'homepage', 'How 1 body (AL)', 'textarea', NOW()),
  ('ss-al-how-2-t',      'how_2_title_al',  'Rezervoni Online', 'homepage', 'How 2 title (AL)', 'text', NOW()),
  ('ss-al-how-2-b',      'how_2_body_al',   'Plotësoni të dhënat tuaja, zgjidhni datën dhe vendin e marrjes dhe paguani me siguri. Konfirmimi vjen menjëherë.', 'homepage', 'How 2 body (AL)', 'textarea', NOW()),
  ('ss-al-how-3-t',      'how_3_title_al',  'Merrni Makinën', 'homepage', 'How 3 title (AL)', 'text', NOW()),
  ('ss-al-how-3-b',      'how_3_body_al',   'Takohuni me ekipin tonë në pikën e marrjes — inspektoni makinën bashkë dhe nënshkruani kontratën.', 'homepage', 'How 3 body (AL)', 'textarea', NOW()),
  ('ss-al-how-4-t',      'how_4_title_al',  'Udhëtoni me Liri', 'homepage', 'How 4 title (AL)', 'text', NOW()),
  ('ss-al-how-4-b',      'how_4_body_al',   'Eksploroni Kosovën dhe rajonin me liri të plotë. Ekipi ynë është gjithmonë i disponueshëm nëse keni nevojë.', 'homepage', 'How 4 body (AL)', 'textarea', NOW()),
  ('ss-al-feat-t',       'featured_cars_title_al',    'Automjetet e Rekomanduara', 'homepage', 'Featured cars title (AL)', 'text', NOW()),
  ('ss-al-feat-s',       'featured_cars_subtitle_al', 'Automjetet tona më të kërkuara, të zgjedhura nga mijëra klientë', 'homepage', 'Featured cars subtitle (AL)', 'textarea', NOW()),
  ('ss-al-air-t',        'airport_title_al',       'Arrini. Merrni Çelësat. Eksploroni.', 'homepage', 'Airport title (AL)', 'text', NOW()),
  ('ss-al-air-d',        'airport_description_al',  'Ofrojmë shërbim direkt meet & greet në Aeroportin Ndërkombëtar Adem Jashari të Prishtinës. Agjenti ynë do t''ju presë në sallën e mbërrjeve me tabelë me emrin tuaj — pa kërkim, pa pritje, pa stres.', 'homepage', 'Airport description (AL)', 'textarea', NOW()),
  ('ss-al-air-fee',      'airport_fee_al',         '€15 (marrje ose kthim)', 'homepage', 'Airport fee (AL)', 'text', NOW()),
  ('ss-al-air-meet',     'airport_meet_greet_fee_al', '+€20 (sallë mbërrjesh)', 'homepage', 'Airport meet greet (AL)', 'text', NOW()),
  ('ss-al-cta-t',        'contact_cta_title_al',       'Gati për Rrugën?', 'homepage', 'CTA title (AL)', 'text', NOW()),
  ('ss-al-cta-d',        'contact_cta_description_al', 'Rezervoni online në minuta ose na kontaktoni — jemi gjithmonë të lumtur t''ju ndihmojmë të gjeni makinën e duhur.', 'homepage', 'CTA description (AL)', 'textarea', NOW()),
  ('ss-al-cta-wa',       'contact_cta_whatsapp_message_al', 'Mirëdita! Dëshiroj të marr me qira një makinë me AutoKos.', 'homepage', 'CTA WhatsApp message (AL)', 'text', NOW()),
  ('ss-al-test-t',       'testimonials_title_al', 'Çfarë Thonë Klientët Tanë', 'homepage', 'Testimonials title (AL)', 'text', NOW()),
  ('ss-al-offers-t',     'offers_title_al',       'Ofertat dhe Promocionet Aktuale', 'homepage', 'Offers title (AL)', 'text', NOW())
ON CONFLICT ("key") DO NOTHING;
