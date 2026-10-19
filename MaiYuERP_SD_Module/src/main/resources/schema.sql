CREATE DATABASE IF NOT EXISTS maiyu_sd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE maiyu_sd;

CREATE TABLE IF NOT EXISTS sales_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(40) NOT NULL UNIQUE,
  store_name VARCHAR(120) NOT NULL,
  customer_name VARCHAR(120) DEFAULT '',
  order_type VARCHAR(30) NOT NULL DEFAULT 'Retail',
  product_name VARCHAR(160) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  order_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS store_requisitions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  requisition_no VARCHAR(40) NOT NULL UNIQUE,
  store_name VARCHAR(120) NOT NULL,
  product_name VARCHAR(160) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  notes VARCHAR(500) DEFAULT '',
  status VARCHAR(30) NOT NULL DEFAULT 'Submitted',
  request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deliveries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  delivery_no VARCHAR(40) NOT NULL UNIQUE,
  order_no VARCHAR(40) NOT NULL,
  store_name VARCHAR(120) NOT NULL,
  carrier VARCHAR(120) DEFAULT '',
  delivery_status VARCHAR(30) NOT NULL DEFAULT 'Preparing',
  delivery_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO sales_orders(order_no,store_name,customer_name,order_type,product_name,quantity,unit_price,total_amount,order_status)
VALUES
('SO-DEMO-001','Ulaanbaatar Central Store','Walk-in Customer','Retail','Brown Sugar Milk Tea',2,12.50,25.00,'Completed'),
('SO-DEMO-002','Campus Store','Mongol Tech LLC','B2B Group','Afternoon Tea Set',20,18.00,360.00,'Processing');

INSERT IGNORE INTO store_requisitions(requisition_no,store_name,product_name,quantity,notes,status)
VALUES
('REQ-DEMO-001','Campus Store','Brown Sugar Milk Tea',100,'Restock before evening rush','Submitted');

INSERT IGNORE INTO deliveries(delivery_no,order_no,store_name,carrier,delivery_status)
VALUES
('DL-DEMO-001','SO-DEMO-002','Campus Store','MaiYu Delivery Team','Preparing');
