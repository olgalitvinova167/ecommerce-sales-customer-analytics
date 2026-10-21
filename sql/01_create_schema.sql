CREATE DATABASE IF NOT EXISTS ecommerce_sales_analytics;

USE ecommerce_sales_analytics;

CREATE TABLE users (
    user_id CHAR(7) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    signup_date DATE NOT NULL
);

CREATE TABLE products (
    product_id CHAR(7) PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    CONSTRAINT chk_products_price
        CHECK (price > 0)
);

CREATE TABLE orders (
    order_id CHAR(9) PRIMARY KEY,
    user_id CHAR(7) NOT NULL,
    order_date DATETIME(6) NOT NULL,
    order_status VARCHAR(20) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT chk_orders_status
        CHECK (
            order_status IN (
                'shipped',
                'returned',
                'completed',
                'cancelled',
                'processing'
            )
        ),

    CONSTRAINT chk_orders_total_amount
        CHECK (total_amount > 0)
);

CREATE TABLE order_items (
    order_item_id CHAR(9) PRIMARY KEY,
    order_id CHAR(9) NOT NULL,
    product_id CHAR(7) NOT NULL,
    user_id CHAR(7) NOT NULL,
    quantity TINYINT UNSIGNED NOT NULL,
    item_price DECIMAL(12, 2) NOT NULL,
    item_total DECIMAL(12, 2) NOT NULL,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id),

    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    CONSTRAINT fk_order_items_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT chk_order_items_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_order_items_price
        CHECK (item_price > 0),

    CONSTRAINT chk_order_items_total
        CHECK (item_total > 0)
);

CREATE TABLE reviews (
    review_id CHAR(9) PRIMARY KEY,
    order_id CHAR(9) NOT NULL,
    product_id CHAR(7) NOT NULL,
    user_id CHAR(7) NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    review_date DATETIME(6) NOT NULL,

    CONSTRAINT fk_reviews_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id),

    CONSTRAINT fk_reviews_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT chk_reviews_rating
        CHECK (rating BETWEEN 1 AND 5)
);