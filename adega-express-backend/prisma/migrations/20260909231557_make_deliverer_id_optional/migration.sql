-- DropForeignKey
ALTER TABLE `deliveries` DROP FOREIGN KEY `deliveries_deliverer_id_fkey`;

-- AlterTable
ALTER TABLE `deliveries` MODIFY `deliverer_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_deliverer_id_fkey` FOREIGN KEY (`deliverer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
