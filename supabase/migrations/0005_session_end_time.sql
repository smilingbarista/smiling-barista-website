-- Eindtijd per sessie (optioneel) — laat toe om de duur van een specifieke
-- sessie te tonen op de website (bv. "09:30 – 12:30 · 3 uur") in plaats van
-- enkel de statische duration_label op het workshoptype zelf.
alter table workshop_sessions add column end_time text;
