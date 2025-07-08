-- === VÉRIFICATIONS DE COHÉRENCE ===

-- 1. Actifs sans valuations
SELECT 'Actifs sans valuations' as check_type, COUNT(*) as count
FROM "Asset" a 
LEFT JOIN "AssetValuation" av ON a.id = av."assetId"
WHERE av.id IS NULL;

-- 2. Entités sans actifs
SELECT 'Entités sans actifs' as check_type, COUNT(*) as count
FROM "Entity" e
LEFT JOIN "EntityOwnership" eo ON e.id = eo."entityId"
WHERE eo.id IS NULL;

-- 3. Utilisateurs sans entités
SELECT 'Utilisateurs sans entités' as check_type, COUNT(*) as count
FROM "User" u
LEFT JOIN "Entity" e ON u.id = e."userId"
WHERE e.id IS NULL;

-- 4. Valuations avec dates futures
SELECT 'Valuations futures' as check_type, COUNT(*) as count
FROM "AssetValuation"
WHERE date > CURRENT_DATE;

-- 5. Dettes avec montants négatifs
SELECT 'Dettes négatives' as check_type, COUNT(*) as count
FROM "Debt"
WHERE "initialAmount" < 0 OR "remainingAmount" < 0;
