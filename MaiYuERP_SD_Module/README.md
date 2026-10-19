# MaiYu Fresh Tea ERP — SD Sales Management Module

This is a standalone Java Spring Boot + MySQL website for the SD (Sales & Distribution) module only.

## Included SD functions
- Sales orders: store POS retail orders and B2B corporate/group orders
- Store replenishment requests submitted to the central factory
- Outbound delivery creation and status tracking
- Dashboard summary and recent orders

## Requirements
- JDK 17+
- IntelliJ IDEA
- MySQL 8+
- Maven (IDEA can use its bundled Maven)

## Run it
1. Open the extracted `MaiYuERP_SD_Module` folder in IntelliJ IDEA.
2. In DataGrip, connect to your local MySQL server.
3. Open `src/main/resources/application.properties` and set `spring.datasource.password` to your MySQL password.
4. Execute `src/main/resources/schema.sql` in DataGrip. It creates `maiyu_sd` and the three SD tables.
5. In IDEA, wait for Maven dependencies to download.
6. Run `MaiYuSdApplication.java`.
7. Open http://localhost:8081

## Main API endpoints
- `GET /api/dashboard`
- `GET /api/sales-orders`
- `POST /api/sales-orders`
- `PUT /api/sales-orders/{id}`
- `DELETE /api/sales-orders/{id}`
- `GET /api/requisitions`
- `POST /api/requisitions`
- `PUT /api/requisitions/{id}/status`
- `GET /api/deliveries`
- `POST /api/deliveries`
- `PUT /api/deliveries/{id}/status`

## Database note
This standalone version uses its own database `maiyu_sd` to avoid changing the existing multi-module project database. Change the DB name in both the SQL and `application.properties` if you need to connect it to an existing schema.
