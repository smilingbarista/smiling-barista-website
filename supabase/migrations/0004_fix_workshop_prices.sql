-- 0002 seeded two prijzen/capaciteiten die niet overeenkwamen met het
-- ontwerp (Latte Art L2 en Slow Brew L1). Corrigeert de al-ingevoerde rijen.
update workshops set price = 99 where id = 'latte-art-2';
update workshops set price = 99, max_spots = 10 where id = 'slow-brew-1';
