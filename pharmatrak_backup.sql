-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: pharmatrak
-- ------------------------------------------------------
-- Server version	8.0.43

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
-- Table structure for table `drugs`
--

DROP TABLE IF EXISTS `drugs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drugs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ndc` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_ndc` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `generic_name` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brand_name` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dosage_form` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `strength` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manufacturer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `labeler_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `substance_name` text COLLATE utf8mb4_unicode_ci,
  `product_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marketing_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `listing_expiration_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `fda_data` json DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ndc` (`ndc`),
  KEY `idx_ndc` (`ndc`),
  KEY `idx_product_ndc` (`product_ndc`),
  KEY `idx_generic_name` (`generic_name`(100)),
  KEY `idx_brand_name` (`brand_name`(100)),
  KEY `idx_manufacturer` (`manufacturer_name`(100)),
  KEY `idx_active` (`is_active`),
  KEY `idx_drugs_dosage_form` (`dosage_form`),
  KEY `idx_drugs_substance` (`substance_name`(100)),
  KEY `idx_drugs_active_names` (`is_active`,`generic_name`(100),`brand_name`(100)),
  FULLTEXT KEY `idx_generic_fulltext` (`generic_name`),
  FULLTEXT KEY `idx_brand_fulltext` (`brand_name`),
  FULLTEXT KEY `idx_substance_fulltext` (`substance_name`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drugs`
--

LOCK TABLES `drugs` WRITE;
/*!40000 ALTER TABLE `drugs` DISABLE KEYS */;
INSERT INTO `drugs` VALUES (12,'00003-0232-21','00003-0232','Acetaminophen','TYLENOL Regular Strength','TABLET','ORAL','325 mg','McNeil Consumer Healthcare',NULL,'ACETAMINOPHEN','HUMAN PRESCRIPTION DRUG',NULL,NULL,1,NULL,'2025-08-10 20:25:52','2025-08-10 20:25:52'),(13,'00049-0593-83','00049-0593','Ibuprofen','ADVIL','TABLET','ORAL','200 mg','Pfizer Consumer Healthcare',NULL,'IBUPROFEN','HUMAN PRESCRIPTION DRUG',NULL,NULL,1,NULL,'2025-08-10 20:25:52','2025-08-10 20:25:52'),(14,'00781-1506-01','00781-1506','Amoxicillin','AMOXIL','CAPSULE','ORAL','500 mg','Sandoz Inc',NULL,'AMOXICILLIN','HUMAN PRESCRIPTION DRUG',NULL,NULL,1,NULL,'2025-08-10 20:25:52','2025-08-10 20:25:52'),(15,'00071-0156-23','00071-0156','Lisinopril','PRINIVIL','TABLET','ORAL','10 mg','Merck & Co Inc',NULL,'LISINOPRIL','HUMAN PRESCRIPTION DRUG',NULL,NULL,1,NULL,'2025-08-10 20:25:52','2025-08-10 20:25:52'),(16,'00378-0781-05','00378-0781','Metformin Hydrochloride','GLUCOPHAGE','TABLET','ORAL','500 mg','Mylan Pharmaceuticals Inc',NULL,'METFORMIN HYDROCHLORIDE','HUMAN PRESCRIPTION DRUG',NULL,NULL,1,NULL,'2025-08-10 20:25:52','2025-08-10 20:25:52'),(17,'00172-3981-70','00172-3981','Amlodipine Besylate','NORVASC','TABLET','ORAL','5 mg','Pfizer Labs',NULL,'AMLODIPINE BESYLATE','HUMAN PRESCRIPTION DRUG',NULL,NULL,1,NULL,'2025-08-10 20:25:52','2025-08-10 20:25:52'),(18,'00093-0058-01','00093-0058','Atorvastatin Calcium','LIPITOR','TABLET','ORAL','20 mg','Teva Pharmaceuticals USA Inc',NULL,'ATORVASTATIN CALCIUM','HUMAN PRESCRIPTION DRUG',NULL,NULL,1,NULL,'2025-08-10 20:25:52','2025-08-10 20:25:52'),(19,'00002-4112-02','00002-4112','Fluoxetine Hydrochloride','PROZAC','CAPSULE','ORAL','20 mg','Eli Lilly and Company',NULL,'FLUOXETINE HYDROCHLORIDE','HUMAN PRESCRIPTION DRUG',NULL,NULL,1,NULL,'2025-08-10 20:25:52','2025-08-10 20:25:52'),(20,'00143-9726-01','00143-9726','Omeprazole','PRILOSEC','CAPSULE','ORAL','20 mg','West-Ward Pharmaceutical Corp',NULL,'OMEPRAZOLE','HUMAN PRESCRIPTION DRUG',NULL,NULL,1,NULL,'2025-08-10 20:25:52','2025-08-10 20:25:52'),(21,'00378-6015-93','00378-6015','Hydrochlorothiazide','MICROZIDE','TABLET','ORAL','25 mg','Mylan Pharmaceuticals Inc',NULL,'HYDROCHLOROTHIAZIDE','HUMAN PRESCRIPTION DRUG',NULL,NULL,1,NULL,'2025-08-10 20:25:52','2025-08-10 20:25:52');
/*!40000 ALTER TABLE `drugs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fda_search_history`
--

DROP TABLE IF EXISTS `fda_search_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fda_search_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `store_id` int DEFAULT NULL,
  `search_type` enum('ndc','generic_name','brand_name','manufacturer','advanced') COLLATE utf8mb4_unicode_ci NOT NULL,
  `search_query` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `results_count` int DEFAULT '0',
  `response_time_ms` int DEFAULT NULL,
  `was_cached` tinyint(1) DEFAULT '0',
  `search_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_searches` (`user_id`,`search_date`),
  KEY `idx_store_searches` (`store_id`,`search_date`),
  KEY `idx_search_type` (`search_type`),
  KEY `idx_search_date` (`search_date`),
  CONSTRAINT `fda_search_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fda_search_history_ibfk_2` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fda_search_history`
--

LOCK TABLES `fda_search_history` WRITE;
/*!40000 ALTER TABLE `fda_search_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `fda_search_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `god_mode_audit`
--

DROP TABLE IF EXISTS `god_mode_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `god_mode_audit` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action_type` enum('store_switch','user_edit','user_create','user_delete','drug_edit','drug_create','drug_delete','transaction_edit','transaction_create','transaction_delete','permission_grant','permission_revoke','role_change','system_setting_change') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` enum('store','user','drug','transaction','system') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` int DEFAULT NULL,
  `target_store_id` int DEFAULT NULL,
  `old_value` json DEFAULT NULL,
  `new_value` json DEFAULT NULL,
  `action_details` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `action_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_god_audit_user` (`user_id`),
  KEY `idx_god_audit_action` (`action_type`),
  KEY `idx_god_audit_target` (`target_type`,`target_id`),
  KEY `idx_god_audit_store` (`target_store_id`),
  KEY `idx_god_audit_timestamp` (`action_timestamp`),
  KEY `idx_god_audit_composite` (`user_id`,`action_timestamp`,`action_type`),
  CONSTRAINT `god_mode_audit_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `god_mode_audit_ibfk_2` FOREIGN KEY (`target_store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `god_mode_audit`
--

LOCK TABLES `god_mode_audit` WRITE;
/*!40000 ALTER TABLE `god_mode_audit` DISABLE KEYS */;
/*!40000 ALTER TABLE `god_mode_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_audit_log`
--

DROP TABLE IF EXISTS `inventory_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inventory_id` int NOT NULL,
  `store_id` int NOT NULL,
  `drug_id` int NOT NULL,
  `transaction_type` enum('prescription_fill','return_to_stock','expire','audit','shipment_received','initial_inventory') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_change` int NOT NULL COMMENT 'Positive for additions, negative for subtractions',
  `quantity_before` int NOT NULL,
  `quantity_after` int NOT NULL,
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Prescription number, return receipt, etc.',
  `performed_by` int NOT NULL COMMENT 'User who performed the action',
  `transaction_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `drug_id` (`drug_id`),
  KEY `idx_inventory_id` (`inventory_id`),
  KEY `idx_store_drug` (`store_id`,`drug_id`),
  KEY `idx_transaction_date` (`transaction_date`),
  KEY `idx_transaction_type` (`transaction_type`),
  KEY `idx_performed_by` (`performed_by`),
  KEY `idx_reference_number` (`reference_number`),
  KEY `idx_audit_store_date` (`store_id`,`transaction_date` DESC),
  KEY `idx_audit_store_drug_date` (`store_id`,`drug_id`,`transaction_date` DESC),
  KEY `idx_audit_inventory_date` (`inventory_id`,`transaction_date` DESC),
  KEY `idx_audit_user_date` (`performed_by`,`transaction_date` DESC),
  CONSTRAINT `inventory_audit_log_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `store_inventory` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_audit_log_ibfk_2` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_audit_log_ibfk_3` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_audit_log_ibfk_4` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=226 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_audit_log`
--

LOCK TABLES `inventory_audit_log` WRITE;
/*!40000 ALTER TABLE `inventory_audit_log` DISABLE KEYS */;
INSERT INTO `inventory_audit_log` VALUES (56,12,1,12,'initial_inventory',800,0,800,'Initial inventory from supplier delivery',NULL,1,'2025-06-12 06:36:26'),(57,13,1,13,'initial_inventory',300,0,300,'Initial inventory from supplier delivery',NULL,1,'2025-06-10 17:04:14'),(58,14,1,14,'initial_inventory',120,0,120,'Initial inventory from supplier delivery',NULL,1,'2025-06-29 19:53:54'),(59,15,1,15,'initial_inventory',270,0,270,'Initial inventory from supplier delivery',NULL,1,'2025-06-15 01:08:17'),(60,16,1,16,'initial_inventory',240,0,240,'Initial inventory from supplier delivery',NULL,1,'2025-06-15 19:35:27'),(61,17,1,17,'initial_inventory',300,0,300,'Initial inventory from supplier delivery',NULL,1,'2025-06-11 12:48:53'),(62,18,1,18,'initial_inventory',180,0,180,'Initial inventory from supplier delivery',NULL,1,'2025-06-13 10:42:46'),(63,19,1,19,'initial_inventory',120,0,120,'Initial inventory from supplier delivery',NULL,1,'2025-06-14 16:14:14'),(64,20,1,20,'initial_inventory',300,0,300,'Initial inventory from supplier delivery',NULL,1,'2025-06-19 12:10:06'),(65,21,1,21,'initial_inventory',90,0,90,'Initial inventory from supplier delivery',NULL,1,'2025-06-26 02:02:44'),(66,14,1,14,'audit',9,62,71,'Physical inventory count adjustment',NULL,1,'2025-06-30 22:57:28'),(67,14,1,14,'prescription_fill',-60,78,18,'60-day prescription fill','RX186703',1,'2025-07-07 05:25:45'),(68,13,1,13,'prescription_fill',-90,485,395,'90-day prescription fill','RX182551',1,'2025-07-21 11:08:20'),(69,12,1,12,'expire',-9,1700,1691,'Medication expired - removed from stock',NULL,1,'2025-06-16 04:07:30'),(70,17,1,17,'shipment_received',60,280,340,'Supplier delivery - 2 package(s)',NULL,1,'2025-07-18 23:16:39'),(71,18,1,18,'shipment_received',60,62,122,'Supplier delivery - 2 package(s)',NULL,1,'2025-08-02 21:35:59'),(72,14,1,14,'audit',7,71,78,'Physical inventory count adjustment',NULL,1,'2025-07-02 23:55:00'),(73,13,1,13,'audit',8,300,308,'Physical inventory count adjustment',NULL,1,'2025-06-11 17:04:14'),(74,17,1,17,'shipment_received',60,341,401,'Supplier delivery - 2 package(s)',NULL,1,'2025-08-01 19:46:18'),(75,20,1,20,'shipment_received',30,300,330,'Supplier delivery - 1 package(s)',NULL,1,'2025-06-20 12:10:06'),(76,12,1,12,'audit',-5,1631,1626,'Physical inventory count adjustment',NULL,1,'2025-07-03 05:13:28'),(77,16,1,16,'shipment_received',240,953,1193,'Supplier delivery - 4 package(s)',NULL,1,'2025-07-31 06:25:45'),(78,15,1,15,'shipment_received',90,54,144,'Supplier delivery - 1 package(s)',NULL,1,'2025-07-13 10:00:07'),(79,21,1,21,'prescription_fill',-60,54,-6,'60-day prescription fill','RX145422',1,'2025-07-26 02:25:00'),(80,13,1,13,'prescription_fill',-90,395,305,'90-day prescription fill','RX760055',1,'2025-07-21 17:53:22'),(81,16,1,16,'prescription_fill',-30,497,467,'30-day prescription fill','RX659914',1,'2025-07-13 09:16:14'),(82,19,1,19,'audit',-4,120,116,'Physical inventory count adjustment',NULL,1,'2025-06-15 16:14:14'),(83,19,1,19,'shipment_received',120,-20,100,'Supplier delivery - 4 package(s)',NULL,1,'2025-08-09 22:31:46'),(84,15,1,15,'return_to_stock',1,414,415,'Patient return - unused medication',NULL,1,'2025-07-24 06:17:32'),(85,13,1,13,'expire',-7,305,298,'Medication expired - removed from stock',NULL,1,'2025-07-24 01:32:35'),(86,17,1,17,'return_to_stock',1,340,341,'Patient return - unused medication',NULL,1,'2025-07-23 19:39:30'),(87,16,1,16,'audit',6,472,478,'Physical inventory count adjustment',NULL,1,'2025-06-30 22:55:26'),(88,21,1,21,'prescription_fill',-30,84,54,'90-day prescription fill','RX257221',1,'2025-07-10 18:33:35'),(89,14,1,14,'expire',-11,29,18,'Medication expired - removed from stock',NULL,1,'2025-07-12 20:18:24'),(90,15,1,15,'return_to_stock',26,220,246,'Patient return - unused medication',NULL,1,'2025-06-18 00:46:55'),(91,16,1,16,'audit',-8,480,472,'Physical inventory count adjustment',NULL,1,'2025-06-27 19:49:19'),(92,13,1,13,'expire',-20,305,285,'Medication expired - removed from stock',NULL,1,'2025-07-05 15:30:39'),(93,14,1,14,'prescription_fill',-58,120,62,'60-day prescription fill','RX275652',1,'2025-06-30 19:53:54'),(94,14,1,14,'audit',10,18,28,'Physical inventory count adjustment',NULL,1,'2025-07-19 23:01:50'),(95,15,1,15,'audit',-10,595,585,'Physical inventory count adjustment',NULL,1,'2025-08-09 01:51:53'),(96,19,1,19,'audit',-8,86,78,'Physical inventory count adjustment',NULL,1,'2025-06-23 01:50:53'),(97,17,1,17,'prescription_fill',-60,322,262,'60-day prescription fill','RX898708',1,'2025-06-26 01:53:55'),(98,19,1,19,'expire',-2,78,76,'Medication expired - removed from stock',NULL,1,'2025-06-28 13:36:12'),(99,16,1,16,'shipment_received',300,647,947,'Supplier delivery - 5 package(s)',NULL,1,'2025-07-16 20:11:23'),(100,12,1,12,'shipment_received',400,800,1200,'Supplier delivery - 4 package(s)',NULL,1,'2025-06-13 06:36:26'),(101,19,1,19,'prescription_fill',-90,88,-2,'90-day prescription fill','RX900866',1,'2025-07-22 23:16:14'),(102,21,1,21,'prescription_fill',-30,-6,-36,'60-day prescription fill','RX402207',1,'2025-08-10 02:30:45'),(103,18,1,18,'return_to_stock',10,146,156,'Patient return - unused medication',NULL,1,'2025-07-05 06:35:48'),(104,19,1,19,'audit',-6,-2,-8,'Physical inventory count adjustment',NULL,1,'2025-07-27 16:43:41'),(105,16,1,16,'shipment_received',180,467,647,'Supplier delivery - 3 package(s)',NULL,1,'2025-07-16 07:08:38'),(106,12,1,12,'expire',-7,1826,1819,'Medication expired - removed from stock',NULL,1,'2025-07-20 19:29:11'),(107,18,1,18,'expire',-9,180,171,'Medication expired - removed from stock',NULL,1,'2025-06-14 10:42:46'),(108,15,1,15,'shipment_received',270,144,414,'Supplier delivery - 3 package(s)',NULL,1,'2025-07-15 09:47:28'),(109,18,1,18,'expire',-3,65,62,'Medication expired - removed from stock',NULL,1,'2025-07-26 02:22:31'),(110,21,1,21,'audit',-6,90,84,'Physical inventory count adjustment',NULL,1,'2025-07-02 20:30:39'),(111,18,1,18,'audit',5,141,146,'Physical inventory count adjustment',NULL,1,'2025-06-28 08:02:24'),(112,12,1,12,'shipment_received',500,1200,1700,'Supplier delivery - 5 package(s)',NULL,1,'2025-06-15 22:01:33'),(113,20,1,20,'prescription_fill',-90,300,210,'90-day prescription fill','RX511047',1,'2025-08-09 19:27:25'),(114,18,1,18,'expire',-1,66,65,'Medication expired - removed from stock',NULL,1,'2025-07-16 06:05:40'),(115,16,1,16,'expire',-8,1253,1245,'Medication expired - removed from stock',NULL,1,'2025-08-04 06:57:43'),(116,15,1,15,'prescription_fill',-90,144,54,'90-day prescription fill','RX656371',1,'2025-07-08 09:49:23'),(117,14,1,14,'return_to_stock',11,18,29,'Patient return - unused medication',NULL,1,'2025-07-09 02:59:00'),(118,20,1,20,'shipment_received',30,270,300,'Supplier delivery - 1 package(s)',NULL,1,'2025-08-02 08:05:25'),(119,21,1,21,'prescription_fill',0,90,90,'30-day prescription fill','RX641249',1,'2025-06-27 02:02:44'),(120,13,1,13,'audit',-3,308,305,'Physical inventory count adjustment',NULL,1,'2025-06-11 18:53:26'),(121,15,1,15,'prescription_fill',-30,246,216,'30-day prescription fill','RX552747',1,'2025-06-19 06:18:20'),(122,16,1,16,'prescription_fill',-60,1245,1185,'60-day prescription fill','RX423538',1,'2025-08-04 09:52:00'),(123,15,1,15,'prescription_fill',-90,234,144,'90-day prescription fill','RX726293',1,'2025-06-28 15:28:27'),(124,15,1,15,'return_to_stock',10,270,280,'Patient return - unused medication',NULL,1,'2025-06-16 01:08:17'),(125,21,1,21,'prescription_fill',0,84,84,'30-day prescription fill','RX584772',1,'2025-07-07 07:48:56'),(126,18,1,18,'prescription_fill',-30,171,141,'30-day prescription fill','RX717776',1,'2025-06-20 11:13:02'),(127,15,1,15,'prescription_fill',-60,280,220,'60-day prescription fill','RX858281',1,'2025-06-16 08:19:22'),(128,17,1,17,'return_to_stock',21,301,322,'Patient return - unused medication',NULL,1,'2025-06-13 11:56:02'),(129,20,1,20,'prescription_fill',-60,330,270,'60-day prescription fill','RX114051',1,'2025-06-24 10:21:59'),(130,13,1,13,'prescription_fill',-60,298,238,'60-day prescription fill','RX631700',1,'2025-08-04 16:01:16'),(131,17,1,17,'audit',1,300,301,'Physical inventory count adjustment',NULL,1,'2025-06-12 12:48:53'),(132,12,1,12,'return_to_stock',28,1819,1847,'Patient return - unused medication',NULL,1,'2025-07-27 00:54:15'),(133,12,1,12,'audit',-1,1847,1846,'Physical inventory count adjustment',NULL,1,'2025-07-27 21:58:26'),(134,17,1,17,'return_to_stock',12,268,280,'Patient return - unused medication',NULL,1,'2025-06-30 04:17:32'),(135,18,1,18,'prescription_fill',-90,156,66,'90-day prescription fill','RX733579',1,'2025-07-09 00:22:42'),(136,16,1,16,'shipment_received',60,1193,1253,'Supplier delivery - 1 package(s)',NULL,1,'2025-08-04 05:08:18'),(137,19,1,19,'audit',-1,89,88,'Physical inventory count adjustment',NULL,1,'2025-07-20 17:31:21'),(138,19,1,19,'return_to_stock',13,76,89,'Patient return - unused medication',NULL,1,'2025-07-07 08:12:26'),(139,19,1,19,'expire',-12,-8,-20,'Medication expired - removed from stock',NULL,1,'2025-08-08 16:55:56'),(140,15,1,15,'return_to_stock',18,216,234,'Patient return - unused medication',NULL,1,'2025-06-22 11:15:03'),(141,14,1,14,'shipment_received',150,28,178,'Supplier delivery - 5 package(s)',NULL,1,'2025-07-23 10:16:01'),(142,16,1,16,'return_to_stock',19,478,497,'Patient return - unused medication',NULL,1,'2025-07-09 08:12:28'),(143,12,1,12,'prescription_fill',-90,1846,1756,'90-day prescription fill','RX490782',1,'2025-08-02 12:24:56'),(144,12,1,12,'prescription_fill',-60,1691,1631,'60-day prescription fill','RX999949',1,'2025-07-03 01:03:30'),(145,18,1,18,'return_to_stock',7,122,129,'Patient return - unused medication',NULL,1,'2025-08-09 20:54:20'),(146,12,1,12,'shipment_received',200,1626,1826,'Supplier delivery - 2 package(s)',NULL,1,'2025-07-07 17:45:38'),(147,13,1,13,'shipment_received',200,285,485,'Supplier delivery - 4 package(s)',NULL,1,'2025-07-08 18:36:25'),(148,16,1,16,'expire',-10,1180,1170,'Medication expired - removed from stock',NULL,1,'2025-08-09 02:50:52'),(149,19,1,19,'prescription_fill',-30,116,86,'30-day prescription fill','RX305687',1,'2025-06-16 13:46:08'),(150,21,1,21,'prescription_fill',0,54,54,'60-day prescription fill','RX643838',1,'2025-07-13 01:36:44'),(151,15,1,15,'shipment_received',180,415,595,'Supplier delivery - 2 package(s)',NULL,1,'2025-08-08 16:52:09'),(152,16,1,16,'audit',-5,1185,1180,'Physical inventory count adjustment',NULL,1,'2025-08-06 22:13:14'),(153,16,1,16,'shipment_received',240,240,480,'Supplier delivery - 4 package(s)',NULL,1,'2025-06-16 19:35:27'),(154,16,1,16,'audit',6,947,953,'Physical inventory count adjustment',NULL,1,'2025-07-17 15:36:49'),(155,17,1,17,'return_to_stock',6,262,268,'Patient return - unused medication',NULL,1,'2025-06-28 21:32:27'),(156,12,1,12,'audit',5,1756,1761,'Test audit transaction',NULL,1,'2025-08-10 20:35:10'),(157,12,1,12,'audit',5,1761,1766,'Test audit transaction',NULL,1,'2025-08-10 20:37:06'),(158,12,1,12,'prescription_fill',-10,1766,1756,'Prescription fill','20',1,'2025-08-10 21:27:57'),(159,12,1,12,'audit',10,1756,1766,'Test audit from API script',NULL,1,'2025-08-11 01:12:15'),(160,12,1,12,'audit',5,1766,1771,'Test audit - fixed validation issue',NULL,1,'2025-08-11 01:14:23'),(161,12,1,12,'audit',-21,1771,1750,'need to validate count',NULL,1,'2025-08-11 01:15:01'),(162,12,1,12,'audit',-1650,1750,100,'bored',NULL,1,'2025-08-12 14:53:17'),(163,12,1,12,'audit',0,100,100,'jjj',NULL,1,'2025-08-13 05:12:49'),(164,12,1,12,'prescription_fill',-12,100,88,'Prescription fill','1122',1,'2025-08-13 20:25:29'),(165,12,1,12,'prescription_fill',-12,88,76,'Prescription fill','12',1,'2025-08-13 20:33:19'),(166,12,1,12,'return_to_stock',12,76,88,'qw','12',1,'2025-08-13 20:33:33'),(167,12,1,12,'return_to_stock',12,88,100,'Returned to stock','1122',1,'2025-08-13 20:34:33'),(168,12,1,12,'expire',-12,100,88,'as',NULL,1,'2025-08-13 20:36:57'),(169,12,1,12,'audit',-5,88,83,'sdfgds',NULL,1,'2025-08-13 20:39:53'),(170,12,1,12,'shipment_received',5,83,88,'Test transaction for snapshot system','TEST-1755134996657',1,'2025-08-14 01:29:56'),(171,12,1,12,'shipment_received',5,88,93,'Test transaction for snapshot system','TEST-1755135016388',1,'2025-08-14 01:30:16'),(172,12,1,12,'shipment_received',5,93,98,'Test snapshot consistency',NULL,1,'2025-08-15 02:06:23'),(173,12,1,12,'shipment_received',5,98,103,'Test Shipment received',NULL,1,'2025-08-15 02:06:23'),(174,12,1,12,'prescription_fill',-2,103,101,'Test Prescription fill',NULL,1,'2025-08-15 02:06:23'),(175,12,1,12,'return_to_stock',1,101,102,'Test Return to stock',NULL,1,'2025-08-15 02:06:23'),(176,12,1,12,'expire',-1,102,101,'Test Medication expired',NULL,1,'2025-08-15 02:06:23'),(177,12,1,12,'shipment_received',2,101,103,'Test successful adjustment',NULL,1,'2025-08-15 02:06:55'),(178,12,1,12,'audit',-2,103,101,'Reverse test adjustment',NULL,1,'2025-08-15 02:06:55'),(179,12,1,12,'audit',795,101,896,'Cycle count adjustment - system populated',NULL,1,'2025-08-15 13:44:40'),(180,13,1,13,'audit',1080,238,1318,'Cycle count adjustment - system populated',NULL,1,'2025-08-15 13:44:40'),(181,14,1,14,'audit',1022,178,1200,'Cycle count adjustment - system populated',NULL,1,'2025-08-15 13:44:40'),(182,15,1,15,'audit',177,585,762,'Cycle count adjustment - system populated',NULL,1,'2025-08-15 13:44:40'),(183,16,1,16,'audit',-557,1170,613,'Cycle count adjustment - system populated',NULL,1,'2025-08-15 13:44:40'),(184,17,1,17,'audit',50,401,451,'Cycle count adjustment - system populated',NULL,1,'2025-08-15 13:44:40'),(185,18,1,18,'audit',-52,129,77,'Cycle count adjustment - system populated',NULL,1,'2025-08-15 13:44:40'),(186,19,1,19,'audit',159,100,259,'Cycle count adjustment - system populated',NULL,1,'2025-08-15 13:44:40'),(187,20,1,20,'audit',-135,210,75,'Cycle count adjustment - system populated',NULL,1,'2025-08-15 13:44:40'),(188,21,1,21,'audit',477,-36,441,'Cycle count adjustment - system populated',NULL,1,'2025-08-15 13:44:40'),(189,54,2,12,'initial_inventory',1414,0,1414,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:40'),(190,55,2,13,'initial_inventory',1304,0,1304,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:40'),(191,56,2,14,'initial_inventory',618,0,618,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(192,57,2,15,'initial_inventory',1191,0,1191,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(193,58,2,16,'initial_inventory',523,0,523,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(194,59,2,17,'initial_inventory',174,0,174,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(195,60,2,18,'initial_inventory',53,0,53,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(196,61,2,19,'initial_inventory',243,0,243,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(197,62,2,20,'initial_inventory',343,0,343,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(198,63,2,21,'initial_inventory',87,0,87,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(199,64,3,12,'initial_inventory',1556,0,1556,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(200,65,3,13,'initial_inventory',518,0,518,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(201,66,3,14,'initial_inventory',1045,0,1045,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(202,67,3,15,'initial_inventory',1715,0,1715,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(203,68,3,16,'initial_inventory',1070,0,1070,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(204,69,3,17,'initial_inventory',421,0,421,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(205,70,3,18,'initial_inventory',178,0,178,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(206,71,3,19,'initial_inventory',361,0,361,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(207,72,3,20,'initial_inventory',182,0,182,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(208,73,3,21,'initial_inventory',167,0,167,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(209,74,4,12,'initial_inventory',1255,0,1255,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(210,75,4,13,'initial_inventory',1504,0,1504,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(211,76,4,14,'initial_inventory',829,0,829,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(212,77,4,15,'initial_inventory',966,0,966,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(213,78,4,16,'initial_inventory',1786,0,1786,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(214,79,4,17,'initial_inventory',488,0,488,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(215,80,4,18,'initial_inventory',485,0,485,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(216,81,4,19,'initial_inventory',197,0,197,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(217,82,4,20,'initial_inventory',320,0,320,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(218,83,4,21,'initial_inventory',488,0,488,'Initial cycle count inventory setup',NULL,1,'2025-08-15 13:44:41'),(219,12,1,12,'prescription_fill',-6,896,890,'Prescription fill - Rx# 666','666',1,'2025-08-16 03:22:54'),(220,20,1,20,'prescription_fill',-50,75,25,'Large prescription fill - Store 1','RX-STORE1-1000',1,'2025-08-23 20:37:47'),(221,18,1,18,'prescription_fill',-80,77,0,'Large prescription fill - Store 1','RX-STORE1-1001',1,'2025-08-23 20:37:47'),(222,19,1,19,'prescription_fill',-110,259,149,'Large prescription fill - Store 1','RX-STORE1-1002',1,'2025-08-23 20:37:47'),(223,60,2,18,'shipment_received',200,53,253,'Large shipment - Store 2','SHIP-STORE2-2000',1,'2025-08-23 20:37:47'),(224,63,2,21,'shipment_received',300,87,387,'Large shipment - Store 2','SHIP-STORE2-2001',1,'2025-08-23 20:37:47'),(225,59,2,17,'shipment_received',400,174,574,'Large shipment - Store 2','SHIP-STORE2-2002',1,'2025-08-23 20:37:47');
/*!40000 ALTER TABLE `inventory_audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_it_notes`
--

DROP TABLE IF EXISTS `post_it_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_it_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `position_x` int NOT NULL DEFAULT '300',
  `position_y` int NOT NULL DEFAULT '100',
  `color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'yellow',
  `is_pinned` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_store_active` (`store_id`,`is_active`),
  KEY `idx_store_pinned` (`store_id`,`is_pinned`,`is_active`),
  KEY `idx_user_store` (`user_id`,`store_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_updated_at` (`updated_at`),
  CONSTRAINT `post_it_notes_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_it_notes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_it_notes`
--

LOCK TABLES `post_it_notes` WRITE;
/*!40000 ALTER TABLE `post_it_notes` DISABLE KEYS */;
INSERT INTO `post_it_notes` VALUES (1,1,1,'Welcome to PharmaTraK!\n\nThis is a pinned note that will always be visible to store users.\n\nDouble-click to edit, drag to move!',317,118,'yellow',1,0,'2025-08-18 15:34:49','2025-08-18 16:13:51'),(2,1,1,'Reminder: Weekly inventory count due Friday\n\n• Check refrigerated items\n• Update expiration dates\n• Submit report by 5 PM',650,150,'orange',1,0,'2025-08-18 15:34:49','2025-08-18 16:13:48'),(3,1,1,'New shipment arrived:\n\n• Amoxicillin 500mg\n• Lisinopril 10mg\n• Metformin 1000mg\n\nStore in appropriate sections',320,450,'blue',0,0,'2025-08-18 15:34:49','2025-08-18 16:13:45'),(4,1,1,'Test note',300,200,'yellow',0,0,'2025-08-18 15:58:27','2025-08-18 16:13:46'),(5,1,1,'',563,689,'yellow',0,0,'2025-08-18 16:13:56','2025-08-18 16:14:02'),(6,1,1,'',847,448,'yellow',1,0,'2025-08-19 05:20:05','2025-08-19 05:21:13'),(7,1,1,'',845,427,'yellow',1,0,'2025-08-19 05:21:22','2025-08-19 05:26:17'),(8,1,1,'',665,307,'pink',0,0,'2025-08-19 05:26:19','2025-08-19 05:26:32'),(9,1,1,'',388,371,'pink',0,0,'2025-08-19 05:34:31','2025-08-19 05:34:58'),(10,1,1,'',760,268,'orange',0,0,'2025-08-19 05:34:36','2025-08-19 05:34:54'),(11,1,1,'',729,556,'pink',0,0,'2025-08-19 05:34:42','2025-08-19 05:34:46'),(12,1,1,'',954,123,'blue',0,0,'2025-08-19 05:34:49','2025-08-19 05:34:53'),(13,1,1,'',945,433,'yellow',0,0,'2025-08-19 05:39:36','2025-08-19 05:39:47'),(14,1,1,'',1031,324,'blue',0,0,'2025-08-19 05:39:48','2025-08-19 05:40:55'),(15,1,1,'',638,511,'orange',0,0,'2025-08-19 05:42:04','2025-08-19 05:47:31'),(16,1,1,'',1063,265,'yellow',0,0,'2025-08-19 05:42:08','2025-08-19 05:47:33'),(17,1,1,'',755,594,'yellow',0,0,'2025-08-19 05:42:12','2025-08-19 05:47:29'),(18,1,1,'Test note',591,323,'yellow',0,0,'2025-08-19 05:44:24','2025-08-19 05:49:18'),(19,1,1,'asfsdfas',832,336,'yellow',0,0,'2025-08-19 05:50:42','2025-08-19 05:51:40'),(20,1,1,'',808,298,'orange',0,0,'2025-08-19 05:51:29','2025-08-19 05:51:35'),(21,1,1,'',692,463,'pink',1,0,'2025-08-19 06:05:32','2025-08-19 13:19:53'),(22,1,1,'',939,400,'orange',0,0,'2025-08-20 03:05:00','2025-08-20 03:05:08'),(23,1,1,'',1261,635,'pink',0,0,'2025-08-20 03:39:02','2025-08-20 03:39:05'),(24,1,1,'test noe',828,317,'yellow',1,0,'2025-08-21 02:43:36','2025-08-21 02:44:04'),(25,1,1,'',325,167,'yellow',1,0,'2025-08-21 02:50:01','2025-08-21 02:50:22'),(26,1,1,'',560,234,'yellow',0,0,'2025-08-21 02:50:32','2025-08-21 02:50:41'),(27,1,1,'',1510,112,'orange',0,0,'2025-08-21 02:50:45','2025-08-21 02:50:48'),(28,1,1,'',1283,240,'pink',0,0,'2025-08-21 02:50:50','2025-08-21 02:50:51'),(29,1,1,'',422,415,'pink',0,0,'2025-08-21 02:50:53','2025-08-21 02:50:58'),(30,1,1,'',938,487,'orange',0,0,'2025-08-21 04:01:42','2025-08-21 04:01:45'),(31,1,1,'',1838,198,'pink',0,0,'2025-08-21 06:58:54','2025-08-21 06:58:56'),(32,1,1,'',619,181,'orange',0,0,'2025-08-23 03:22:31','2025-08-23 03:22:37');
/*!40000 ALTER TABLE `post_it_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store_access`
--

DROP TABLE IF EXISTS `store_access`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_access` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `store_id` int NOT NULL,
  `access_level` enum('read','write','admin','god_mode') COLLATE utf8mb4_unicode_ci DEFAULT 'read',
  `granted_by` int DEFAULT NULL,
  `granted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_store_access` (`user_id`,`store_id`),
  KEY `granted_by` (`granted_by`),
  KEY `idx_store_access_user` (`user_id`),
  KEY `idx_store_access_store` (`store_id`),
  KEY `idx_store_access_active` (`is_active`,`access_level`),
  CONSTRAINT `store_access_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_access_ibfk_2` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_access_ibfk_3` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_access`
--

LOCK TABLES `store_access` WRITE;
/*!40000 ALTER TABLE `store_access` DISABLE KEYS */;
/*!40000 ALTER TABLE `store_access` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store_inventory`
--

DROP TABLE IF EXISTS `store_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_inventory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `drug_id` int NOT NULL,
  `quantity_on_hand` int DEFAULT '0',
  `reorder_level` int DEFAULT '0',
  `unit_cost` decimal(10,4) DEFAULT NULL,
  `selling_price` decimal(10,4) DEFAULT NULL,
  `lot_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiration_date` date DEFAULT NULL,
  `supplier` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_store_drug_lot` (`store_id`,`drug_id`,`lot_number`),
  KEY `drug_id` (`drug_id`),
  KEY `idx_store_drug` (`store_id`,`drug_id`),
  KEY `idx_store_active` (`store_id`,`is_active`),
  KEY `idx_expiration` (`expiration_date`),
  KEY `idx_reorder` (`reorder_level`,`quantity_on_hand`),
  KEY `idx_inventory_low_stock` (`store_id`,`is_active`,`quantity_on_hand`,`reorder_level`),
  KEY `idx_inventory_expiring` (`store_id`,`is_active`,`expiration_date`),
  KEY `idx_inventory_last_updated` (`last_updated` DESC),
  KEY `idx_inventory_covering` (`store_id`,`is_active`,`quantity_on_hand`,`drug_id`,`expiration_date`,`lot_number`),
  CONSTRAINT `store_inventory_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_inventory_ibfk_2` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_inventory`
--

LOCK TABLES `store_inventory` WRITE;
/*!40000 ALTER TABLE `store_inventory` DISABLE KEYS */;
INSERT INTO `store_inventory` VALUES (12,1,12,890,264,29.5600,106.2700,NULL,NULL,'Cardinal Health',1,'2025-08-16 03:22:54','2025-08-10 20:25:52'),(13,1,13,1318,378,14.9500,109.6700,NULL,NULL,'Cardinal Health',1,'2025-08-15 13:44:40','2025-08-10 20:25:52'),(14,1,14,1200,338,8.6700,102.9200,NULL,NULL,'Cardinal Health',1,'2025-08-15 13:44:40','2025-08-10 20:25:52'),(15,1,15,762,180,50.2100,12.3600,NULL,NULL,'Cardinal Health',1,'2025-08-15 13:44:40','2025-08-10 20:25:52'),(16,1,16,613,180,45.5800,10.2700,NULL,NULL,'Cardinal Health',1,'2025-08-15 13:44:40','2025-08-10 20:25:52'),(17,1,17,451,92,43.4500,53.3400,NULL,NULL,'Cardinal Health',1,'2025-08-15 13:44:40','2025-08-10 20:25:52'),(18,1,18,0,16,6.7400,101.6600,NULL,NULL,'Cardinal Health',1,'2025-08-23 20:37:47','2025-08-10 20:25:52'),(19,1,19,149,64,42.1200,91.7500,NULL,NULL,'Cardinal Health',1,'2025-08-23 20:37:47','2025-08-10 20:25:52'),(20,1,20,25,17,24.5300,37.2600,NULL,NULL,'Cardinal Health',1,'2025-08-23 20:37:47','2025-08-10 20:25:52'),(21,1,21,441,99,40.4800,11.1800,NULL,NULL,'Cardinal Health',1,'2025-08-15 13:44:40','2025-08-10 20:25:52'),(54,2,12,1414,387,21.5325,38.3822,'LOTX6DRWP','2028-05-15','Supplier-7',1,'2025-08-15 13:44:40','2025-08-15 13:44:40'),(55,2,13,1304,312,19.0121,35.3389,'LOTRQ4D1E','2027-04-15','Supplier-10',1,'2025-08-15 13:44:40','2025-08-15 13:44:40'),(56,2,14,618,178,28.8026,54.7530,'LOTCXP4CV','2027-07-15','Supplier-4',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(57,2,15,1191,297,6.8785,10.2946,'LOTVVF9JM','2027-04-15','Supplier-4',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(58,2,16,523,135,33.8133,54.9384,'LOTZNFL6Z','2026-09-15','Supplier-7',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(59,2,17,574,41,20.4805,24.7751,'LOT2NAJSA','2026-08-15','Supplier-11',1,'2025-08-23 20:37:47','2025-08-15 13:44:41'),(60,2,18,253,13,5.6654,10.1737,'LOTJWVUX8','2026-06-15','Supplier-10',1,'2025-08-23 20:37:47','2025-08-15 13:44:41'),(61,2,19,243,54,34.7917,52.9158,'LOTZHC95Z','2026-10-15','Supplier-12',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(62,2,20,343,80,31.5283,61.7710,'LOTNPC7I4','2027-05-15','Supplier-20',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(63,2,21,387,23,12.0778,18.4137,'LOTQ5D9EJ','2026-07-15','Supplier-16',1,'2025-08-23 20:37:47','2025-08-15 13:44:41'),(64,3,12,1556,395,27.9680,49.7297,'LOTCHILK0','2027-12-15','Supplier-20',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(65,3,13,518,125,24.8597,43.4918,'LOT14BVPU','2027-12-15','Supplier-2',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(66,3,14,1045,225,8.9562,16.9979,'LOTM4FQNN','2027-06-15','Supplier-18',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(67,3,15,1715,476,29.5416,42.0705,'LOTOFBW1H','2026-03-15','Supplier-7',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(68,3,16,1070,236,7.3993,10.5861,'LOTMLCCN7','2028-04-15','Supplier-2',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(69,3,17,421,93,37.9165,53.3587,'LOTVI97YG','2027-09-15','Supplier-9',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(70,3,18,178,48,7.5023,9.1490,'LOTRIAXXO','2027-09-15','Supplier-14',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(71,3,19,361,73,20.3676,35.6069,'LOTEEBVE4','2026-12-15','Supplier-20',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(72,3,20,182,36,48.4485,81.0410,'LOTDLZ07I','2028-06-15','Supplier-10',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(73,3,21,167,43,42.6740,78.9691,'LOT6N3ZJO','2028-05-15','Supplier-17',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(74,4,12,1255,372,20.3766,36.7649,'LOT8QB3JY','2028-06-15','Supplier-10',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(75,4,13,1504,324,19.1754,25.0736,'LOT9I2EGG','2027-08-15','Supplier-11',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(76,4,14,829,230,16.9522,30.4471,'LOT8M8EUG','2026-10-15','Supplier-14',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(77,4,15,966,232,0.5702,0.9789,'LOTFPGOWU','2027-11-15','Supplier-5',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(78,4,16,1786,457,14.8368,28.9632,'LOTPN1A9K','2028-01-15','Supplier-13',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(79,4,17,488,113,33.0625,47.9063,'LOTCM1DF2','2026-02-15','Supplier-18',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(80,4,18,485,141,26.5104,51.3908,'LOTS8JPN5','2026-05-15','Supplier-16',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(81,4,19,197,52,28.1160,34.8846,'LOT1W47H8','2028-01-15','Supplier-18',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(82,4,20,320,85,34.4478,68.6945,'LOTR8XVZF','2026-09-15','Supplier-9',1,'2025-08-15 13:44:41','2025-08-15 13:44:41'),(83,4,21,488,116,43.5458,65.7592,'LOTJWE87Q','2028-05-15','Supplier-17',1,'2025-08-15 13:44:41','2025-08-15 13:44:41');
/*!40000 ALTER TABLE `store_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store_inventory_snapshot`
--

DROP TABLE IF EXISTS `store_inventory_snapshot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_inventory_snapshot` (
  `id` int NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `drug_id` int NOT NULL,
  `quantity_on_hand` int NOT NULL DEFAULT '0',
  `last_transaction_id` int DEFAULT NULL COMMENT 'Reference to the most recent audit log entry',
  `last_transaction_date` timestamp NULL DEFAULT NULL COMMENT 'Date of the most recent transaction',
  `last_transaction_type` enum('prescription_fill','return_to_stock','expire','audit','shipment_received','initial_inventory') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_updated_by` int DEFAULT NULL COMMENT 'User who performed the last transaction',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_store_drug_snapshot` (`store_id`,`drug_id`),
  KEY `last_updated_by` (`last_updated_by`),
  KEY `idx_store_drug` (`store_id`,`drug_id`),
  KEY `idx_store` (`store_id`),
  KEY `idx_drug` (`drug_id`),
  KEY `idx_last_transaction` (`last_transaction_id`),
  KEY `idx_last_transaction_date` (`last_transaction_date`),
  KEY `idx_quantity` (`quantity_on_hand`),
  KEY `idx_store_low_stock` (`store_id`,`quantity_on_hand`),
  KEY `idx_snapshot_transaction_type` (`last_transaction_type`),
  KEY `idx_snapshot_store_quantity` (`store_id`,`quantity_on_hand` DESC),
  CONSTRAINT `store_inventory_snapshot_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_inventory_snapshot_ibfk_2` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_inventory_snapshot_ibfk_3` FOREIGN KEY (`last_transaction_id`) REFERENCES `inventory_audit_log` (`id`) ON DELETE SET NULL,
  CONSTRAINT `store_inventory_snapshot_ibfk_4` FOREIGN KEY (`last_updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_inventory_snapshot`
--

LOCK TABLES `store_inventory_snapshot` WRITE;
/*!40000 ALTER TABLE `store_inventory_snapshot` DISABLE KEYS */;
INSERT INTO `store_inventory_snapshot` VALUES (1,1,12,95,219,'2025-08-16 03:22:54','prescription_fill',1,'2025-08-14 01:23:50','2025-08-16 03:22:54'),(2,1,13,238,130,'2025-08-04 16:01:16','prescription_fill',1,'2025-08-14 01:23:50','2025-08-14 01:23:50'),(3,1,14,178,141,'2025-07-23 10:16:01','shipment_received',1,'2025-08-14 01:23:50','2025-08-14 01:23:50'),(4,1,15,585,95,'2025-08-09 01:51:53','audit',1,'2025-08-14 01:23:50','2025-08-14 01:23:50'),(5,1,16,1170,148,'2025-08-09 02:50:52','expire',1,'2025-08-14 01:23:50','2025-08-14 01:23:50'),(6,1,17,401,74,'2025-08-01 19:46:18','shipment_received',1,'2025-08-14 01:23:50','2025-08-14 01:23:50'),(7,1,18,129,145,'2025-08-09 20:54:20','return_to_stock',1,'2025-08-14 01:23:50','2025-08-14 01:23:50'),(8,1,19,100,83,'2025-08-09 22:31:46','shipment_received',1,'2025-08-14 01:23:50','2025-08-14 01:23:50'),(9,1,20,210,113,'2025-08-09 19:27:25','prescription_fill',1,'2025-08-14 01:23:50','2025-08-14 01:23:50'),(10,1,21,-36,102,'2025-08-10 02:30:45','prescription_fill',1,'2025-08-14 01:23:50','2025-08-14 01:23:50');
/*!40000 ALTER TABLE `store_inventory_snapshot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store_inventory_snapshot_history`
--

DROP TABLE IF EXISTS `store_inventory_snapshot_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_inventory_snapshot_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `drug_id` int NOT NULL,
  `snapshot_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `quantity_on_hand` int NOT NULL DEFAULT '0',
  `quantity_change` int NOT NULL DEFAULT '0',
  `transaction_id` int DEFAULT NULL,
  `transaction_type` enum('prescription_fill','return_to_stock','expire','audit','shipment_received','initial_inventory') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `performed_by` int DEFAULT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `drug_id` (`drug_id`),
  KEY `performed_by` (`performed_by`),
  KEY `idx_store_drug_date` (`store_id`,`drug_id`,`snapshot_date` DESC),
  KEY `idx_store_drug` (`store_id`,`drug_id`),
  KEY `idx_snapshot_date` (`snapshot_date`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_transaction_type` (`transaction_type`),
  CONSTRAINT `store_inventory_snapshot_history_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_inventory_snapshot_history_ibfk_2` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_inventory_snapshot_history_ibfk_3` FOREIGN KEY (`transaction_id`) REFERENCES `inventory_audit_log` (`id`) ON DELETE SET NULL,
  CONSTRAINT `store_inventory_snapshot_history_ibfk_4` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_inventory_snapshot_history`
--

LOCK TABLES `store_inventory_snapshot_history` WRITE;
/*!40000 ALTER TABLE `store_inventory_snapshot_history` DISABLE KEYS */;
INSERT INTO `store_inventory_snapshot_history` VALUES (1,1,12,'2025-08-16 03:22:54',890,-6,219,'prescription_fill','Prescription fill - Rx# 666',1,'666','2025-08-18 03:16:19'),(2,1,12,'2025-08-15 13:44:40',896,795,179,'audit','Cycle count adjustment - system populated',1,NULL,'2025-08-18 03:16:19'),(3,1,12,'2025-08-15 02:06:55',101,-2,178,'audit','Reverse test adjustment',1,NULL,'2025-08-18 03:16:19'),(4,1,12,'2025-08-15 02:06:55',103,2,177,'shipment_received','Test successful adjustment',1,NULL,'2025-08-18 03:16:19'),(5,1,12,'2025-08-15 02:06:23',101,-1,176,'expire','Test Medication expired',1,NULL,'2025-08-18 03:16:19'),(6,1,13,'2025-08-15 13:44:40',1318,1080,180,'audit','Cycle count adjustment - system populated',1,NULL,'2025-08-18 03:16:19'),(7,1,13,'2025-08-04 16:01:16',238,-60,130,'prescription_fill','60-day prescription fill',1,'RX631700','2025-08-18 03:16:19'),(8,1,13,'2025-07-24 01:32:35',298,-7,85,'expire','Medication expired - removed from stock',1,NULL,'2025-08-18 03:16:19'),(9,1,13,'2025-07-21 17:53:22',305,-90,80,'prescription_fill','90-day prescription fill',1,'RX760055','2025-08-18 03:16:19'),(10,1,13,'2025-07-21 11:08:20',395,-90,68,'prescription_fill','90-day prescription fill',1,'RX182551','2025-08-18 03:16:19'),(11,1,14,'2025-08-15 13:44:40',1200,1022,181,'audit','Cycle count adjustment - system populated',1,NULL,'2025-08-18 03:16:19'),(12,1,14,'2025-07-23 10:16:01',178,150,141,'shipment_received','Supplier delivery - 5 package(s)',1,NULL,'2025-08-18 03:16:19'),(13,1,14,'2025-07-19 23:01:50',28,10,94,'audit','Physical inventory count adjustment',1,NULL,'2025-08-18 03:16:19'),(14,1,15,'2025-08-15 13:44:40',762,177,182,'audit','Cycle count adjustment - system populated',1,NULL,'2025-08-18 03:16:19'),(15,1,15,'2025-08-09 01:51:53',585,-10,95,'audit','Physical inventory count adjustment',1,NULL,'2025-08-18 03:16:19'),(16,1,15,'2025-08-08 16:52:09',595,180,151,'shipment_received','Supplier delivery - 2 package(s)',1,NULL,'2025-08-18 03:16:19'),(17,1,15,'2025-07-24 06:17:32',415,1,84,'return_to_stock','Patient return - unused medication',1,NULL,'2025-08-18 03:16:19'),(18,1,16,'2025-08-15 13:44:40',613,-557,183,'audit','Cycle count adjustment - system populated',1,NULL,'2025-08-18 03:16:19'),(19,1,16,'2025-08-09 02:50:52',1170,-10,148,'expire','Medication expired - removed from stock',1,NULL,'2025-08-18 03:16:19'),(20,1,16,'2025-08-06 22:13:14',1180,-5,152,'audit','Physical inventory count adjustment',1,NULL,'2025-08-18 03:16:19'),(21,1,16,'2025-08-04 09:52:00',1185,-60,122,'prescription_fill','60-day prescription fill',1,'RX423538','2025-08-18 03:16:19'),(22,1,16,'2025-08-04 06:57:43',1245,-8,115,'expire','Medication expired - removed from stock',1,NULL,'2025-08-18 03:16:19'),(23,1,17,'2025-08-15 13:44:40',451,50,184,'audit','Cycle count adjustment - system populated',1,NULL,'2025-08-18 03:16:19'),(24,1,17,'2025-08-01 19:46:18',401,60,74,'shipment_received','Supplier delivery - 2 package(s)',1,NULL,'2025-08-18 03:16:19'),(25,1,17,'2025-07-23 19:39:30',341,1,86,'return_to_stock','Patient return - unused medication',1,NULL,'2025-08-18 03:16:19'),(26,1,18,'2025-08-15 13:44:40',77,-52,185,'audit','Cycle count adjustment - system populated',1,NULL,'2025-08-18 03:16:19'),(27,1,18,'2025-08-09 20:54:20',129,7,145,'return_to_stock','Patient return - unused medication',1,NULL,'2025-08-18 03:16:19'),(28,1,18,'2025-08-02 21:35:59',122,60,71,'shipment_received','Supplier delivery - 2 package(s)',1,NULL,'2025-08-18 03:16:19'),(29,1,18,'2025-07-26 02:22:31',62,-3,109,'expire','Medication expired - removed from stock',1,NULL,'2025-08-18 03:16:19'),(30,1,19,'2025-08-15 13:44:40',259,159,186,'audit','Cycle count adjustment - system populated',1,NULL,'2025-08-18 03:16:19'),(31,1,19,'2025-08-09 22:31:46',100,120,83,'shipment_received','Supplier delivery - 4 package(s)',1,NULL,'2025-08-18 03:16:19'),(32,1,19,'2025-08-08 16:55:56',-20,-12,139,'expire','Medication expired - removed from stock',1,NULL,'2025-08-18 03:16:19'),(33,1,19,'2025-07-27 16:43:41',-8,-6,104,'audit','Physical inventory count adjustment',1,NULL,'2025-08-18 03:16:19'),(34,1,19,'2025-07-22 23:16:14',-2,-90,101,'prescription_fill','90-day prescription fill',1,'RX900866','2025-08-18 03:16:19'),(35,1,20,'2025-08-15 13:44:40',75,-135,187,'audit','Cycle count adjustment - system populated',1,NULL,'2025-08-18 03:16:19'),(36,1,20,'2025-08-09 19:27:25',210,-90,113,'prescription_fill','90-day prescription fill',1,'RX511047','2025-08-18 03:16:19'),(37,1,20,'2025-08-02 08:05:25',300,30,118,'shipment_received','Supplier delivery - 1 package(s)',1,NULL,'2025-08-18 03:16:19'),(38,1,21,'2025-08-15 13:44:40',441,477,188,'audit','Cycle count adjustment - system populated',1,NULL,'2025-08-18 03:16:19'),(39,1,21,'2025-08-10 02:30:45',-36,-30,102,'prescription_fill','60-day prescription fill',1,'RX402207','2025-08-18 03:16:19'),(40,1,21,'2025-07-26 02:25:00',-6,-60,79,'prescription_fill','60-day prescription fill',1,'RX145422','2025-08-18 03:16:19'),(41,2,12,'2025-08-15 13:44:40',1414,1414,189,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(42,2,13,'2025-08-15 13:44:40',1304,1304,190,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(43,2,14,'2025-08-15 13:44:41',618,618,191,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(44,2,15,'2025-08-15 13:44:41',1191,1191,192,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(45,2,16,'2025-08-15 13:44:41',523,523,193,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(46,2,17,'2025-08-15 13:44:41',174,174,194,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(47,2,18,'2025-08-15 13:44:41',53,53,195,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(48,2,19,'2025-08-15 13:44:41',243,243,196,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(49,2,20,'2025-08-15 13:44:41',343,343,197,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(50,2,21,'2025-08-15 13:44:41',87,87,198,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(51,3,12,'2025-08-15 13:44:41',1556,1556,199,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(52,3,13,'2025-08-15 13:44:41',518,518,200,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(53,3,14,'2025-08-15 13:44:41',1045,1045,201,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(54,3,15,'2025-08-15 13:44:41',1715,1715,202,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(55,3,16,'2025-08-15 13:44:41',1070,1070,203,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(56,3,17,'2025-08-15 13:44:41',421,421,204,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(57,3,18,'2025-08-15 13:44:41',178,178,205,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(58,3,19,'2025-08-15 13:44:41',361,361,206,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(59,3,20,'2025-08-15 13:44:41',182,182,207,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(60,3,21,'2025-08-15 13:44:41',167,167,208,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(61,4,12,'2025-08-15 13:44:41',1255,1255,209,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(62,4,13,'2025-08-15 13:44:41',1504,1504,210,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(63,4,14,'2025-08-15 13:44:41',829,829,211,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(64,4,15,'2025-08-15 13:44:41',966,966,212,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(65,4,16,'2025-08-15 13:44:41',1786,1786,213,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(66,4,17,'2025-08-15 13:44:41',488,488,214,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(67,4,18,'2025-08-15 13:44:41',485,485,215,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(68,4,19,'2025-08-15 13:44:41',197,197,216,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(69,4,20,'2025-08-15 13:44:41',320,320,217,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19'),(70,4,21,'2025-08-15 13:44:41',488,488,218,'initial_inventory','Initial cycle count inventory setup',1,NULL,'2025-08-18 03:16:19');
/*!40000 ALTER TABLE `store_inventory_snapshot_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store_settings`
--

DROP TABLE IF EXISTS `store_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` json NOT NULL COMMENT 'Stores setting value as JSON for flexibility',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Human readable description of the setting',
  `data_type` enum('string','number','boolean','json','array') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string',
  `is_system` tinyint(1) DEFAULT '0' COMMENT 'System settings vs user-configurable settings',
  `created_by` int NOT NULL COMMENT 'Admin user who created the setting',
  `updated_by` int NOT NULL COMMENT 'Admin user who last updated the setting',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_store_setting` (`store_id`,`setting_key`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_setting_key` (`setting_key`),
  KEY `idx_is_system` (`is_system`),
  KEY `idx_updated_at` (`updated_at`),
  KEY `idx_store_settings_updated` (`updated_at` DESC),
  CONSTRAINT `store_settings_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_settings_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `store_settings_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_settings`
--

LOCK TABLES `store_settings` WRITE;
/*!40000 ALTER TABLE `store_settings` DISABLE KEYS */;
INSERT INTO `store_settings` VALUES (1,1,'default_theme','\"bootstrap\"','Default theme for all users in this store','string',0,1,1,'2025-08-12 15:08:02','2025-08-12 15:08:02'),(2,1,'default_font_family','\"system\"','Default font family for all users in this store','string',0,1,1,'2025-08-12 15:08:02','2025-08-12 15:08:02'),(3,1,'default_font_size','\"medium\"','Default font size for all users in this store','string',0,1,1,'2025-08-12 15:08:02','2025-08-12 15:08:02'),(4,1,'session_timeout_hours','8','Session timeout in hours for store users','number',0,1,1,'2025-08-12 15:08:02','2025-08-12 15:08:02'),(5,1,'auto_backup_enabled','true','Enable automatic daily backups for this store','boolean',0,1,1,'2025-08-12 15:08:02','2025-08-12 15:08:02'),(6,1,'low_stock_threshold','10','Default low stock threshold for inventory alerts','number',0,1,1,'2025-08-12 15:08:02','2025-08-12 15:08:02'),(7,1,'expiration_alert_days','30','Days before expiration to show alerts','number',0,1,1,'2025-08-12 15:08:02','2025-08-12 15:08:02'),(8,1,'require_prescription_verification','true','Require prescription verification for controlled substances','boolean',0,1,1,'2025-08-12 15:08:02','2025-08-12 15:08:02');
/*!40000 ALTER TABLE `store_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store_settings_history`
--

DROP TABLE IF EXISTS `store_settings_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_settings_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `store_setting_id` int NOT NULL,
  `store_id` int NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` json DEFAULT NULL COMMENT 'Previous setting value',
  `new_value` json NOT NULL COMMENT 'New setting value',
  `changed_by` int NOT NULL COMMENT 'Admin user who made the change',
  `change_reason` text COLLATE utf8mb4_unicode_ci COMMENT 'Optional reason for the change',
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_store_setting_id` (`store_setting_id`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_setting_key` (`setting_key`),
  KEY `idx_changed_by` (`changed_by`),
  KEY `idx_changed_at` (`changed_at`),
  CONSTRAINT `store_settings_history_ibfk_1` FOREIGN KEY (`store_setting_id`) REFERENCES `store_settings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_settings_history_ibfk_2` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_settings_history_ibfk_3` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_settings_history`
--

LOCK TABLES `store_settings_history` WRITE;
/*!40000 ALTER TABLE `store_settings_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `store_settings_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stores`
--

DROP TABLE IF EXISTS `stores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `zipcode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(11) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fax` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dea_registration_number` char(9) COLLATE utf8mb4_unicode_ci NOT NULL,
  `npi` char(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_user_id` int DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dea_registration_number` (`dea_registration_number`),
  UNIQUE KEY `npi` (`npi`),
  KEY `idx_stores_dea` (`dea_registration_number`),
  KEY `idx_stores_npi` (`npi`),
  KEY `admin_user_id` (`admin_user_id`),
  CONSTRAINT `stores_ibfk_1` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stores_ibfk_2` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stores_chk_1` CHECK (((char_length(trim(`name`)) >= 2) and regexp_like(`name`,_utf8mb4'^[a-zA-Z0-9\\s\\-\'\\.,&]+$'))),
  CONSTRAINT `stores_chk_2` CHECK (((char_length(trim(`address`)) >= 5) and regexp_like(`address`,_utf8mb4'^[a-zA-Z0-9\\s\\-\'\\.,#]+$'))),
  CONSTRAINT `stores_chk_3` CHECK ((regexp_like(`state`,_utf8mb4'^[A-Z]{2}$') and (`state` in (_utf8mb4'AL',_utf8mb4'AK',_utf8mb4'AZ',_utf8mb4'AR',_utf8mb4'CA',_utf8mb4'CO',_utf8mb4'CT',_utf8mb4'DE',_utf8mb4'FL',_utf8mb4'GA',_utf8mb4'HI',_utf8mb4'ID',_utf8mb4'IL',_utf8mb4'IN',_utf8mb4'IA',_utf8mb4'KS',_utf8mb4'KY',_utf8mb4'LA',_utf8mb4'ME',_utf8mb4'MD',_utf8mb4'MA',_utf8mb4'MI',_utf8mb4'MN',_utf8mb4'MS',_utf8mb4'MO',_utf8mb4'MT',_utf8mb4'NE',_utf8mb4'NV',_utf8mb4'NH',_utf8mb4'NJ',_utf8mb4'NM',_utf8mb4'NY',_utf8mb4'NC',_utf8mb4'ND',_utf8mb4'OH',_utf8mb4'OK',_utf8mb4'OR',_utf8mb4'PA',_utf8mb4'RI',_utf8mb4'SC',_utf8mb4'SD',_utf8mb4'TN',_utf8mb4'TX',_utf8mb4'UT',_utf8mb4'VT',_utf8mb4'VA',_utf8mb4'WA',_utf8mb4'WV',_utf8mb4'WI',_utf8mb4'WY',_utf8mb4'DC',_utf8mb4'PR',_utf8mb4'VI',_utf8mb4'GU',_utf8mb4'AS',_utf8mb4'MP')))),
  CONSTRAINT `stores_chk_4` CHECK (regexp_like(`zipcode`,_utf8mb4'^[0-9]{5}(-[0-9]{4})?$')),
  CONSTRAINT `stores_chk_5` CHECK (regexp_like(`phone`,_utf8mb4'^[0-9]{10,11}$')),
  CONSTRAINT `stores_chk_6` CHECK (((`fax` is null) or regexp_like(`fax`,_utf8mb4'^[0-9]{10,11}$'))),
  CONSTRAINT `stores_chk_7` CHECK (regexp_like(`dea_registration_number`,_utf8mb4'^[A-Z]{2}[0-9]{7}$')),
  CONSTRAINT `stores_chk_8` CHECK (regexp_like(`npi`,_utf8mb4'^[0-9]{10}$'))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stores`
--

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;
INSERT INTO `stores` VALUES (1,'PharmaTraK Demo Store','123 Main Street','CA','90210','5551234567','5551234568','AB1234567','1234567890',1,'2025-08-09 21:25:35','2025-08-09 21:25:35'),(2,'North Branch Pharmacy','456 North Avenue, Northside, CA 90211','CA','90211','5551234568',NULL,'BA1234568','1234567891',NULL,'2025-08-11 01:55:29','2025-08-11 01:55:29'),(3,'South Branch Pharmacy','789 South Boulevard, Southside, CA 90212','CA','90212','5551234569',NULL,'BA1234569','1234567892',NULL,'2025-08-11 01:55:29','2025-08-11 01:55:29'),(4,'East Branch Pharmacy','321 East Main Street, Eastside, CA 90213','CA','90213','5551234570',NULL,'BA1234570','1234567893',NULL,'2025-08-11 01:55:29','2025-08-11 01:55:29');
/*!40000 ALTER TABLE `stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permissions`
--

DROP TABLE IF EXISTS `user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permission_value` tinyint(1) DEFAULT '1',
  `granted_by` int DEFAULT NULL,
  `granted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_permission` (`user_id`,`permission_name`),
  KEY `granted_by` (`granted_by`),
  KEY `idx_user_permissions_user` (`user_id`),
  KEY `idx_user_permissions_name` (`permission_name`),
  CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_permissions_ibfk_2` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissions`
--

LOCK TABLES `user_permissions` WRITE;
/*!40000 ALTER TABLE `user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `session_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_store_id` int DEFAULT NULL,
  `original_store_id` int NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `is_god_mode_session` tinyint(1) DEFAULT '0',
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_session_token` (`session_token`),
  KEY `current_store_id` (`current_store_id`),
  KEY `original_store_id` (`original_store_id`),
  KEY `idx_sessions_user` (`user_id`),
  KEY `idx_sessions_token` (`session_token`),
  KEY `idx_sessions_expires` (`expires_at`),
  KEY `idx_sessions_activity` (`last_activity`,`expires_at`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_sessions_ibfk_2` FOREIGN KEY (`current_store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `user_sessions_ibfk_3` FOREIGN KEY (`original_store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_store_access`
--

DROP TABLE IF EXISTS `user_store_access`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_store_access` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `store_id` int NOT NULL,
  `access_level` enum('admin','user') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `granted_by` int DEFAULT NULL,
  `granted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_store` (`user_id`,`store_id`),
  KEY `granted_by` (`granted_by`),
  KEY `idx_user_store_access_user` (`user_id`,`is_active`),
  KEY `idx_user_store_access_store` (`store_id`,`is_active`),
  CONSTRAINT `user_store_access_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_store_access_ibfk_2` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_store_access_ibfk_3` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_store_access`
--

LOCK TABLES `user_store_access` WRITE;
/*!40000 ALTER TABLE `user_store_access` DISABLE KEYS */;
INSERT INTO `user_store_access` VALUES (1,1,1,'admin',NULL,'2025-08-09 21:25:35',1);
/*!40000 ALTER TABLE `user_store_access` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(11) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `store_id` int NOT NULL,
  `role` enum('admin','user','god_mode') COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT '1',
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active_store_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_store_id` (`store_id`),
  KEY `idx_users_active_store` (`active_store_id`),
  KEY `idx_users_role_store` (`role`,`store_id`,`is_active`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`active_store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_chk_1` CHECK (((char_length(trim(`name`)) >= 2) and regexp_like(`name`,_utf8mb4'^[a-zA-Z0-9\\s\\-\'\\.,]+$'))),
  CONSTRAINT `users_chk_2` CHECK ((regexp_like(`email`,_utf8mb4'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$') and (char_length(`email`) <= 255) and (not((`email` like _utf8mb4'%..%'))))),
  CONSTRAINT `users_chk_3` CHECK (regexp_like(`phone`,_utf8mb4'^[0-9]{10,11}$')),
  CONSTRAINT `users_chk_4` CHECK ((char_length(`password`) >= 60)),
  CONSTRAINT `users_chk_5` CHECK (((char_length(trim(`address`)) >= 5) and regexp_like(`address`,_utf8mb4'^[a-zA-Z0-9\\s\\-\'\\.,#]+$')))
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Demo Admin','admin@pharmatrak.com','5551234567','$2a$12$tUi0KywQbaIoaDG/SuNgfuosOk1XSVzO32HIZ885SYF2zfejnlheO','123 Admin Lane, Beverly Hills, CA',1,'god_mode',1,'2025-08-09 21:25:35','2025-08-23 20:34:51',1),(12,'Test User 2','test2@example.com','5551234999','$2a$12$qaYknruO3.E7ckHBjHb04ubt51htlS4V5ZR2E8P8BUoeZjH8d1qgm','123 Test St',1,'user',0,'2025-08-15 02:27:54','2025-08-15 02:28:00',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_current_inventory`
--

DROP TABLE IF EXISTS `v_current_inventory`;
/*!50001 DROP VIEW IF EXISTS `v_current_inventory`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_current_inventory` AS SELECT 
 1 AS `snapshot_id`,
 1 AS `store_id`,
 1 AS `store_name`,
 1 AS `drug_id`,
 1 AS `ndc`,
 1 AS `generic_name`,
 1 AS `brand_name`,
 1 AS `dosage_form`,
 1 AS `strength`,
 1 AS `manufacturer_name`,
 1 AS `quantity_on_hand`,
 1 AS `last_transaction_id`,
 1 AS `last_transaction_date`,
 1 AS `last_transaction_type`,
 1 AS `last_updated_by`,
 1 AS `last_updated_by_name`,
 1 AS `updated_at`,
 1 AS `stock_status`,
 1 AS `reorder_level`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_god_mode_sessions`
--

DROP TABLE IF EXISTS `v_god_mode_sessions`;
/*!50001 DROP VIEW IF EXISTS `v_god_mode_sessions`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_god_mode_sessions` AS SELECT 
 1 AS `session_id`,
 1 AS `user_id`,
 1 AS `user_name`,
 1 AS `user_email`,
 1 AS `current_store_id`,
 1 AS `current_store_name`,
 1 AS `original_store_id`,
 1 AS `original_store_name`,
 1 AS `ip_address`,
 1 AS `last_activity`,
 1 AS `expires_at`,
 1 AS `created_at`,
 1 AS `session_status`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_god_mode_users`
--

DROP TABLE IF EXISTS `v_god_mode_users`;
/*!50001 DROP VIEW IF EXISTS `v_god_mode_users`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_god_mode_users` AS SELECT 
 1 AS `id`,
 1 AS `name`,
 1 AS `email`,
 1 AS `role`,
 1 AS `original_store_id`,
 1 AS `original_store_name`,
 1 AS `accessible_stores_count`,
 1 AS `permissions_count`,
 1 AS `is_active`,
 1 AS `date_created`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping routines for database 'pharmatrak'
--

--
-- Final view structure for view `v_current_inventory`
--

/*!50001 DROP VIEW IF EXISTS `v_current_inventory`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`pharmatrak_user`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_current_inventory` AS select `sis`.`id` AS `snapshot_id`,`sis`.`store_id` AS `store_id`,`s`.`name` AS `store_name`,`sis`.`drug_id` AS `drug_id`,`d`.`ndc` AS `ndc`,`d`.`generic_name` AS `generic_name`,`d`.`brand_name` AS `brand_name`,`d`.`dosage_form` AS `dosage_form`,`d`.`strength` AS `strength`,`d`.`manufacturer_name` AS `manufacturer_name`,`sis`.`quantity_on_hand` AS `quantity_on_hand`,`sis`.`last_transaction_id` AS `last_transaction_id`,`sis`.`last_transaction_date` AS `last_transaction_date`,`sis`.`last_transaction_type` AS `last_transaction_type`,`sis`.`last_updated_by` AS `last_updated_by`,`u`.`name` AS `last_updated_by_name`,`sis`.`updated_at` AS `updated_at`,(case when (`sis`.`quantity_on_hand` <= 0) then 'OUT_OF_STOCK' when (`sis`.`quantity_on_hand` <= 10) then 'LOW_STOCK' else 'IN_STOCK' end) AS `stock_status`,(select min(`si`.`reorder_level`) from `store_inventory` `si` where ((`si`.`store_id` = `sis`.`store_id`) and (`si`.`drug_id` = `sis`.`drug_id`) and (`si`.`is_active` = true))) AS `reorder_level` from (((`store_inventory_snapshot` `sis` join `stores` `s` on((`sis`.`store_id` = `s`.`id`))) join `drugs` `d` on((`sis`.`drug_id` = `d`.`id`))) left join `users` `u` on((`sis`.`last_updated_by` = `u`.`id`))) order by `s`.`name`,`d`.`generic_name` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_god_mode_sessions`
--

/*!50001 DROP VIEW IF EXISTS `v_god_mode_sessions`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`pharmatrak_user`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_god_mode_sessions` AS select `us`.`id` AS `session_id`,`u`.`id` AS `user_id`,`u`.`name` AS `user_name`,`u`.`email` AS `user_email`,`us`.`current_store_id` AS `current_store_id`,`cs`.`name` AS `current_store_name`,`us`.`original_store_id` AS `original_store_id`,`os`.`name` AS `original_store_name`,`us`.`ip_address` AS `ip_address`,`us`.`last_activity` AS `last_activity`,`us`.`expires_at` AS `expires_at`,`us`.`created_at` AS `created_at`,(case when (`us`.`expires_at` > now()) then 'active' else 'expired' end) AS `session_status` from (((`user_sessions` `us` join `users` `u` on((`us`.`user_id` = `u`.`id`))) left join `stores` `cs` on((`us`.`current_store_id` = `cs`.`id`))) left join `stores` `os` on((`us`.`original_store_id` = `os`.`id`))) where ((`us`.`is_god_mode_session` = true) and (`u`.`role` = 'god_mode')) order by `us`.`last_activity` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_god_mode_users`
--

/*!50001 DROP VIEW IF EXISTS `v_god_mode_users`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`pharmatrak_user`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_god_mode_users` AS select `u`.`id` AS `id`,`u`.`name` AS `name`,`u`.`email` AS `email`,`u`.`role` AS `role`,`u`.`store_id` AS `original_store_id`,`s`.`name` AS `original_store_name`,count(distinct `sa`.`store_id`) AS `accessible_stores_count`,count(distinct `up`.`permission_name`) AS `permissions_count`,`u`.`is_active` AS `is_active`,`u`.`date_created` AS `date_created` from (((`users` `u` left join `stores` `s` on((`u`.`store_id` = `s`.`id`))) left join `store_access` `sa` on(((`u`.`id` = `sa`.`user_id`) and (`sa`.`is_active` = true)))) left join `user_permissions` `up` on(((`u`.`id` = `up`.`user_id`) and (`up`.`permission_value` = true)))) where (`u`.`role` = 'god_mode') group by `u`.`id`,`u`.`name`,`u`.`email`,`u`.`role`,`u`.`store_id`,`s`.`name`,`u`.`is_active`,`u`.`date_created` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-23 20:40:16
