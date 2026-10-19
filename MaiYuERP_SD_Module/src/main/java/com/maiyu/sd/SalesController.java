package com.maiyu.sd;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class SalesController {
    private final JdbcTemplate jdbc;

    public SalesController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalOrders", count("SELECT COUNT(*) FROM sales_orders"));
        data.put("pendingOrders", count("SELECT COUNT(*) FROM sales_orders WHERE order_status IN ('Pending','Processing')"));
        data.put("replenishments", count("SELECT COUNT(*) FROM store_requisitions WHERE status IN ('Submitted','Processing')"));
        data.put("deliveries", count("SELECT COUNT(*) FROM deliveries WHERE delivery_status IN ('Preparing','In Transit')"));
        data.put("revenue", jdbc.queryForObject("SELECT COALESCE(SUM(total_amount),0) FROM sales_orders WHERE order_status <> 'Cancelled'", BigDecimal.class));
        return data;
    }

    @GetMapping("/sales-orders")
    public List<Map<String, Object>> salesOrders() {
        return jdbc.queryForList("SELECT * FROM sales_orders ORDER BY id DESC");
    }

    @PostMapping("/sales-orders")
    public Map<String, Object> createSalesOrder(@RequestBody Map<String, Object> body) {
        String orderNo = text(body, "order_no", "SO-" + System.currentTimeMillis());
        String store = text(body, "store_name", "");
        String customer = text(body, "customer_name", "");
        String type = text(body, "order_type", "Retail");
        String product = text(body, "product_name", "");
        int quantity = integer(body, "quantity", 1);
        BigDecimal price = decimal(body, "unit_price", "0");
        BigDecimal total = price.multiply(BigDecimal.valueOf(quantity));
        String status = text(body, "order_status", "Pending");
        jdbc.update("""
            INSERT INTO sales_orders(order_no, store_name, customer_name, order_type,
              product_name, quantity, unit_price, total_amount, order_status, order_date)
            VALUES(?,?,?,?,?,?,?,?,?,NOW())
            """, orderNo, store, customer, type, product, quantity, price, total, status);
        return Map.of("success", true, "message", "Sales order created", "order_no", orderNo);
    }

    @PutMapping("/sales-orders/{id}")
    public Map<String, Object> updateSalesOrder(@PathVariable long id, @RequestBody Map<String, Object> body) {
        String store = text(body, "store_name", "");
        String customer = text(body, "customer_name", "");
        String type = text(body, "order_type", "Retail");
        String product = text(body, "product_name", "");
        int quantity = integer(body, "quantity", 1);
        BigDecimal price = decimal(body, "unit_price", "0");
        BigDecimal total = price.multiply(BigDecimal.valueOf(quantity));
        String status = text(body, "order_status", "Pending");
        int updated = jdbc.update("""
            UPDATE sales_orders SET store_name=?, customer_name=?, order_type=?, product_name=?,
              quantity=?, unit_price=?, total_amount=?, order_status=? WHERE id=?
            """, store, customer, type, product, quantity, price, total, status, id);
        return Map.of("success", updated > 0);
    }

    @DeleteMapping("/sales-orders/{id}")
    public Map<String, Object> deleteSalesOrder(@PathVariable long id) {
        int deleted = jdbc.update("DELETE FROM sales_orders WHERE id=?", id);
        return Map.of("success", deleted > 0);
    }

    @GetMapping("/requisitions")
    public List<Map<String, Object>> requisitions() {
        return jdbc.queryForList("SELECT * FROM store_requisitions ORDER BY id DESC");
    }

    @PostMapping("/requisitions")
    public Map<String, Object> createRequisition(@RequestBody Map<String, Object> body) {
        String reqNo = text(body, "requisition_no", "REQ-" + System.currentTimeMillis());
        String store = text(body, "store_name", "");
        String product = text(body, "product_name", "");
        int quantity = integer(body, "quantity", 1);
        String notes = text(body, "notes", "");
        jdbc.update("""
            INSERT INTO store_requisitions(requisition_no, store_name, product_name, quantity, notes, status, request_date)
            VALUES(?,?,?,?,?,'Submitted',NOW())
            """, reqNo, store, product, quantity, notes);
        return Map.of("success", true, "message", "Replenishment request submitted", "requisition_no", reqNo);
    }

    @PutMapping("/requisitions/{id}/status")
    public Map<String, Object> updateRequisitionStatus(@PathVariable long id, @RequestBody Map<String, Object> body) {
        String status = text(body, "status", "Submitted");
        int updated = jdbc.update("UPDATE store_requisitions SET status=? WHERE id=?", status, id);
        return Map.of("success", updated > 0);
    }

    @GetMapping("/deliveries")
    public List<Map<String, Object>> deliveries() {
        return jdbc.queryForList("SELECT * FROM deliveries ORDER BY id DESC");
    }

    @PostMapping("/deliveries")
    public Map<String, Object> createDelivery(@RequestBody Map<String, Object> body) {
        String deliveryNo = text(body, "delivery_no", "DL-" + System.currentTimeMillis());
        String orderNo = text(body, "order_no", "");
        String store = text(body, "store_name", "");
        String carrier = text(body, "carrier", "");
        jdbc.update("""
            INSERT INTO deliveries(delivery_no, order_no, store_name, carrier, delivery_status, delivery_date)
            VALUES(?,?,?,?, 'Preparing', NOW())
            """, deliveryNo, orderNo, store, carrier);
        return Map.of("success", true, "delivery_no", deliveryNo);
    }

    @PutMapping("/deliveries/{id}/status")
    public Map<String, Object> updateDeliveryStatus(@PathVariable long id, @RequestBody Map<String, Object> body) {
        String status = text(body, "delivery_status", "Preparing");
        int updated = jdbc.update("UPDATE deliveries SET delivery_status=? WHERE id=?", status, id);
        return Map.of("success", updated > 0);
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok", "module", "SD Sales Management");
    }

    private long count(String sql) {
        Long value = jdbc.queryForObject(sql, Long.class);
        return value == null ? 0 : value;
    }

    private String text(Map<String, Object> body, String key, String fallback) {
        Object value = body.get(key);
        return value == null ? fallback : value.toString().trim();
    }

    private int integer(Map<String, Object> body, String key, int fallback) {
        try { return Integer.parseInt(String.valueOf(body.get(key))); }
        catch (Exception ex) { return fallback; }
    }

    private BigDecimal decimal(Map<String, Object> body, String key, String fallback) {
        try { return new BigDecimal(String.valueOf(body.get(key))); }
        catch (Exception ex) { return new BigDecimal(fallback); }
    }
}
