-- Additive migration: preserve all existing customers, orders and stock.
ALTER TABLE `users` ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `token_version` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `addresses` ADD COLUMN `archived` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `orders`
  ADD COLUMN `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN `discount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN `shipping_fee` DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN `address_snapshot` JSON NULL,
  ADD COLUMN `payment_status` ENUM('PENDENTE','PAGO','ESTORNO_PENDENTE','ESTORNADO') NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN `paid_at` DATETIME(3) NULL,
  ADD COLUMN `idempotency_key` VARCHAR(100) NULL,
  ADD COLUMN `request_hash` CHAR(64) NULL,
  ADD COLUMN `cancellation_reason` VARCHAR(300) NULL;
ALTER TABLE `order_items` ADD COLUMN `product_name` VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE `stock_movements` ADD COLUMN `actor_id` INTEGER NULL;
CREATE UNIQUE INDEX `orders_user_id_idempotency_key_key` ON `orders` (`user_id`, `idempotency_key`);
CREATE INDEX `orders_created_at_idx` ON `orders` (`created_at`);

CREATE TABLE `order_history` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `order_id` INTEGER NOT NULL,
  `status` ENUM('PENDENTE','CONFIRMADO','SEPARADO','EM_ROTA','ENTREGUE','CANCELADO') NOT NULL,
  `actor_id` INTEGER NOT NULL,
  `reason` VARCHAR(300) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `order_history_order_id_created_at_idx` (`order_id`,`created_at`),
  CONSTRAINT `order_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `payment_records` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `order_id` INTEGER NOT NULL,
  `status` ENUM('PENDENTE','PAGO','ESTORNO_PENDENTE','ESTORNADO') NOT NULL,
  `actor_id` INTEGER NOT NULL,
  `reference` VARCHAR(150) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `payment_records_order_id_idx` (`order_id`),
  CONSTRAINT `payment_records_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Best available snapshot for legacy orders; historic edits before this migration cannot be recovered.
UPDATE `orders` o JOIN `addresses` a ON a.id = o.address_id
SET o.address_snapshot = JSON_OBJECT('street',a.street,'number',a.number,'complement',a.complement,'neighborhood',a.neighborhood,'city',a.city,'state',a.state,'zip',a.zip);
UPDATE `order_items` i JOIN `products` p ON p.id = i.product_id SET i.product_name = p.name;
UPDATE `orders` o LEFT JOIN (SELECT order_id, SUM(quantity * unit_price) AS subtotal FROM order_items GROUP BY order_id) i ON i.order_id = o.id
SET o.subtotal = COALESCE(i.subtotal,o.total), o.discount = GREATEST(COALESCE(i.subtotal,o.total) - o.total,0);
-- No payment is inferred from order status: legacy payments require manual reconciliation.
