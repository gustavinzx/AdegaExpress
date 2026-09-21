-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(200) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('CLIENTE', 'ATENDENTE', 'ADMINISTRADOR', 'ENTREGADOR') NOT NULL DEFAULT 'CLIENTE',
    `birth_date` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `street` VARCHAR(200) NOT NULL,
    `number` VARCHAR(20) NOT NULL,
    `complement` VARCHAR(100) NULL,
    `neighborhood` VARCHAR(100) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` CHAR(2) NOT NULL,
    `zip` VARCHAR(9) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,

    INDEX `addresses_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `category_id` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `volume_ml` INTEGER NOT NULL,
    `abv_percent` DECIMAL(5, 2) NOT NULL,
    `brand` VARCHAR(150) NOT NULL,
    `stock_quantity` INTEGER NOT NULL DEFAULT 0,
    `image_url` VARCHAR(500) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `products_category_id_idx`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `discount_type` ENUM('PERCENTUAL', 'FIXO') NOT NULL,
    `discount_value` DECIMAL(10, 2) NOT NULL,
    `valid_from` DATE NOT NULL,
    `valid_until` DATE NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `coupons_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `address_id` INTEGER NOT NULL,
    `status` ENUM('PENDENTE', 'CONFIRMADO', 'SEPARADO', 'EM_ROTA', 'ENTREGUE', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    `total` DECIMAL(10, 2) NOT NULL,
    `payment_method` ENUM('PIX', 'CARTAO') NOT NULL,
    `coupon_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `orders_user_id_idx`(`user_id`),
    INDEX `orders_address_id_idx`(`address_id`),
    INDEX `orders_coupon_id_idx`(`coupon_id`),
    INDEX `orders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,

    INDEX `order_items_order_id_idx`(`order_id`),
    INDEX `order_items_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deliveries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `deliverer_id` INTEGER NOT NULL,
    `status` ENUM('AGUARDANDO', 'SAIU_PARA_ENTREGA', 'ENTREGUE') NOT NULL DEFAULT 'AGUARDANDO',
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `deliveries_order_id_key`(`order_id`),
    INDEX `deliveries_deliverer_id_idx`(`deliverer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_movements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `type` ENUM('ENTRADA', 'SAIDA') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `reason` VARCHAR(300) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_movements_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_coupon_id_fkey` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_deliverer_id_fkey` FOREIGN KEY (`deliverer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

