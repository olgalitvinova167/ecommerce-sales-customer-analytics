# Data Quality Report

**Project:** E-commerce Sales & Customer Analytics  
**Tools:** Python, Pandas

## 1. Purpose and Data Validation Plan

The objective is to assess the quality of five related e-commerce tables, identify potential errors and inconsistencies, and prepare the data for further analysis in MySQL and Power BI.

The data preparation process includes the following checks:

- Missing values, blank strings, and duplicate records.
- Data type correctness, including date fields.
- Primary key uniqueness and foreign key integrity.
- Consistency across related tables.
- Validity of categorical and numeric values.
- Accuracy of order-item calculations and total order amounts.
- Chronological consistency of registration, order, and review dates.

Identified issues are assessed according to their impact on subsequent analysis. Changes are made only when justified; limitations that cannot be reliably resolved are documented.

## 2. Dataset Before and After Preparation

Five raw CSV tables were used for the analysis.

| Table | Rows Before | Columns Before | Rows After | Columns After | Changes |
|---|---:|---:|---:|---:|---|
| `users` | 10,000 | 6 | 10,000 | 6 | Converted `signup_date` |
| `products` | 2,000 | 6 | 2,000 | 5 | Removed `rating` |
| `orders` | 20,000 | 5 | 20,000 | 5 | Converted `order_date` |
| `order_items` | 43,525 | 7 | 43,525 | 7 | Validated amounts and relationships with other tables |
| `reviews` | 15,000 | 7 | 15,000 | 6 | Converted `review_date`; removed `review_text` |

**Result:** All five tables retained their original row counts. Changes were limited to date conversions and the removal of two columns from the processed data.

After export, the CSV files were reloaded to verify that row counts, column counts, and column order matched the prepared tables.

## 3. Initial Data Quality Assessment

### 3.1. Missing Values and Duplicates

The five raw tables were checked for missing values and fully duplicated rows.

| Table | Missing Values | Duplicate Rows |
|---|---:|---:|
| `users` | 0 | 0 |
| `products` | 0 | 0 |
| `orders` | 0 | 0 |
| `order_items` | 0 | 0 |
| `reviews` | 0 | 0 |

Additional checks found no blank string values.

**Result:** No missing-value imputation or duplicate-row removal was required.

### 3.2. Data Type Validation

Date fields were initially stored as strings. The following fields were converted using `pd.to_datetime()`:

| Field | Conversion |
|---|---|
| `users.signup_date` | String to datetime; exported as a date in `YYYY-MM-DD` format |
| `orders.order_date` | String to datetime |
| `reviews.review_date` | String to datetime |

These conversions enabled chronological consistency checks and calendar-based analysis.

## 4. Data Cleaning and Preparation

### 4.1. Removal of `products.rating`

The raw `products` table included a `rating` column, but the method used to calculate this metric was not documented.

To assess its reliability, `products.rating` was compared with average product ratings calculated from `reviews.rating`.

| Comparison Result | Number of Products |
|---|---:|
| Products with reviews | 1,999 |
| Ratings do not match | 1,989 |
| Ratings match | 10 |
| Products without reviews | 1 |

Average ratings were rounded to two decimal places for the comparison.

**Decision:** Remove `products.rating` from the processed table and use `reviews.rating` as the primary source for product rating analysis.

This makes it possible to calculate rating metrics from available individual reviews rather than relying on a metric with an undocumented calculation method.

### 4.2. Removal of `reviews.review_text`

The raw `reviews` table included a column containing review text.

Because text and sentiment analysis are outside the scope of this project, `review_text` was excluded from the processed dataset.

**Result:** All 15,000 review records were retained. The numeric `reviews.rating` field is used for rating analysis.

## 5. Data Quality and Consistency Validation

### 5.1. Primary Key Validation

Primary key uniqueness was checked for every table.

| Table | Primary Key | Duplicate Keys |
|---|---|---:|
| `users` | `user_id` | 0 |
| `products` | `product_id` | 0 |
| `orders` | `order_id` | 0 |
| `order_items` | `order_item_id` | 0 |
| `reviews` | `review_id` | 0 |

**Result:** No primary key uniqueness violations were found.

### 5.2. Foreign Key and Relationship Validation

References between the five tables were checked.

| Check | Violations Found |
|---|---:|
| `orders.user_id` → `users.user_id` | 0 |
| `order_items.order_id` → `orders.order_id` | 0 |
| `order_items.product_id` → `products.product_id` | 0 |
| `order_items.user_id` → `users.user_id` | 0 |
| `reviews.order_id` → `orders.order_id` | 0 |
| `reviews.product_id` → `products.product_id` | 0 |
| `reviews.user_id` → `users.user_id` | 0 |

Additional consistency checks:

| Check | Violations Found |
|---|---:|
| User in `order_items` differs from the user in the related order | 0 |
| User in `reviews` differs from the user in the related order | 0 |
| Reviewed product is not included in the related order | 0 |
| Orders without corresponding `order_items` | 0 |

**Result:** No broken relationships or inconsistencies were found in the checked tables.

### 5.3. Valid Value Checks

Categorical fields and numeric measures were checked.

| Check | Violations Found |
|---|---:|
| Unexpected `users.gender` values | 0 |
| Invalid `orders.order_status` values | 0 |
| `reviews.rating` outside the 1–5 range | 0 |
| Raw `products.rating` outside the 1–5 range | 0 |
| `products.price` ≤ 0 | 0 |
| `orders.total_amount` ≤ 0 | 0 |
| `order_items.quantity` ≤ 0 | 0 |
| `order_items.item_price` ≤ 0 | 0 |
| `order_items.item_total` ≤ 0 | 0 |

**Result:** No invalid values were found under the tested conditions.

### 5.4. Financial Calculation Validation

Two levels of financial reconciliation were performed.

**Check 1. Order-item amount**

For every order item, the following equality was checked:

`item_total = quantity × item_price`

Values were compared after rounding to two decimal places.

**Result:** 0 mismatches.

**Check 2. Total order amount**

For every order, the following equality was checked:

`orders.total_amount = SUM(order_items.item_total)`

Values were compared after rounding to two decimal places.

**Result:** 0 mismatches.

Therefore, the checked order-item amounts are consistent with the corresponding order totals.

## 6. Identified Data Quality Issues

Chronological consistency checks revealed two significant issues.

### 6.1. Order Date Earlier Than Customer Signup Date

Some orders have an `order_date` earlier than the related customer's `signup_date`.

| Measure | Value |
|---|---:|
| Affected orders | 9,930 |
| Total orders | 20,000 |
| Share | 49.65% |

**Issue:** The order date precedes the customer's registration date, contrary to the expected event sequence.

**Decision:** Retain the records without modifying their dates.

The source data does not provide enough information to determine which timestamp is correct. Removing this many orders or manually changing dates could substantially distort analytical results.

**Limitation:** `signup_date` must not be used for customer tenure calculations or cohort metrics that depend on the chronological relationship between registration and purchase.

However, `order_date` can still be used to analyse sales trends by calendar period.

### 6.2. Review Date Earlier Than Order Date

Some reviews have a `review_date` earlier than the `order_date` of the related order.

| Measure | Value |
|---|---:|
| Affected reviews | 7,455 |
| Total reviews | 15,000 |
| Share | 49.70% |

**Issue:** A review is dated earlier than the order to which it belongs.

**Decision:** Retain the records without modifying their dates.

The correct review dates cannot be reliably reconstructed. Removing nearly half of the reviews could significantly change the distribution of product ratings.

**Limitation:** `review_date` must not be used to calculate the time between purchase and review.

The numeric values in `reviews.rating` remain available for product rating analysis.

## 7. Limitations for Further Analysis

The following limitations were identified:

| Analytical Area | Limitation |
|---|---|
| Sales trends | `order_date` is suitable for calendar-based analysis, but not for establishing a reliable order-to-signup event sequence |
| Customer tenure | Cannot be reliably calculated using `signup_date` and order dates |
| Cohort analysis | Acquisition cohorts and retention cannot be reliably calculated when they depend on the correct chronology of registration and purchases |
| Time from purchase to review | Cannot be calculated reliably from `review_date` and `order_date` |
| Timezones | Not specified in the source; no timezone conversion was performed |
| Observation period | The latest order date is 14 November 2025; November is incomplete |
| Currency | Not specified in the source; monetary values are presented without a currency label |
| Applicability of findings | The dataset is synthetic; results should not be interpreted as actual performance metrics of a real business |

## 8. Final Outcome

Data preparation and validation were completed for all five tables. The identified chronological inconsistencies were retained and documented as limitations for further analysis.

After the transformations and checks, all five prepared tables were exported as CSV files to `data/processed/`. The original datasets remain unchanged in `data/raw/`.
