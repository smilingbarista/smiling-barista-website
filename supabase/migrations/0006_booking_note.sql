-- Vrij invulveld "extra info" dat een klant kan meegeven bij het boeken
-- (bv. allergieën, speciale wensen) — zichtbaar op de deelnemerskaart.
alter table bookings add column customer_note text;
