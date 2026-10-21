# Data Dictionary

This data dictionary documents the cleaned tables used in the
E-commerce Sales & Customer Analytics project.

Data types in this document describe the logical representation of the cleaned and processed data. Physical MySQL data types are defined in `sql/01_create_schema.sql`.

The project uses five tables: `users`, `products`, `orders`,
`order_items`, and `reviews`.

## users

| Column | Type | Key | Description |
|---|---|---|---|
| user_id | string | PK | Unique user identifier |
| name | string |  | User name |
| email | string |  | User email address |
| gender | string |  | User gender category |
| city | string |  | User city |
| signup_date | date |  | User registration date |

## products

| Column | Type | Key | Description |
|---|---|---|---|
| product_id | string | PK | Unique product identifier |
| product_name | string |  | Product name |
| category | string |  | Product category |
| brand | string |  | Product brand |
| price | float |  | Product price |

## orders

| Column | Type | Key | Description |
|---|---|---|---|
| order_id | string | PK | Unique order identifier |
| user_id | string | FK → users.user_id | User who placed the order |
| order_date | datetime |  | Order timestamp |
| order_status | string |  | Order status: `shipped`, `returned`, `completed`, `cancelled`, or `processing` |
| total_amount | float |  | Total order amount |

## order_items

| Column | Type | Key | Description |
|---|---|---|---|
| order_item_id | string | PK | Unique order item identifier |
| order_id | string | FK → orders.order_id | Related order identifier |
| product_id | string | FK → products.product_id | Related product identifier |
| user_id | string | FK → users.user_id | User associated with the order item |
| quantity | integer |  | Number of product units in the order item |
| item_price | float |  | Product unit price at order-item level |
| item_total | float |  | Order-item amount (`quantity × item_price`) |

## reviews

| Column | Type | Key | Description |
|---|---|---|---|
| review_id | string | PK | Unique review identifier |
| order_id | string | FK → orders.order_id | Related order identifier |
| product_id | string | FK → products.product_id | Reviewed product identifier |
| user_id | string | FK → users.user_id | User who submitted the review |
| rating | integer |  | User rating from 1 to 5 |
| review_date | datetime |  | Review timestamp |
