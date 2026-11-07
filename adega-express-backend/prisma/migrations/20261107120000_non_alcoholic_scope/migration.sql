-- Additive migration: add active flag to categories, optional cpf to users, and safely deactivate legacy out-of-scope records
-- preserving all historical orders, order items and stock movements.
ALTER TABLE `users` ADD COLUMN `cpf` VARCHAR(14) NULL;
CREATE UNIQUE INDEX `users_cpf_key` ON `users`(`cpf`);

ALTER TABLE `categories` ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true;

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
