-- Aanwezigheidsstatus op de dag zelf (los van de betaalstatus in `status`):
-- ingecheckt, no show, geannuleerd of verplaatst. Admin-only, zichtbaar als
-- gekleurde knoppen op de deelnemerskaart.
alter table bookings add column checkin_status text
  check (checkin_status in ('checked_in','no_show','cancelled','moved'));
