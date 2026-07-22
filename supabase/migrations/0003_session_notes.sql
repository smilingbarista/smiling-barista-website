-- Interne notitie per sessie (bv. "privégroep", "speciale locatie") — was
-- er al in de oude localStorage-versie, hier alsnog toegevoegd zodat die
-- functionaliteit niet verloren gaat bij de overstap.
alter table workshop_sessions add column notes text;
