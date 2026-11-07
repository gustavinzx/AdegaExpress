-- Additive migration: idempotently ensure optional cpf on users and active flag on categories,
-- and safely deactivate legacy out-of-scope records preserving all historical orders and items.
SET @cpf_col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'cpf'
);
SET @cpf_sql := IF(
  @cpf_col_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `cpf` VARCHAR(14) NULL, ADD UNIQUE INDEX `users_cpf_key`(`cpf`)',
  'DO 0'
);
PREPARE cpf_stmt FROM @cpf_sql;
EXECUTE cpf_stmt;
DEALLOCATE PREPARE cpf_stmt;

SET @cat_active_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'categories'
    AND COLUMN_NAME = 'active'
);
SET @cat_sql := IF(
  @cat_active_exists = 0,
  'ALTER TABLE `categories` ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true',
  'DO 0'
);
PREPARE cat_stmt FROM @cat_sql;
EXECUTE cat_stmt;
DEALLOCATE PREPARE cat_stmt;

-- Deactivate categories outside the academic non-alcoholic scope (Água, Sucos, Refrigerantes, Chás)
UPDATE `categories`
SET `active` = false
WHERE `name` NOT IN ('Água', 'Sucos', 'Refrigerantes', 'Chás');

-- Deactivate any legacy products that contain alcohol or belong to inactive/out-of-scope categories
UPDATE `products` p
JOIN `categories` c ON c.id = p.category_id
SET p.active = false
WHERE p.abv_percent > 0
   OR c.active = false
   OR LOWER(p.name) REGEXP 'cerveja|vinho|vodka|whisky|gin|catuaba|tabaco|cigarro|seda|fumo|isqueiro|destilado|alco[oó]l';
