-- Volgt welke automatische e-mails/sms al verstuurd zijn per boeking, zodat
-- de dagelijkse cron-job (api/cron/send-reminders.js) nooit een dubbele
-- herinnering stuurt. sms_opt_in laat de klant zelf kiezen of die een
-- sms-herinnering wil (enkel zinvol als er een telefoonnummer is).
alter table bookings add column sms_opt_in boolean not null default false;
alter table bookings add column email_confirmation_sent_at timestamptz;
alter table bookings add column email_week_reminder_sent_at timestamptz;
alter table bookings add column email_48h_reminder_sent_at timestamptz;
alter table bookings add column sms_reminder_sent_at timestamptz;
