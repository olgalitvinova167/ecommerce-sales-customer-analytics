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
| price | float |  | Product price; validated as greater than 0 |

## orders

| Column | Type | Key | Description |
|---|---|---|---|
| order_id | string | PK | Unique order identifier |
| user_id | string | FK → users.user_id | User who placed the order |
| order_date | datetime |  | Order timestamp; timezone is not provided in the source dataset |
| order_status | string |  | Order status: `shipped`, `returned`, `completed`, `cancelled`, or `processing` |
| total_amount | float |  | Total order amount; validated as greater than 0 and against the sum of related order item totals |

## order_items

| Column | Type | Key | Description |
|---|---|---|---|
| order_item_id | string | PK | Unique order item identifier |
| order_id | string | FK → orders.order_id | Related order identifier |
| product_id | string | FK → products.product_id | Related product identifier |
| user_id | string | FK → users.user_id | User associated with the order item |
| quantity | integer |  | Number of product units in the order item; validated as greater than 0 |
| item_price | float |  | Product unit price at order-item level; validated as greater than 0 |
| item_total | float |  | Order-item amount calculated as `quantity × item_price`; validated as greater than 0 |

## reviews

| Column | Type | Key | Description |
|---|---|---|---|
| review_id | string | PK | Unique review identifier |
| order_id | string | FK → orders.order_id | Related order identifier |
| product_id | string | FK → products.product_id | Reviewed product identifier |
| user_id | string | FK → users.user_id | User who submitted the review |
| rating | integer |  | User rating from 1 to 5 |
| review_date | datetime |  | Review timestamp; timezone is not provided in the source dataset |

## Data Preparation Notes

- `signup_date` was converted from string to a date-compatible value; `order_date` and `review_date` were converted from strings to datetime values.
- `products.rating` was removed from the processed dataset because its calculation method is not documented and it does not match the average rating calculated from `reviews.rating` for most products.
- Rating analysis therefore uses `reviews.rating` as the primary rating source.
- `reviews.review_text` was removed because text and sentiment analysis are outside the scope of this project.
- `item_total` was validated against `quantity × item_price` for all order items.
- `orders.total_amount` was validated against the sum of related `order_items.item_total` for each order.
- Primary keys were validated for uniqueness.
- Foreign-key relationships between the five tables were validated.
- User consistency between `orders`, `order_items`, and `reviews` was validated.
- Reviewed products were validated against the products included in the related orders.

## Known Data Limitations

The dataset is synthetic and contains inconsistent chronology between some related timestamps.

- 7,455 of 15,000 reviews (49.7%) have a `review_date` earlier than the related `order_date`.
- 9,930 of 20,000 orders (49.7%) have an `order_date` earlier than the related user's `signup_date`.

These records were retained because removing or manually modifying approximately half of the affected data would introduce substantial analytical bias without a reliable basis for reconstructing the original timestamps.

As a result:

- `order_date` can be used for calendar-based sales trend analysis.
- `signup_date` should not be used for customer tenure or cohort calculations that depend on its chronological relationship with orders.
- `review_date` should not be used to calculate time from purchase to review.
- No timezone assumptions are made because timezone information is not provided in the source dataset.