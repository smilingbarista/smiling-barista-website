-- Extra info die de admin kan invullen bij het handmatig toevoegen van een
-- deelnemer: nieuwsbriefvoorkeur en welke workshoptypes deze persoon al
-- eerder volgde (los van de effectieve boekingshistoriek — admin-ingevoerd).
alter table bookings add column newsletter boolean not null default false;
alter table bookings add column previous_workshops text[];
