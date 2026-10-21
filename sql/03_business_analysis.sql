USE ecommerce_sales_analytics;


-- =========================================================
-- Business rules
-- Completed Revenue includes completed orders only.
-- Total Order Value includes orders of all statuses.
-- =========================================================


-- =========================================================
-- 1. Sales period and overall order metrics
-- =========================================================

SELECT
    MIN(order_date) AS first_order_date,
    MAX(order_date) AS last_order_date,
    COUNT(*) AS total_orders,
    COUNT(DISTINCT user_id) AS ordering_customers,
    ROUND(SUM(total_amount), 2) AS total_order_value,
    ROUND(AVG(total_amount), 2) AS average_order_value_all_statuses
FROM orders;


-- =========================================================
-- 2. Orders and value by order status
-- =========================================================

WITH status_summary AS (
    SELECT
        order_status,
        COUNT(*) AS order_count,
        SUM(total_amount) AS status_order_value
    FROM orders
    GROUP BY order_status
),
overall AS (
    SELECT
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_order_value
    FROM orders
)
SELECT
    s.order_status,
    s.order_count,
    ROUND(
        100.0 * s.order_count / o.total_orders,
        2
    ) AS order_share_pct,
    ROUND(s.status_order_value, 2) AS status_order_value,
    ROUND(
        100.0 * s.status_order_value / o.total_order_value,
        2
    ) AS value_share_pct
FROM status_summary s
CROSS JOIN overall o
ORDER BY s.order_count DESC;


-- =========================================================
-- 3. Completed revenue KPIs
-- =========================================================

SELECT
    COUNT(*) AS completed_orders,
    ROUND(SUM(total_amount), 2) AS completed_revenue,
    ROUND(AVG(total_amount), 2) AS completed_aov
FROM orders
WHERE order_status = 'completed';


-- =========================================================
-- 4. Monthly completed revenue trend
-- =========================================================

SELECT
    DATE_FORMAT(order_date, '%Y-%m') AS order_month,
    COUNT(*) AS completed_orders,
    ROUND(SUM(total_amount), 2) AS completed_revenue,
    ROUND(AVG(total_amount), 2) AS completed_aov
FROM orders
WHERE order_status = 'completed'
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY order_month;


-- =========================================================
-- 5. Repeat customer analysis
-- =========================================================

WITH customer_orders AS (
    SELECT
        user_id,
        COUNT(*) AS completed_order_count
    FROM orders
    WHERE order_status = 'completed'
    GROUP BY user_id
)
SELECT
    COUNT(*) AS customers_with_completed_orders,
    SUM(completed_order_count >= 2) AS repeat_customers,
    ROUND(
        100.0 * SUM(completed_order_count >= 2) / COUNT(*),
        2
    ) AS repeat_customer_rate_pct
FROM customer_orders;


-- =========================================================
-- 6. Completed revenue by category
-- =========================================================

SELECT
    p.category,
    COUNT(DISTINCT o.order_id) AS completed_orders,
    SUM(oi.quantity) AS items_sold,
    ROUND(SUM(oi.item_total), 2) AS completed_revenue
FROM order_items oi
JOIN orders o
    ON oi.order_id = o.order_id
JOIN products p
    ON oi.product_id = p.product_id
WHERE o.order_status = 'completed'
GROUP BY p.category
ORDER BY completed_revenue DESC;


-- =========================================================
-- 7. Completed revenue by brand
-- =========================================================

SELECT
    p.brand,
    COUNT(DISTINCT o.order_id) AS completed_orders,
    SUM(oi.quantity) AS items_sold,
    ROUND(SUM(oi.item_total), 2) AS completed_revenue
FROM order_items oi
JOIN orders o
    ON oi.order_id = o.order_id
JOIN products p
    ON oi.product_id = p.product_id
WHERE o.order_status = 'completed'
GROUP BY p.brand
ORDER BY completed_revenue DESC;


-- =========================================================
-- 8. Top products by completed revenue
-- =========================================================

WITH product_sales AS (
    SELECT
        p.product_id,
        p.product_name,
        p.category,
        p.brand,
        COUNT(DISTINCT o.order_id) AS completed_orders,
        SUM(oi.quantity) AS items_sold,
        ROUND(SUM(oi.item_total), 2) AS completed_revenue
    FROM order_items oi
    JOIN orders o
        ON oi.order_id = o.order_id
    JOIN products p
        ON oi.product_id = p.product_id
    WHERE o.order_status = 'completed'
    GROUP BY
        p.product_id,
        p.product_name,
        p.category,
        p.brand
)
SELECT
    DENSE_RANK() OVER (
        ORDER BY completed_revenue DESC
    ) AS revenue_rank,
    product_id,
    product_name,
    category,
    brand,
    completed_orders,
    items_sold,
    completed_revenue
FROM product_sales
ORDER BY
    revenue_rank,
    product_id
LIMIT 10;


-- =========================================================
-- 9. Cancellation and return rates by category
-- Rates represent orders containing each category;
-- order status is order-level.
-- =========================================================

SELECT
    p.category,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(
        DISTINCT CASE
            WHEN o.order_status = 'cancelled'
            THEN o.order_id
        END
    ) AS cancelled_orders,
    ROUND(
        100.0 * COUNT(
            DISTINCT CASE
                WHEN o.order_status = 'cancelled'
                THEN o.order_id
            END
        ) / COUNT(DISTINCT o.order_id),
        2
    ) AS cancellation_rate_pct,
    COUNT(
        DISTINCT CASE
            WHEN o.order_status = 'returned'
            THEN o.order_id
        END
    ) AS returned_orders,
    ROUND(
        100.0 * COUNT(
            DISTINCT CASE
                WHEN o.order_status = 'returned'
                THEN o.order_id
            END
        ) / COUNT(DISTINCT o.order_id),
        2
    ) AS return_rate_pct
FROM order_items oi
JOIN orders o
    ON oi.order_id = o.order_id
JOIN products p
    ON oi.product_id = p.product_id
GROUP BY p.category
ORDER BY cancellation_rate_pct DESC;


-- =========================================================
-- 10. Ratings by category
-- =========================================================

SELECT
    p.category,
    COUNT(*) AS review_count,
    ROUND(AVG(r.rating), 2) AS average_rating
FROM reviews r
JOIN products p
    ON r.product_id = p.product_id
GROUP BY p.category
ORDER BY
    average_rating DESC,
    p.category;