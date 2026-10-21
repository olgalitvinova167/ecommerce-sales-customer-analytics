USE ecommerce_sales_analytics;


-- =========================================================
-- 1. Row count validation
-- =========================================================

SELECT 'users' AS table_name, COUNT(*) AS row_count
FROM users

UNION ALL

SELECT 'products', COUNT(*)
FROM products

UNION ALL

SELECT 'orders', COUNT(*)
FROM orders

UNION ALL

SELECT 'order_items', COUNT(*)
FROM order_items

UNION ALL

SELECT 'reviews', COUNT(*)
FROM reviews;


-- =========================================================
-- 2. Foreign key validation
-- =========================================================

SELECT
    'orders.user_id -> users.user_id' AS check_name,
    COUNT(*) AS invalid_references
FROM orders o
LEFT JOIN users u
    ON o.user_id = u.user_id
WHERE u.user_id IS NULL

UNION ALL

SELECT
    'order_items.order_id -> orders.order_id',
    COUNT(*)
FROM order_items oi
LEFT JOIN orders o
    ON oi.order_id = o.order_id
WHERE o.order_id IS NULL

UNION ALL

SELECT
    'order_items.product_id -> products.product_id',
    COUNT(*)
FROM order_items oi
LEFT JOIN products p
    ON oi.product_id = p.product_id
WHERE p.product_id IS NULL

UNION ALL

SELECT
    'order_items.user_id -> users.user_id',
    COUNT(*)
FROM order_items oi
LEFT JOIN users u
    ON oi.user_id = u.user_id
WHERE u.user_id IS NULL

UNION ALL

SELECT
    'reviews.order_id -> orders.order_id',
    COUNT(*)
FROM reviews r
LEFT JOIN orders o
    ON r.order_id = o.order_id
WHERE o.order_id IS NULL

UNION ALL

SELECT
    'reviews.product_id -> products.product_id',
    COUNT(*)
FROM reviews r
LEFT JOIN products p
    ON r.product_id = p.product_id
WHERE p.product_id IS NULL

UNION ALL

SELECT
    'reviews.user_id -> users.user_id',
    COUNT(*)
FROM reviews r
LEFT JOIN users u
    ON r.user_id = u.user_id
WHERE u.user_id IS NULL;


-- =========================================================
-- 3. Cross-table consistency validation
-- =========================================================

SELECT
    COUNT(*) AS order_items_user_mismatches
FROM order_items oi
JOIN orders o
    ON oi.order_id = o.order_id
WHERE oi.user_id <> o.user_id;


SELECT
    COUNT(*) AS reviews_user_mismatches
FROM reviews r
JOIN orders o
    ON r.order_id = o.order_id
WHERE r.user_id <> o.user_id;


SELECT
    COUNT(*) AS review_products_not_in_order
FROM reviews r
LEFT JOIN order_items oi
    ON r.order_id = oi.order_id
    AND r.product_id = oi.product_id
WHERE oi.order_item_id IS NULL;


SELECT
    COUNT(*) AS orders_without_items
FROM orders o
LEFT JOIN order_items oi
    ON o.order_id = oi.order_id
WHERE oi.order_id IS NULL;


-- =========================================================
-- 4. Amount validation
-- =========================================================

SELECT
    COUNT(*) AS item_total_mismatches
FROM order_items
WHERE item_total <> quantity * item_price;


SELECT
    COUNT(*) AS order_total_mismatches
FROM orders o
JOIN (
    SELECT
        order_id,
        SUM(item_total) AS calculated_total
    FROM order_items
    GROUP BY order_id
) oi
    ON o.order_id = oi.order_id
WHERE o.total_amount <> oi.calculated_total;


-- =========================================================
-- 5. Known chronology limitations
-- =========================================================

SELECT
    COUNT(*) AS reviews_before_order
FROM reviews r
JOIN orders o
    ON r.order_id = o.order_id
WHERE r.review_date < o.order_date;


SELECT
    COUNT(*) AS orders_before_signup
FROM orders o
JOIN users u
    ON o.user_id = u.user_id
WHERE o.order_date < u.signup_date;