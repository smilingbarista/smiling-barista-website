-- Cursuscatalogus: 4 lijnen (Specialty, Barista, Latte Art, Slow Brew).
-- Waar de huidige site al een workshop had, is de id/naam/prijs zoveel
-- mogelijk behouden (latte-art-1, latte-art-2, brewing→slow-brew-1);
-- de rest is nieuw, ter aanvulling naar de volledige 9-cursus catalogus.
insert into workshops (id, name, short_name, description, bullets, price, duration_label, max_spots, color, track, level, sort_order) values

('specialty-coffee', 'Specialty Coffee: Taste & Origin', 'Specialty Coffee',
 'Van kers tot boon, en hoe herkomst en verwerking de smaak bepalen. Een echte cupping-sessie zoals vakmensen doen, geen voorkennis nodig.',
 E'Van kers tot boon: het hele proces\nEen echte cupping zoals vakmensen doen\nDe vijf basissmaken leren herkennen\nProeverij van verschillende origins',
 59, '2,5 uur', 10, '#2E7D9F', 'specialty', null, 0),

('barista-1', 'Barista Beginnings', 'Barista L1',
 'De basis: hoe stel je je molen in voor een gebalanceerde extractie, hoe zet je een espresso die klopt, en hoe schuim je melk op voor je eerste latte art.',
 E'Molen instellen voor een gebalanceerde extractie\nEen espresso zetten die klopt, keer op keer\nMelk opschuimen en je eerste hartje gieten\nOefenen op echte machines',
 99, '3 uur', 8, '#00508C', 'barista', 1, 10),

('barista-2', 'Espresso Technique', 'Barista L2',
 'Je kent de basis, nu verdiepen we: de extractietheorie achter een goede shot, channeling herkennen en vermijden, en je shot bijsturen op smaak.',
 E'De extractietheorie achter een goede shot\nChanneling herkennen en vermijden\nJe shot bijsturen op smaak, niet op een timer\nVereist Barista Beginnings',
 99, '3 uur', 8, '#00508C', 'barista', 2, 11),

('barista-3', 'Espresso Masterclass', 'Barista L3',
 'Je eigen recept ontwikkelen, geavanceerde extractietechnieken, en een shot leren verdedigen op basis van smaak. Komt enkele keren per jaar aan bod.',
 E'Je eigen recept ontwikkelen\nGeavanceerde extractietechnieken\nEen shot verdedigen op basis van smaak\nVereist Espresso Technique',
 199, '3 uur', 6, '#00508C', 'barista', 3, 12),

('latte-art-1', 'Latte Art Level 1 — Sweet Hearts', 'Latte Art L1',
 'We beginnen bij het begin: hoe werkt een espressomachine, hoe schuim je melk op en hoe zet je een cappuccino? Je leert een hartje tekenen.',
 E'Melk opschuimen als een pro\nHartje, rozet en tulp tekenen\nEspresso-extractie begrijpen\nOefenen op echte machines',
 99, '2,5 uur', 8, '#0366C5', 'latte-art', 1, 20),

('latte-art-2', 'Latte Art Level 2 — Flower Power', 'Latte Art L2',
 'Rozetten en tulpen gieten, stap voor stap. Je pitcher precies onder controle, met aandacht voor contrast en symmetrie in je patroon.',
 E'Rozetten en tulpen gieten, stap voor stap\nJe pitcher precies onder controle\nContrast en symmetrie in je patroon\nVereist Sweet Hearts',
 99, '3,5 uur', 6, '#0366C5', 'latte-art', 2, 21),

('latte-art-3', 'Latte Art Masterclass — Swan Master', 'Latte Art L3',
 'Zwaantjes, zeepaardjes, phoenix en konijntjes. Gelaagde hartjes en complexe figuren, begeleid door een tweevoudig NL kampioen.',
 E'Zwaantjes, zeepaardjes, phoenix en konijntjes\nGelaagde hartjes en complexe figuren\nBegeleid door een tweevoudig NL kampioen\nVereist Flower Power',
 199, '3,5 uur', 6, '#001E35', 'latte-art', 3, 22),

('slow-brew-1', 'Slow Brew Beginnings', 'Slow Brew L1',
 'Filterkoffie kent een wereld op zichzelf. We verkennen de V60, French Press en Chemex, en hoe malen, watertemperatuur en giettechniek de smaak bepalen.',
 E'V60, Aeropress, Chemex, French Press\nDe juiste koffie-waterverhouding\nCold brew zetten\nSmaakproeverij',
 99, '2 uur', 10, '#2E7D9F', 'slow-brew', 1, 30),

('slow-brew-2', 'Slow Brew Masterclass', 'Slow Brew L2',
 'Zeldzame en single-origin koffies zetten, je zetmethode afstemmen op de oorsprong, en verschillende brewers met elkaar vergelijken.',
 E'Zeldzame en single-origin koffies zetten\nJe zetmethode afstemmen op de oorsprong\nVerschillende brewers vergelijken\nVereist Slow Brew Beginnings',
 199, '3 uur', 8, '#001E35', 'slow-brew', 2, 31);
