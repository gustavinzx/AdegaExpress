-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: adega_express
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('2ac82bdd-d0ac-4682-ba74-2ef0f9c2cfe1','e33ccfe2825a39c8a7c12384323cbeb5651729eb248fa772d57a3640f612d1ce','2026-11-07 20:35:20.506','20261107120000_non_alcoholic_scope',NULL,NULL,'2026-11-07 20:35:20.401',1),('3f061545-dba0-4939-a10e-47e4cc1eda64','75914da88cbaac1de59e02aa8789ad750ac820463464979a4f0cae0322fa7251','2026-09-21 18:42:42.175','20260921120000_backend_business_rules',NULL,NULL,'2026-09-21 18:42:41.888',1),('471f00e1-f421-4162-9713-4172e47af218','0e06448964ce603f8fc8787e1af35de8d3b92338741adaf3877b6a8a949c9302','2026-09-09 23:15:57.740','20260909231557_make_deliverer_id_optional',NULL,NULL,'2026-09-09 23:15:57.682',1),('e9952d25-045e-49a3-a6a0-9e5356dfeb96','c4bbf6f73240ea01a450e57ab8db01b88f3b199f54715dc534fd5fd92ef3fca2','2026-09-09 22:39:58.996','20260909223958_init',NULL,NULL,'2026-09-09 22:39:58.355',1),('ffff94ed-cc15-4ca4-8886-5ef7794f8e1f','fdf1cd4b14232050483cb42a9eafc4f6f8ddf1075ed6afadc7aca93e4cac860b',NULL,'20261107120000_non_alcoholic_scope','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20261107120000_non_alcoholic_scope\n\nDatabase error code: 1060\n\nDatabase error:\nDuplicate column name \'cpf\'\n\nPlease check the query number 1 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20261107120000_non_alcoholic_scope\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name=\"20261107120000_non_alcoholic_scope\"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226','2026-11-07 20:35:19.180','2026-11-07 20:34:50.494',0);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `street` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `complement` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `neighborhood` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `zip` varchar(9) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `archived` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `addresses_user_id_idx` (`user_id`),
  CONSTRAINT `addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (1,1,'Rua das Flores','123',NULL,'Centro','Sao Paulo','SP','01310-100',1,0),(2,5,'Quadra 112 Conjunto 6','4','Recanto das Emas','Recanto das Emas','Brasília','DF','72602-407',1,0),(3,6,'Quadra 112 Conjunto 6','4','Recanto das Emas','Recanto das Emas','Brasília','DF','72602-407',0,0),(4,6,'Rua das Palmeiras','123','Centro','Recanto das Emas','Brasília','DF','70000-000',1,0),(5,10,'Avenida Paulista','1578','Apto 42 - Bloco B','Bela Vista','São Paulo','SP','01310-200',1,0);
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Cervejas','Categoria Cervejas',0),(2,'Vinhos','Categoria Vinhos',0),(3,'Destilados','Categoria Destilados',0),(4,'Não Alcoólicos','Sucos, Refrigerantes, Água, Energéticos',0),(5,'Tabacaria','Cigarros, Sedas, Fumo',0),(6,'Bomboniere','Chocolates, Salgadinhos e Doces',0),(7,'Água','Águas minerais naturais, com gás e saborizadas',1),(8,'Sucos','Sucos integrais, néctares e bebidas de frutas naturais',1),(9,'Refrigerantes','Refrigerantes tradicionais, zero açúcar e tônicas',1),(10,'Chás','Chás gelados prontos para beber e infusões naturais',1);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_type` enum('PERCENTUAL','FIXO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `valid_from` date NOT NULL,
  `valid_until` date NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupons_code_key` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES (1,'ADEGA10','PERCENTUAL',10.00,'2026-01-01','2026-12-31',1),(2,'DESC5','FIXO',5.00,'2026-01-01','2026-12-31',1),(3,'VENCIDO','FIXO',10.00,'2025-01-01','2025-06-30',1),(4,'BEMVINDO10','PERCENTUAL',10.00,'2025-01-01','2028-12-31',1),(5,'ADEGA5','FIXO',5.00,'2025-01-01','2028-12-31',1);
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deliveries`
--

DROP TABLE IF EXISTS `deliveries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deliveries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `deliverer_id` int DEFAULT NULL,
  `status` enum('AGUARDANDO','SAIU_PARA_ENTREGA','ENTREGUE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AGUARDANDO',
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deliveries_order_id_key` (`order_id`),
  KEY `deliveries_deliverer_id_idx` (`deliverer_id`),
  CONSTRAINT `deliveries_deliverer_id_fkey` FOREIGN KEY (`deliverer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `deliveries_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliveries`
--

LOCK TABLES `deliveries` WRITE;
/*!40000 ALTER TABLE `deliveries` DISABLE KEYS */;
INSERT INTO `deliveries` VALUES (1,1,3,'ENTREGUE','2026-09-09 23:21:10.109'),(2,7,9,'ENTREGUE','2026-11-07 21:33:33.790'),(3,8,9,'SAIU_PARA_ENTREGA','2026-11-07 21:33:33.796'),(4,9,9,'AGUARDANDO','2026-11-07 21:33:33.800'),(5,11,9,'ENTREGUE','2026-11-07 21:43:06.941');
/*!40000 ALTER TABLE `deliveries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_history`
--

DROP TABLE IF EXISTS `order_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `status` enum('PENDENTE','CONFIRMADO','SEPARADO','EM_ROTA','ENTREGUE','CANCELADO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_id` int NOT NULL,
  `reason` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `order_history_order_id_created_at_idx` (`order_id`,`created_at`),
  CONSTRAINT `order_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_history`
--

LOCK TABLES `order_history` WRITE;
/*!40000 ALTER TABLE `order_history` DISABLE KEYS */;
INSERT INTO `order_history` VALUES (1,3,'PENDENTE',5,NULL,'2026-09-21 20:47:28.074'),(2,4,'PENDENTE',5,NULL,'2026-09-21 20:50:25.565'),(3,2,'CANCELADO',1,'Pagamento demonstrativo não confirmado no prazo de 30 minutos (RN07).','2026-11-07 20:34:02.991'),(4,3,'CANCELADO',5,'Pagamento demonstrativo não confirmado no prazo de 30 minutos (RN07).','2026-11-07 20:34:03.092'),(5,4,'CANCELADO',5,'Pagamento demonstrativo não confirmado no prazo de 30 minutos (RN07).','2026-11-07 20:34:03.117'),(6,5,'PENDENTE',6,NULL,'2026-11-07 21:00:41.924'),(7,6,'PENDENTE',6,NULL,'2026-11-07 21:17:09.085'),(8,5,'CANCELADO',6,'Pagamento demonstrativo não confirmado no prazo de 30 minutos (RN07).','2026-11-07 21:31:02.873'),(9,7,'PENDENTE',10,'Pedido criado pelo cliente no checkout demonstrativo.','2026-11-07 17:33:33.789'),(10,7,'CONFIRMADO',8,'Pagamento demonstrativo PIX confirmado pela operação.','2026-11-07 18:33:33.789'),(11,7,'SEPARADO',8,'Itens separados e conferidos no estoque.','2026-11-07 19:33:33.789'),(12,7,'EM_ROTA',9,'Entregador iniciou o deslocamento para o endereço.','2026-11-07 20:33:33.789'),(13,7,'ENTREGUE',9,'Entrega concluída no endereço do cliente.','2026-11-07 21:03:33.789'),(14,8,'PENDENTE',10,'Pedido criado no checkout demonstrativo.','2026-11-07 20:53:33.789'),(15,8,'CONFIRMADO',7,'Pagamento demonstrativo confirmado.','2026-11-07 21:03:33.789'),(16,8,'SEPARADO',7,'Pedido separado e atribuído ao entregador.','2026-11-07 21:13:33.789'),(17,8,'EM_ROTA',9,'Saída para entrega registrada pelo entregador.','2026-11-07 21:23:33.789'),(18,9,'PENDENTE',10,'Pedido criado pelo cliente.','2026-11-07 21:33:33.800'),(19,9,'CONFIRMADO',8,'Pagamento demonstrativo confirmado.','2026-11-07 21:33:33.800'),(20,9,'SEPARADO',8,'Aguardando retirada pelo entregador.','2026-11-07 21:33:33.800'),(21,10,'PENDENTE',10,'Pedido registrado no checkout demonstrativo.','2026-11-07 21:33:33.804'),(22,10,'CONFIRMADO',8,'Pagamento demonstrativo validado.','2026-11-07 21:33:33.804'),(23,11,'PENDENTE',10,'Pedido aguardando confirmação manual do pagamento demonstrativo.','2026-11-07 21:33:33.807'),(24,12,'PENDENTE',10,'Pedido criado no checkout demonstrativo.','2026-11-07 21:33:33.810'),(25,12,'CANCELADO',10,'Cancelado a pedido do cliente (estoque devolvido automaticamente — RN07).','2026-11-07 21:33:33.810'),(26,11,'CONFIRMADO',8,NULL,'2026-11-07 21:42:21.407'),(27,11,'SEPARADO',8,NULL,'2026-11-07 21:42:26.474'),(28,11,'EM_ROTA',9,NULL,'2026-11-07 21:43:02.673'),(29,11,'ENTREGUE',9,NULL,'2026-11-07 21:43:06.940'),(30,6,'CANCELADO',6,'Pagamento demonstrativo não confirmado no prazo de 30 minutos (RN07).','2026-11-07 21:47:41.728');
/*!40000 ALTER TABLE `order_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `product_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_idx` (`order_id`),
  KEY `order_items_product_id_idx` (`product_id`),
  CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,3,10.50,'Heineken Long Neck'),(2,2,1,2,10.50,'Heineken Long Neck'),(3,3,16,3,3.50,'Amstel Lata 350ml'),(4,3,33,1,2.50,'Água Mineral Sem Gás 500ml'),(5,4,35,1,6.00,'Coca-Cola 600ml'),(6,4,36,1,10.00,'Coca-Cola 2L'),(7,5,87,1,2.50,'Água Mineral Sem Gás 500ml'),(8,6,88,1,3.00,'Água Mineral Com Gás 500ml'),(9,6,96,1,11.00,'Coca-Cola Original PET 2L'),(10,7,91,2,16.90,'Suco Integral de Uva Tinto 1L'),(11,7,87,2,2.50,'Água Mineral Sem Gás 500ml'),(12,8,92,2,14.50,'Suco Integral de Laranja 1L'),(13,9,96,2,11.00,'Coca-Cola Original PET 2L'),(14,10,101,2,9.90,'Chá Preto Gelado Sabor Pêssego 1,5L'),(15,11,100,3,5.50,'Chá Mate Tostado Com Limão 450ml'),(16,12,94,2,6.00,'Suco de Maçã Integral 300ml');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `address_id` int NOT NULL,
  `status` enum('PENDENTE','CONFIRMADO','SEPARADO','EM_ROTA','ENTREGUE','CANCELADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDENTE',
  `total` decimal(10,2) NOT NULL,
  `payment_method` enum('PIX','CARTAO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `coupon_id` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `address_snapshot` json DEFAULT NULL,
  `payment_status` enum('PENDENTE','PAGO','ESTORNO_PENDENTE','ESTORNADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDENTE',
  `paid_at` datetime(3) DEFAULT NULL,
  `idempotency_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_hash` char(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancellation_reason` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_user_id_idempotency_key_key` (`user_id`,`idempotency_key`),
  KEY `orders_user_id_idx` (`user_id`),
  KEY `orders_address_id_idx` (`address_id`),
  KEY `orders_coupon_id_idx` (`coupon_id`),
  KEY `orders_status_idx` (`status`),
  KEY `orders_created_at_idx` (`created_at`),
  CONSTRAINT `orders_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `orders_coupon_id_fkey` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,1,1,'ENTREGUE',31.50,'PIX',NULL,'2026-09-09 23:07:20.701','2026-09-09 23:21:10.111',31.50,0.00,0.00,'{\"zip\": \"01310-100\", \"city\": \"Sao Paulo\", \"state\": \"SP\", \"number\": \"123\", \"street\": \"Rua das Flores\", \"complement\": null, \"neighborhood\": \"Centro\"}','PENDENTE',NULL,NULL,NULL,NULL),(2,1,1,'CANCELADO',18.90,'CARTAO',1,'2026-09-09 23:07:47.774','2026-11-07 20:34:02.784',21.00,2.10,0.00,'{\"zip\": \"01310-100\", \"city\": \"Sao Paulo\", \"state\": \"SP\", \"number\": \"123\", \"street\": \"Rua das Flores\", \"complement\": null, \"neighborhood\": \"Centro\"}','PENDENTE',NULL,NULL,NULL,'Pagamento demonstrativo não confirmado no prazo de 30 minutos (RN07).'),(3,5,2,'CANCELADO',13.00,'PIX',NULL,'2026-09-21 20:47:28.074','2026-11-07 20:34:03.079',13.00,0.00,0.00,'{\"zip\": \"72602-407\", \"city\": \"Brasília\", \"state\": \"DF\", \"number\": \"4\", \"street\": \"Quadra 112 Conjunto 6\", \"complement\": \"Recanto das Emas\", \"neighborhood\": \"Recanto das Emas\"}','PENDENTE',NULL,'d44dcaaf-438e-4421-810f-a548846bfb32','49f95c9a67be56d97168d7e23470fce182db48979761dcb5a6bd1af2e5acadad','Pagamento demonstrativo não confirmado no prazo de 30 minutos (RN07).'),(4,5,2,'CANCELADO',16.00,'PIX',NULL,'2026-09-21 20:50:25.565','2026-11-07 20:34:03.103',16.00,0.00,0.00,'{\"zip\": \"72602-407\", \"city\": \"Brasília\", \"state\": \"DF\", \"number\": \"4\", \"street\": \"Quadra 112 Conjunto 6\", \"complement\": \"Recanto das Emas\", \"neighborhood\": \"Recanto das Emas\"}','PENDENTE',NULL,'293f8051-ee05-4be3-9952-cdb1f8ee6af1','ad5e20957ab3b40b859ff6fa404f2104ce94c825aac8cf65c5a450801fefb779','Pagamento demonstrativo não confirmado no prazo de 30 minutos (RN07).'),(5,6,3,'CANCELADO',2.50,'PIX',NULL,'2026-11-07 21:00:41.924','2026-11-07 21:31:02.871',2.50,0.00,0.00,'{\"zip\": \"72602-407\", \"city\": \"Brasília\", \"state\": \"DF\", \"number\": \"4\", \"street\": \"Quadra 112 Conjunto 6\", \"complement\": \"Recanto das Emas\", \"neighborhood\": \"Recanto das Emas\"}','PENDENTE',NULL,'e340f626-5db3-401c-9f8f-13e853a2774c','a046c927463803ab4ece328c5034262c3e0ab755b093e9b268f950e3424adc4d','Pagamento demonstrativo não confirmado no prazo de 30 minutos (RN07).'),(6,6,3,'CANCELADO',14.00,'PIX',NULL,'2026-11-07 21:17:09.085','2026-11-07 21:47:41.723',14.00,0.00,0.00,'{\"zip\": \"72602-407\", \"city\": \"Brasília\", \"state\": \"DF\", \"number\": \"4\", \"street\": \"Quadra 112 Conjunto 6\", \"complement\": \"Recanto das Emas\", \"neighborhood\": \"Recanto das Emas\"}','PENDENTE',NULL,'627dcb79-1c23-46b5-bfe0-7138a6320084','d415b5896b0f408af1f2acd1b47347e378bbd569938d8d7d95759266a53fa426','Pagamento demonstrativo não confirmado no prazo de 30 minutos (RN07).'),(7,10,5,'ENTREGUE',42.82,'PIX',4,'2026-11-07 21:33:33.790','2026-11-07 21:33:33.790',38.80,3.88,7.90,'{\"zip\": \"01310-200\", \"city\": \"São Paulo\", \"state\": \"SP\", \"number\": \"1578\", \"street\": \"Avenida Paulista\", \"complement\": \"Apto 42 - Bloco B\", \"neighborhood\": \"Bela Vista\"}','PAGO','2026-11-07 18:33:33.789',NULL,NULL,NULL),(8,10,5,'EM_ROTA',36.90,'CARTAO',NULL,'2026-11-07 21:33:33.796','2026-11-07 21:33:33.796',29.00,0.00,7.90,'{\"zip\": \"01310-200\", \"city\": \"São Paulo\", \"state\": \"SP\", \"number\": \"1578\", \"street\": \"Avenida Paulista\", \"complement\": \"Apto 42 - Bloco B\", \"neighborhood\": \"Bela Vista\"}','PAGO','2026-11-07 21:03:33.789',NULL,NULL,NULL),(9,10,5,'SEPARADO',29.90,'PIX',NULL,'2026-11-07 21:33:33.800','2026-11-07 21:33:33.800',22.00,0.00,7.90,'{\"zip\": \"01310-200\", \"city\": \"São Paulo\", \"state\": \"SP\", \"number\": \"1578\", \"street\": \"Avenida Paulista\", \"complement\": \"Apto 42 - Bloco B\", \"neighborhood\": \"Bela Vista\"}','PAGO','2026-11-07 21:18:33.789',NULL,NULL,NULL),(10,10,5,'CONFIRMADO',27.70,'PIX',NULL,'2026-11-07 21:33:33.804','2026-11-07 21:33:33.804',19.80,0.00,7.90,'{\"zip\": \"01310-200\", \"city\": \"São Paulo\", \"state\": \"SP\", \"number\": \"1578\", \"street\": \"Avenida Paulista\", \"complement\": \"Apto 42 - Bloco B\", \"neighborhood\": \"Bela Vista\"}','PAGO','2026-11-07 21:28:33.789',NULL,NULL,NULL),(11,10,5,'ENTREGUE',24.40,'PIX',NULL,'2026-11-07 21:33:33.807','2026-11-07 21:43:06.937',16.50,0.00,7.90,'{\"zip\": \"01310-200\", \"city\": \"São Paulo\", \"state\": \"SP\", \"number\": \"1578\", \"street\": \"Avenida Paulista\", \"complement\": \"Apto 42 - Bloco B\", \"neighborhood\": \"Bela Vista\"}','PAGO','2026-11-07 21:42:15.547',NULL,NULL,NULL),(12,10,5,'CANCELADO',19.90,'CARTAO',NULL,'2026-11-07 21:33:33.810','2026-11-07 21:33:33.810',12.00,0.00,7.90,'{\"zip\": \"01310-200\", \"city\": \"São Paulo\", \"state\": \"SP\", \"number\": \"1578\", \"street\": \"Avenida Paulista\", \"complement\": \"Apto 42 - Bloco B\", \"neighborhood\": \"Bela Vista\"}','PENDENTE',NULL,NULL,NULL,'Cancelado a pedido do cliente (estoque devolvido automaticamente — RN07).');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_records`
--

DROP TABLE IF EXISTS `payment_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `status` enum('PENDENTE','PAGO','ESTORNO_PENDENTE','ESTORNADO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_id` int NOT NULL,
  `reference` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `payment_records_order_id_idx` (`order_id`),
  CONSTRAINT `payment_records_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_records`
--

LOCK TABLES `payment_records` WRITE;
/*!40000 ALTER TABLE `payment_records` DISABLE KEYS */;
INSERT INTO `payment_records` VALUES (1,7,'PAGO',8,'PIX demonstrativo conferido pelo Atendente #01','2026-11-07 21:33:33.790'),(2,8,'PAGO',7,'Cartão demonstrativo confirmado pela administração','2026-11-07 21:33:33.796'),(3,9,'PAGO',8,'Confirmação manual PIX #03','2026-11-07 21:33:33.800'),(4,10,'PAGO',8,'PIX demonstrativo confirmado pelo atendente','2026-11-07 21:33:33.804'),(5,11,'PAGO',8,'Confirmação manual demonstrativa #11','2026-11-07 21:42:15.547');
/*!40000 ALTER TABLE `payment_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category_id` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `volume_ml` int NOT NULL,
  `abv_percent` decimal(5,2) NOT NULL,
  `brand` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock_quantity` int NOT NULL DEFAULT '0',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `products_category_id_idx` (`category_id`),
  CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Heineken Long Neck','Cerveja Lager premium 330ml',1,10.50,330,5.00,'Heineken',42,'https://placehold.co/400x400/18181b/f59e0b?text=Heineken%2BLong\\nNeck',0),(2,'Vinho Miolo Reserva Cabernet','Tinto seco encorpado',2,89.90,750,13.50,'Miolo',0,'https://placehold.co/400x400/18181b/f59e0b?text=Vinho%2BMiolo\\nReserva%2BCabernet',0),(3,'Seda Trevo',NULL,5,3.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Seda%2BTrevo',0),(4,'Fumo Trevo',NULL,5,7.00,0,0.00,'Adega Express',50,'https://placehold.co/400x400/18181b/f59e0b?text=Fumo%2BTrevo',0),(5,'Fumo Maratá',NULL,5,5.00,0,0.00,'Adega Express',50,'https://placehold.co/400x400/18181b/f59e0b?text=Fumo%2BMarat%C3%A1',0),(6,'Seda La Revolucion',NULL,5,16.00,0,0.00,'Adega Express',40,'https://placehold.co/400x400/18181b/f59e0b?text=Seda%2BLa\\nRevolucion',0),(7,'Seda Papelito',NULL,5,4.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Seda%2BPapelito',0),(8,'Isqueiro Bic Pequeno',NULL,5,4.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Isqueiro%2BBic\\nPequeno',0),(9,'Isqueiro Bic Grande',NULL,5,6.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Isqueiro%2BBic\\nGrande',0),(10,'Seda Zomo (Verde/Marrom)',NULL,5,5.00,0,0.00,'Adega Express',80,'https://placehold.co/400x400/18181b/f59e0b?text=Seda%2BZomo\\n(Verde%2FMarrom)',0),(11,'Seda Smoking',NULL,5,5.50,0,0.00,'Adega Express',80,'https://placehold.co/400x400/18181b/f59e0b?text=Seda%2BSmoking',0),(12,'Tabaco Nature Picado',NULL,5,2.00,0,0.00,'Adega Express',50,'https://placehold.co/400x400/18181b/f59e0b?text=Tabaco%2BNature\\nPicado',0),(13,'Tabaco Nature Caixa',NULL,5,13.00,0,0.00,'Adega Express',20,'https://placehold.co/400x400/18181b/f59e0b?text=Tabaco%2BNature\\nCaixa',0),(14,'Tabaco Selva Picado',NULL,5,1.50,0,0.00,'Adega Express',50,'https://placehold.co/400x400/18181b/f59e0b?text=Tabaco%2BSelva\\nPicado',0),(15,'Tabaco Selva Caixa',NULL,5,12.00,0,0.00,'Adega Express',20,'https://placehold.co/400x400/18181b/f59e0b?text=Tabaco%2BSelva\\nCaixa',0),(16,'Amstel Lata 350ml',NULL,1,3.50,0,0.00,'Adega Express',200,'https://placehold.co/400x400/18181b/f59e0b?text=Amstel%2BLata\\n350ml',0),(17,'Antarctica Original Lata 350ml',NULL,1,5.00,0,0.00,'Adega Express',150,'https://placehold.co/400x400/18181b/f59e0b?text=Antarctica%2BOriginal\\nLata%2B350ml',0),(18,'Brahma Lata 350ml',NULL,1,4.00,0,0.00,'Adega Express',300,'https://placehold.co/400x400/18181b/f59e0b?text=Brahma%2BLata\\n350ml',0),(19,'Itaipava Lata 350ml',NULL,1,3.00,0,0.00,'Adega Express',300,'https://placehold.co/400x400/18181b/f59e0b?text=Itaipava%2BLata\\n350ml',0),(20,'Spaten Lata 350ml',NULL,1,4.00,0,0.00,'Adega Express',200,'https://placehold.co/400x400/18181b/f59e0b?text=Spaten%2BLata\\n350ml',0),(21,'Heineken Lata 350ml',NULL,1,5.00,0,0.00,'Adega Express',300,'https://placehold.co/400x400/18181b/f59e0b?text=Heineken%2BLata\\n350ml',0),(22,'Heineken Long Neck 330ml',NULL,1,8.00,0,0.00,'Adega Express',150,'https://placehold.co/400x400/18181b/f59e0b?text=Heineken%2BLong\\nNeck%2B330ml',0),(23,'Spaten Long Neck 330ml',NULL,1,8.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Spaten%2BLong\\nNeck%2B330ml',0),(24,'Corona Long Neck 330ml',NULL,1,9.00,0,0.00,'Adega Express',120,'https://placehold.co/400x400/18181b/f59e0b?text=Corona%2BLong\\nNeck%2B330ml',0),(25,'Stella Artois Long Neck 330ml',NULL,1,8.00,0,0.00,'Adega Express',120,'https://placehold.co/400x400/18181b/f59e0b?text=Stella%2BArtois\\nLong%2BNeck%2B330ml',0),(26,'Heineken 0.0 Sem Álcool 330ml',NULL,1,9.00,0,0.00,'Adega Express',50,'https://placehold.co/400x400/18181b/f59e0b?text=Heineken%2B0.0\\nSem%2B%C3%81lcool%2B330ml',0),(27,'Litrão Brahma 1L',NULL,1,14.00,0,0.00,'Adega Express',80,'https://placehold.co/400x400/18181b/f59e0b?text=Litr%C3%A3o%2BBrahma\\n1L',0),(28,'Caixa Amstel (Pack)',NULL,1,35.00,0,0.00,'Adega Express',30,'https://placehold.co/400x400/18181b/f59e0b?text=Caixa%2BAmstel\\n(Pack)',0),(29,'Caixa Amstel Latão',NULL,1,42.00,0,0.00,'Adega Express',30,'https://placehold.co/400x400/18181b/f59e0b?text=Caixa%2BAmstel\\nLat%C3%A3o',0),(30,'Caixa Brahma',NULL,1,45.00,0,0.00,'Adega Express',50,'https://placehold.co/400x400/18181b/f59e0b?text=Caixa%2BBrahma',0),(31,'Caixa Heineken Latão',NULL,1,65.00,0,0.00,'Adega Express',40,'https://placehold.co/400x400/18181b/f59e0b?text=Caixa%2BHeineken\\nLat%C3%A3o',0),(32,'Refrigerante Lata 350ml',NULL,4,4.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Refrigerante%2BLata\\n350ml',0),(33,'Água Mineral Sem Gás 500ml',NULL,4,2.50,0,0.00,'Adega Express',200,'https://placehold.co/400x400/18181b/f59e0b?text=%C3%81gua%2BMineral\\nSem%2BG%C3%A1s%2B500ml',0),(34,'Água Mineral Com Gás 500ml',NULL,4,3.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=%C3%81gua%2BMineral\\nCom%2BG%C3%A1s%2B500ml',0),(35,'Coca-Cola 600ml',NULL,4,6.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Coca-Cola%2B600ml',0),(36,'Coca-Cola 2L',NULL,4,10.00,0,0.00,'Adega Express',80,'https://placehold.co/400x400/18181b/f59e0b?text=Coca-Cola%2B2L',0),(37,'Guaraná Antarctica 2L',NULL,4,9.00,0,0.00,'Adega Express',80,'https://placehold.co/400x400/18181b/f59e0b?text=Guaran%C3%A1%2BAntarctica\\n2L',0),(38,'Monster Energy 473ml',NULL,4,10.00,0,0.00,'Adega Express',50,'https://placehold.co/400x400/18181b/f59e0b?text=Monster%2BEnergy\\n473ml',0),(39,'Red Bull Energy Drink 250ml',NULL,4,10.00,0,0.00,'Adega Express',50,'https://placehold.co/400x400/18181b/f59e0b?text=Red%2BBull\\nEnergy%2BDrink%2B250ml',0),(40,'Skol Beats Senses Long Neck',NULL,3,8.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Skol%2BBeats\\nSenses%2BLong%2BNeck',0),(41,'Catuaba Selvagem Pitchulinha',NULL,3,5.00,0,0.00,'Adega Express',40,'https://placehold.co/400x400/18181b/f59e0b?text=Catuaba%2BSelvagem\\nPitchulinha',0),(42,'Coquinho Pitchulinha',NULL,3,5.00,0,0.00,'Adega Express',40,'https://placehold.co/400x400/18181b/f59e0b?text=Coquinho%2BPitchulinha',0),(43,'Cantina da Serra 1.5L',NULL,2,15.00,0,0.00,'Adega Express',20,'https://placehold.co/400x400/18181b/f59e0b?text=Cantina%2Bda\\nSerra%2B1.5L',0),(44,'Pérgola Tinto 1L',NULL,2,30.00,0,0.00,'Adega Express',30,'https://placehold.co/400x400/18181b/f59e0b?text=P%C3%A9rgola%2BTinto\\n1L',0),(45,'Mioranza 1L',NULL,2,30.00,0,0.00,'Adega Express',30,'https://placehold.co/400x400/18181b/f59e0b?text=Mioranza%2B1L',0),(46,'Kit Kat',NULL,6,5.50,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Kit%2BKat',0),(47,'Trento',NULL,6,3.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Trento',0),(48,'Bis Xtra',NULL,6,5.50,0,0.00,'Adega Express',50,'https://placehold.co/400x400/18181b/f59e0b?text=Bis%2BXtra',0),(49,'Caixa de Bis',NULL,6,9.00,0,0.00,'Adega Express',30,'https://placehold.co/400x400/18181b/f59e0b?text=Caixa%2Bde\\nBis',0),(50,'Ouro Branco',NULL,6,2.00,0,0.00,'Adega Express',200,'https://placehold.co/400x400/18181b/f59e0b?text=Ouro%2BBranco',0),(51,'Snickers',NULL,6,5.50,0,0.00,'Adega Express',50,'https://placehold.co/400x400/18181b/f59e0b?text=Snickers',0),(52,'Jack Daniel\'s Tennessee Apple 1L',NULL,3,159.90,1000,40.00,'Premium',50,'https://placehold.co/400x400/18181b/f59e0b?text=Jack%2BDaniel\'s\\nTennessee%2BApple%2B1L',0),(53,'Bob Pinga / Busca Brisa 965ml',NULL,3,35.00,1000,40.00,'Premium',50,'https://placehold.co/400x400/18181b/f59e0b?text=Bob%2BPinga\\n%2F%2BBusca%2BBrisa%2B965ml',0),(54,'Grand Old Parr 12 Anos 1L',NULL,3,179.90,1000,40.00,'Premium',50,'https://placehold.co/400x400/18181b/f59e0b?text=Grand%2BOld\\nParr%2B12%2BAnos%2B1L',0),(55,'Johnnie Walker Red Label 1L',NULL,3,99.90,1000,40.00,'Premium',50,'https://placehold.co/400x400/18181b/f59e0b?text=Johnnie%2BWalker\\nRed%2BLabel%2B1L',0),(56,'Ballantine\'s Finest 1L',NULL,3,89.90,1000,40.00,'Premium',50,'https://placehold.co/400x400/18181b/f59e0b?text=Ballantine\'s%2BFinest\\n1L',0),(57,'Papel do Trevo',NULL,5,3.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Papel%2Bdo\\nTrevo',0),(58,'Fumo Super Bom',NULL,5,5.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Fumo%2BSuper\\nBom',0),(59,'Isqueiro Pequeno',NULL,5,4.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Isqueiro%2BPequeno',0),(60,'Isqueiro Grande',NULL,5,6.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Isqueiro%2BGrande',0),(61,'Caixinha de Seda Zomo Verde/Marrom',NULL,5,5.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Caixinha%2Bde\\nSeda%2BZomo%2BVerde%2FMarrom',0),(62,'Caixa do Tabaco Nature',NULL,5,13.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Caixa%2Bdo\\nTabaco%2BNature',0),(63,'Caixa do Tabaco Selva',NULL,5,12.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Caixa%2Bdo\\nTabaco%2BSelva',0),(64,'Caixa Tabaco Selva Ice',NULL,5,16.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Caixa%2BTabaco\\nSelva%2BIce',0),(65,'Tabaco Grande',NULL,5,1.00,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Tabaco%2BGrande',0),(66,'Tabaco Ice Grande',NULL,5,1.50,0,0.00,'Adega Express',100,'https://placehold.co/400x400/18181b/f59e0b?text=Tabaco%2BIce\\nGrande',0),(67,'Antarctica Lata 350ml',NULL,1,3.50,350,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Antarctica%2BLata\\n350ml',0),(68,'Kaiser Lata 350ml',NULL,1,3.50,350,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Kaiser%2BLata\\n350ml',0),(69,'Heineken Garrafa 330ml',NULL,1,8.00,330,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Heineken%2BGarrafa\\n330ml',0),(70,'Spaten Garrafa 330ml',NULL,1,8.00,330,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Spaten%2BGarrafa\\n330ml',0),(71,'Eisenbahn Garrafa 330ml',NULL,1,7.00,330,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Eisenbahn%2BGarrafa\\n330ml',0),(72,'Corona Garrafa 330ml',NULL,1,9.00,330,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Corona%2BGarrafa\\n330ml',0),(73,'Stella Artois Garrafa 330ml',NULL,1,8.00,330,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Stella%2BArtois\\nGarrafa%2B330ml',0),(74,'Budweiser Garrafa 330ml',NULL,1,8.00,330,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Budweiser%2BGarrafa\\n330ml',0),(75,'Stella Gold (Sem Glúten)',NULL,1,9.00,0,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Stella%2BGold\\n(Sem%2BGl%C3%BAten)',0),(76,'Michelob Ultra (Sem Glúten)',NULL,1,9.00,0,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Michelob%2BUltra\\n(Sem%2BGl%C3%BAten)',0),(77,'Heineken Zero (Sem Álcool)',NULL,1,9.00,0,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Heineken%2BZero\\n(Sem%2B%C3%81lcool)',0),(78,'Corona Zero (Sem Álcool)',NULL,1,9.00,0,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Corona%2BZero\\n(Sem%2B%C3%81lcool)',0),(79,'Shot Heineken',NULL,1,6.00,0,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Shot%2BHeineken',0),(80,'Shot Corona',NULL,1,6.00,0,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Shot%2BCorona',0),(81,'Brahma Litrão 1L',NULL,1,14.00,1000,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Brahma%2BLitr%C3%A3o\\n1L',0),(82,'Antarctica Litrão 1L',NULL,1,14.00,1000,5.00,'Diversas',100,'https://placehold.co/400x400/18181b/f59e0b?text=Antarctica%2BLitr%C3%A3o\\n1L',0),(83,'Água Mineral Sem Gás Demonstração','Produto fictício não alcoólico para demonstração acadêmica.',7,3.00,500,0.00,'Fonte Cristal',48,NULL,1),(84,'Suco Integral de Uva Demonstração','Produto fictício não alcoólico para demonstração acadêmica.',8,14.90,1000,0.00,'Pomar Natural',12,NULL,1),(85,'Refrigerante de Guaraná Demonstração','Produto fictício não alcoólico para demonstração acadêmica.',9,5.50,350,0.00,'Serra Verde',24,NULL,1),(86,'Chá Gelado de Pêssego sem Estoque Demonstração','Produto fictício não alcoólico para demonstração acadêmica.',10,6.90,450,0.00,'Folha Real',0,NULL,1),(87,'Água Mineral Sem Gás 500ml','Água mineral natural sem gás em garrafa individual de 500ml.',7,2.50,500,0.00,'Minalba',150,NULL,1),(88,'Água Mineral Com Gás 500ml','Água mineral natural gaseificada refrescante de 500ml.',7,3.00,500,0.00,'Minalba',120,NULL,1),(89,'Água Mineral Sem Gás 1,5L','Garrafa familiar de água mineral leve sem gás 1,5 litro.',7,4.50,1500,0.00,'Bonafont',80,NULL,1),(90,'Água Tônica Tradicional Lata 350ml','Água tônica gaseificada não alcoólica com quinino (item demonstrativo em falta).',7,4.50,350,0.00,'Antarctica',0,NULL,1),(91,'Suco Integral de Uva Tinto 1L','Suco 100% uva integral sem adição de açúcares ou conservantes.',8,16.90,1000,0.00,'Aurora',45,NULL,1),(92,'Suco Integral de Laranja 1L','Suco de laranja 100% natural espremido e pasteurizado.',8,14.50,1000,0.00,'Natural One',50,NULL,1),(93,'Néctar de Pêssego 1L','Bebida de fruta sabor pêssego pronta para consumo.',8,8.50,1000,0.00,'Del Valle',65,NULL,1),(94,'Suco de Maçã Integral 300ml','Suco 100% maçã sem adição de açúcar em embalagem individual.',8,6.00,300,0.00,'Natural One',40,NULL,1),(95,'Coca-Cola Original Lata 350ml','Refrigerante de cola tradicional em lata de 350ml.',9,4.50,350,0.00,'Coca-Cola',200,NULL,1),(96,'Coca-Cola Original PET 2L','Refrigerante de cola tradicional em embalagem familiar de 2 litros.',9,11.00,2000,0.00,'Coca-Cola',90,NULL,1),(97,'Guaraná Antarctica Lata 350ml','O autêntico refrigerante de guaraná brasileiro em lata de 350ml.',9,4.00,350,0.00,'Antarctica',180,NULL,1),(98,'Guaraná Antarctica PET 2L','Refrigerante de guaraná em garrafa de 2 litros.',9,9.50,2000,0.00,'Antarctica',75,NULL,1),(99,'Sprite Limão Sem Açúcar Lata 350ml','Refrigerante sabor limão zero açúcar (item demonstrativo sem estoque).',9,4.20,350,0.00,'Sprite',0,NULL,1),(100,'Chá Mate Tostado Com Limão 450ml','Chá mate natural com toque de limão, pronto para beber.',10,5.50,450,0.00,'Matte Leão',70,NULL,1),(101,'Chá Preto Gelado Sabor Pêssego 1,5L','Chá preto gelado sabor pêssego em garrafa de 1,5 litro.',10,9.90,1500,0.00,'Fuze Tea',40,NULL,1),(102,'Chá Verde Com Hortelã e Limão Lata 290ml','Chá verde zero calorias rico em antioxidantes.',10,6.50,290,0.00,'Feel Good',55,NULL,1);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `type` enum('ENTRADA','SAIDA') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `reason` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `actor_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_movements_product_id_idx` (`product_id`),
  CONSTRAINT `stock_movements_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES (1,1,'SAIDA',3,'Venda - Pedido #1','2026-09-09 23:07:20.711',NULL),(2,1,'SAIDA',2,'Venda - Pedido #2','2026-09-09 23:07:47.780',NULL),(3,16,'SAIDA',3,'Venda - Pedido #3','2026-09-21 20:47:28.088',5),(4,33,'SAIDA',1,'Venda - Pedido #3','2026-09-21 20:47:28.088',5),(5,35,'SAIDA',1,'Venda - Pedido #4','2026-09-21 20:50:25.570',5),(6,36,'SAIDA',1,'Venda - Pedido #4','2026-09-21 20:50:25.570',5),(7,1,'ENTRADA',2,'Cancelamento automático (RN07) - Pedido #2','2026-11-07 20:34:02.943',1),(8,16,'ENTRADA',3,'Cancelamento automático (RN07) - Pedido #3','2026-11-07 20:34:03.087',5),(9,33,'ENTRADA',1,'Cancelamento automático (RN07) - Pedido #3','2026-11-07 20:34:03.091',5),(10,35,'ENTRADA',1,'Cancelamento automático (RN07) - Pedido #4','2026-11-07 20:34:03.110',5),(11,36,'ENTRADA',1,'Cancelamento automático (RN07) - Pedido #4','2026-11-07 20:34:03.116',5),(12,83,'ENTRADA',48,'Estoque inicial de demonstração','2026-11-07 20:35:21.755',NULL),(13,84,'ENTRADA',12,'Estoque inicial de demonstração','2026-11-07 20:35:21.762',NULL),(14,85,'ENTRADA',24,'Estoque inicial de demonstração','2026-11-07 20:35:21.769',NULL),(15,87,'SAIDA',1,'Venda - Pedido #5','2026-11-07 21:00:41.952',6),(16,88,'SAIDA',1,'Venda - Pedido #6','2026-11-07 21:17:09.092',6),(17,96,'SAIDA',1,'Venda - Pedido #6','2026-11-07 21:17:09.092',6),(18,87,'ENTRADA',1,'Cancelamento automático (RN07) - Pedido #5','2026-11-07 21:31:02.872',6),(19,89,'ENTRADA',80,'Reposição inicial de fornecedor (lote demonstrativo)','2026-11-07 21:33:33.731',7),(20,91,'ENTRADA',45,'Reposição inicial de fornecedor (lote demonstrativo)','2026-11-07 21:33:33.740',7),(21,92,'ENTRADA',50,'Reposição inicial de fornecedor (lote demonstrativo)','2026-11-07 21:33:33.744',7),(22,93,'ENTRADA',65,'Reposição inicial de fornecedor (lote demonstrativo)','2026-11-07 21:33:33.749',7),(23,94,'ENTRADA',40,'Reposição inicial de fornecedor (lote demonstrativo)','2026-11-07 21:33:33.753',7),(24,95,'ENTRADA',200,'Reposição inicial de fornecedor (lote demonstrativo)','2026-11-07 21:33:33.757',7),(25,97,'ENTRADA',180,'Reposição inicial de fornecedor (lote demonstrativo)','2026-11-07 21:33:33.763',7),(26,98,'ENTRADA',75,'Reposição inicial de fornecedor (lote demonstrativo)','2026-11-07 21:33:33.767',7),(27,100,'ENTRADA',70,'Reposição inicial de fornecedor (lote demonstrativo)','2026-11-07 21:33:33.774',7),(28,101,'ENTRADA',40,'Reposição inicial de fornecedor (lote demonstrativo)','2026-11-07 21:33:33.778',7),(29,102,'ENTRADA',55,'Reposição inicial de fornecedor (lote demonstrativo)','2026-11-07 21:33:33.781',7),(30,88,'ENTRADA',1,'Cancelamento automático (RN07) - Pedido #6','2026-11-07 21:47:41.725',6),(31,96,'ENTRADA',1,'Cancelamento automático (RN07) - Pedido #6','2026-11-07 21:47:41.727',6);
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('CLIENTE','ATENDENTE','ADMINISTRADOR','ENTREGADOR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CLIENTE',
  `birth_date` date DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `token_version` int NOT NULL DEFAULT '0',
  `cpf` varchar(14) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_cpf_key` (`cpf`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Teste Cliente','teste@teste.com','$2b$12$GVBATKKd26mV2Y2R.66Xbe5r3/gdT539QfBVeLvf/YZvqUWIe.7wu','ADMINISTRADOR','2000-01-01','2026-09-09 22:49:31.746',1,0,NULL),(2,'Outro Usuario','outro@teste.com','$2b$12$bUGaunD8sBtYOfL14Pm8O.z22h6WRV3bzqREIkNLdcyw5dzm2EOf6','ADMINISTRADOR','1995-06-15','2026-09-09 23:11:49.869',1,0,NULL),(3,'Entregador','motoboy@teste.com','$2b$12$/1LVkIUsvvnov3mSijrACeEAJI6HSuoIDIp/EwFWsJl1bKp13BopC','ADMINISTRADOR','1990-01-01','2026-09-09 23:21:07.647',1,0,NULL),(4,'Entregador 2','motoboy2@teste.com','$2b$12$7TlRJynmA0icvCkFDL1OEuHr7h7NkSUM2K3OcmEbmzacf2mDi51wG','ADMINISTRADOR','1992-05-10','2026-09-09 23:25:23.513',1,0,NULL),(5,'Gustavo Silva dos Santos','gugu123@gmail.com','$2b$12$5L3u4MlELF6zb9QlIFQyUuMxiy6ZeKfbGQ37RRXRGcaF9iueCcFVe','ADMINISTRADOR','2006-06-04','2026-09-21 20:40:27.815',1,0,'05663082158'),(6,'Gustavo Silva dos Santos','gsds0499@gmail.com','$2b$12$4LZJxbACIbWMP.//vIbeF.F35CmilWWwI8WvciPnFbS0WkTyHqc/y','CLIENTE',NULL,'2026-11-07 21:00:17.790',1,1,NULL),(7,'Administrador Adega Express','admin@adegaexpress.com','$2b$12$38uPJZrgq0BdDdTul8NsaOB6abhuXzCMGKPkPOgUxvYRsaPgf/Ef2','ADMINISTRADOR',NULL,'2026-11-07 21:22:03.848',1,0,NULL),(8,'Atendente Adega Express','atendente@adegaexpress.com','$2b$12$38uPJZrgq0BdDdTul8NsaOB6abhuXzCMGKPkPOgUxvYRsaPgf/Ef2','ATENDENTE',NULL,'2026-11-07 21:22:03.851',1,2,NULL),(9,'Entregador Adega Express','entregador@adegaexpress.com','$2b$12$38uPJZrgq0BdDdTul8NsaOB6abhuXzCMGKPkPOgUxvYRsaPgf/Ef2','ENTREGADOR',NULL,'2026-11-07 21:22:03.853',1,2,NULL),(10,'Cliente Demonstração','cliente@adegaexpress.com','$2b$12$38uPJZrgq0BdDdTul8NsaOB6abhuXzCMGKPkPOgUxvYRsaPgf/Ef2','CLIENTE',NULL,'2026-11-07 21:22:03.856',1,1,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-07 18:52:50
