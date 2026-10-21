# MySQL setup and analysis

These scripts implement the relational analysis for the [main portfolio project](../README.md). Use the five prepared CSVs in `../data/processed/`, not the raw files: raw products and reviews contain columns deliberately removed during preparation.

## Requirements

- MySQL 8.0.16 or newer, with InnoDB and strict SQL mode recommended.
- A SQL client such as MySQL Workbench, and permissions to create a local database and import data.
- Preserve the CSV headers, UTF-8 text, decimal points and timestamp precision. `order_date` and `review_date` use `DATETIME(6)`.

CTEs and window functions require MySQL 8.0; enforcement of `CHECK` constraints requires 8.0.16 or newer. See the [MySQL CHECK documentation](https://dev.mysql.com/doc/refman/8.0/en/create-table-check-constraints.html).

## Execution order

1. Open and execute [01_create_schema.sql](01_create_schema.sql) against a fresh local environment. It creates `ecommerce_sales_analytics` and its five tables. Table creation is not an update/migration operation: rerunning it when the tables already exist produces errors. Do not drop an existing database just to follow this guide.
2. Import each processed CSV **into the existing matching table**, in this order: `users`, `products`, `orders`, `order_items`, `reviews`.
3. In a CSV import interface such as MySQL Workbench's Table Data Import Wizard, select the existing table and map each CSV header to the same-named column. Treat the first row as headers, use comma delimiters and double-quote text enclosure, and preserve fractional seconds. Do not import the same file twice or let the wizard replace the declared schema with inferred types.
4. Run [02_data_validation.sql](02_data_validation.sql) and review every result set.
5. Run [03_business_analysis.sql](03_business_analysis.sql). Each numbered section produces a separate analysis result.

The repository does not contain an automated CSV loader. The import step is intentionally documented as a client operation; use local credentials and do not save them in project files.

## Validation expectations

| Table | Expected rows |
| --- | ---: |
| users | 10,000 |
| products | 2,000 |
| orders | 20,000 |
| order_items | 43,525 |
| reviews | 15,000 |

Foreign-key, user/product consistency and monetary mismatch counts should be zero. The known chronology counts are **9,930 orders before signup** and **7,455 reviews before their order**. These exceptions are retained synthetic-data limitations, not failed imports. See the [data dictionary](../data/data_dictionary.md).

The project owner has confirmed that the database was checked directly and the main results match Power BI. The [main README](../README.md#power-bi-dashboard) records the confirmed baseline; separate native execution logs are not included.

## Metric scope

- Sections 1–2 describe all order statuses; sections 3–8 use completed orders for sales and repeat purchasing.
- Item-level revenue is summed from order lines. Product/category/brand order counts use distinct orders and must not be summed as if the groups were disjoint.
- Section 8 returns ten product rows using dense revenue ranks and a product-ID tie-breaker.
- Section 9 counts distinct orders containing each category. Its cancellation/return rates describe order outcomes, not returned units.
- Section 10 averages review records across all statuses, using `reviews.rating`.
- November 2025 is partial; currency and timezone are undocumented.

## Supplementary comparison script

`dashboard/scripts/verify_sql.py` reads the existing SQL and compares dashboard values using an in-memory SQLite database. It does not require Pandas and does not modify the source files. From the project root:

```sh
python -B dashboard/scripts/verify_sql.py
```

It checks sales sections 3–8 for all 15 dashboard periods, section 2 order counts/shares, additional customer/rating distributions, and validation results. It does not execute the MySQL DDL or exhaustively assert sections 1, 9, 10 and status-value shares. Those calculations were checked separately during review. SQLite comparison is supplementary evidence, not a substitute for native MySQL execution.
