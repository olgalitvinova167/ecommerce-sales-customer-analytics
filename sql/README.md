# SQL Analysis

As part of the **E-commerce Sales & Customer Analytics** project, MySQL was used to create a relational database, validate data quality, and analyse sales, orders, customers, and products.

## 1. SQL Project Structure

The SQL work is organised into three stages:

| SQL File | Purpose |
|---|---|
| [01_create_schema.sql](01_create_schema.sql) | Creates the database and five related tables |
| [02_data_validation.sql](02_data_validation.sql) | Validates data integrity, relationships between tables, and financial calculations |
| [03_business_analysis.sql](03_business_analysis.sql) | Analyses sales, order statuses, customer purchasing behaviour, product performance, and ratings |

Five prepared CSV files from [`data/processed/`](../data/processed/) were imported into MySQL.

## 2. Data Analysis

The SQL queries address the following analytical areas:

- **Sales Performance:** Completed revenue, order counts, average order value, and sales trends.
- **Order Analysis:** Order status distribution, cancellation rates, and return rates.
- **Customer Analytics:** Purchasing customers, repeat purchases, and repeat customer rate.
- **Product Performance:** Revenue and sales volume by category, brand, and product, including top-performing products.
- **Ratings & Reviews:** Average product ratings and review counts.

The analysis uses `JOIN`, aggregate functions, common table expressions (`CTEs`), and window functions.

## 3. Data Quality Validation

Before business analysis, SQL checks were performed for:

- Row counts across the tables.
- Primary and foreign keys.
- Consistency of related records.
- Accuracy of order-item amounts and order totals.
- Chronological consistency of dates.

Identified inconsistencies between signup, order, and review dates were retained as limitations of the synthetic dataset.

Detailed preparation and validation results are documented in the [Data Quality Report](../data/data_quality_report.md).

## 4. Execution Order

1. Run `01_create_schema.sql` to create the database structure.
2. Import the five prepared CSV files into their corresponding tables.
3. Run `02_data_validation.sql` to validate the data.
4. Run `03_business_analysis.sql` to execute the analytical queries.

Key business findings and visualisations are presented in the [main project README](../README.md).
