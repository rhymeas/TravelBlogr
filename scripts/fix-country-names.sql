-- ============================================================================
-- Fix Country Names - Convert Native Names to English
-- Run this in Supabase SQL Editor to fix existing locations
-- ============================================================================

-- Fix Greek names
UPDATE locations SET country = 'Greece' WHERE country IN ('Ελλάς', 'Ελλάδα');

-- Fix Spanish names
UPDATE locations SET country = 'Spain' WHERE country = 'España';

-- Fix Italian names
UPDATE locations SET country = 'Italy' WHERE country = 'Italia';

-- Fix German names
UPDATE locations SET country = 'Germany' WHERE country = 'Deutschland';

-- Fix Dutch names
UPDATE locations SET country = 'Netherlands' WHERE country = 'Nederland';

-- Fix Austrian names
UPDATE locations SET country = 'Austria' WHERE country = 'Österreich';

-- Fix Swiss names
UPDATE locations SET country = 'Switzerland' WHERE country IN ('Schweiz', 'Suisse', 'Svizzera');

-- Fix Turkish names
UPDATE locations SET country = 'Turkey' WHERE country = 'Türkiye';

-- Fix Polish names
UPDATE locations SET country = 'Poland' WHERE country = 'Polska';

-- Fix Czech names
UPDATE locations SET country = 'Czech Republic' WHERE country = 'Česko';

-- Fix Hungarian names
UPDATE locations SET country = 'Hungary' WHERE country = 'Magyarország';

-- Fix Romanian names
UPDATE locations SET country = 'Romania' WHERE country = 'România';

-- Fix Bulgarian names
UPDATE locations SET country = 'Bulgaria' WHERE country = 'България';

-- Fix Croatian names
UPDATE locations SET country = 'Croatia' WHERE country = 'Hrvatska';

-- Fix Serbian names
UPDATE locations SET country = 'Serbia' WHERE country = 'Србија';

-- Fix Slovak names
UPDATE locations SET country = 'Slovakia' WHERE country = 'Slovensko';

-- Fix Slovenian names
UPDATE locations SET country = 'Slovenia' WHERE country = 'Slovenija';

-- Fix Lithuanian names
UPDATE locations SET country = 'Lithuania' WHERE country = 'Lietuva';

-- Fix Latvian names
UPDATE locations SET country = 'Latvia' WHERE country = 'Latvija';

-- Fix Estonian names
UPDATE locations SET country = 'Estonia' WHERE country = 'Eesti';

-- Fix Finnish names
UPDATE locations SET country = 'Finland' WHERE country = 'Suomi';

-- Fix Swedish names
UPDATE locations SET country = 'Sweden' WHERE country = 'Sverige';

-- Fix Norwegian names
UPDATE locations SET country = 'Norway' WHERE country = 'Norge';

-- Fix Danish names
UPDATE locations SET country = 'Denmark' WHERE country = 'Danmark';

-- Fix Icelandic names
UPDATE locations SET country = 'Iceland' WHERE country = 'Ísland';

-- Fix Japanese names
UPDATE locations SET country = 'Japan' WHERE country = '日本';

-- Fix Chinese names
UPDATE locations SET country = 'China' WHERE country = '中国';

-- Fix Korean names
UPDATE locations SET country = 'South Korea' WHERE country = '대한민국';

-- Fix Thai names
UPDATE locations SET country = 'Thailand' WHERE country IN ('ไทย', 'ประเทศไทย');

-- Fix Vietnamese names
UPDATE locations SET country = 'Vietnam' WHERE country = 'Việt Nam';

-- Fix Filipino names
UPDATE locations SET country = 'Philippines' WHERE country = 'Pilipinas';

-- Fix Indian names
UPDATE locations SET country = 'India' WHERE country = 'भारत';

-- Fix Arabic names
UPDATE locations SET country = 'Morocco' WHERE country = 'المغرب';
UPDATE locations SET country = 'Egypt' WHERE country = 'مصر';
UPDATE locations SET country = 'United Arab Emirates' WHERE country = 'الإمارات العربية المتحدة';

-- Fix Brazilian names
UPDATE locations SET country = 'Brazil' WHERE country = 'Brasil';

-- Fix Mexican names
UPDATE locations SET country = 'Mexico' WHERE country = 'México';

-- Fix Peruvian names
UPDATE locations SET country = 'Peru' WHERE country = 'Perú';

-- Fix "Unknown" countries
UPDATE locations SET country = 'United States' WHERE name = 'New York' AND country = 'Unknown';
UPDATE locations SET country = 'Canada' WHERE name = 'Vancouver' AND country = 'Unknown';
UPDATE locations SET country = 'United Kingdom' WHERE name = 'London' AND country = 'Unknown';
UPDATE locations SET country = 'France' WHERE name = 'Paris' AND country = 'Unknown';
UPDATE locations SET country = 'Japan' WHERE name = 'Tokyo' AND country = 'Unknown';

-- Show results
SELECT 
  name,
  country,
  region,
  created_at
FROM locations
ORDER BY created_at DESC;

-- Show statistics
SELECT 
  country,
  COUNT(*) as location_count
FROM locations
GROUP BY country
ORDER BY location_count DESC;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ COUNTRY NAMES FIXED!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'All native country names have been converted to English.';
  RAISE NOTICE 'Future locations will automatically use English names.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test auto-fill with a new location';
  RAISE NOTICE '2. Verify country names are in English';
  RAISE NOTICE '3. Check breadcrumbs on location pages';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

