# E-commerce Sales & Customer Analytics

**Python · Pandas · MySQL · Power BI · DAX**

## About the project

I built this end-to-end analytics project to explore sales, product performance and customer purchasing behaviour in an e-commerce dataset. I prepared and validated five related tables in Python, analysed them with MySQL, and developed a three-page Power BI report.

The dataset is **synthetic**, so the results demonstrate analytical methods rather than the performance of a real business.

**Explore:** [Python notebook](notebooks/01_data_preparation.ipynb) · [SQL analysis](sql/03_business_analysis.sql) · [Power BI report](powerbi/ecommerce_sales_dashboard.pbix) · [DAX measures](docs/dax_measures.md)

## What I worked on

- **Data preparation:** inspected five CSV tables, converted date fields and removed two columns that were either undocumented or outside the project's scope.
- **Data quality:** checked keys, relationships, order-item amounts and consistency between orders, users, products and reviews.
- **SQL analysis:** used joins, aggregations, CTEs and window functions to investigate completed sales, product performance, repeat purchasing and order outcomes.
- **Power BI:** built a data model, DAX measures and three interactive report pages.

## Dataset

The analysis covers orders from **1 January 2024 to 14 November 2025**; November 2025 is a partial month. The dataset does not specify a currency, so monetary amounts are shown without a currency symbol.

| Table | Rows | Description |
| --- | ---: | --- |
| `users` | 10,000 | Customer records |
| `products` | 2,000 | Product catalogue |
| `orders` | 20,000 | Orders and statuses |
| `order_items` | 43,525 | Items within orders |
| `reviews` | 15,000 | Product review records |

**Source and licence:** [E-commerce_dataset](https://www.kaggle.com/datasets/abhayayare/e-commerce-dataset) by **Abhay Ayare**, generated with Python, Faker, NumPy and Pandas. Kaggle lists the dataset under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The prepared data in this repository is an adaptation distributed under CC BY-SA 4.0; the original raw files are also retained. Changes include date conversions and removal of `products.rating` and `reviews.review_text`. Attribution and ShareAlike terms apply to the dataset and its adaptations, not automatically to independently developed project code.

See the [data dictionary](data/data_dictionary.md) for column definitions and additional context.

## Key results

These figures describe **completed orders**, unless stated otherwise. I checked the main totals against SQL results and the Power BI report.

| Metric | Result |
| --- | ---: |
| Completed revenue | **2,419,712.58** |
| Completed orders | **4,021** |
| Average completed order value | **601.77** |
| Items sold in completed orders | **12,226** |
| Customers with completed orders | **3,320** |
| Repeat customers (2+ completed orders) | **612** |
| Repeat customer rate | **18.43%** |

### What the data shows

- **Most purchasing customers bought once.** Of 3,320 customers with completed orders, 2,708 placed one completed order and 612 placed at least two. The **18.43%** repeat rate describes this dataset and time period, not long-term customer retention.
- **Order status matters when reporting revenue.** Total order value across all statuses is **11,918,668.95**, compared with **2,419,712.58** from completed orders. Including orders that are still processing, shipped, cancelled or returned would change the meaning of the revenue KPI.
- **Cancellations and returns deserve separate attention.** Cancelled orders account for **19.60%** of orders and returned orders for **20.33%**. These are shares of order counts, not estimates of lost revenue.
- **Ratings offer limited differentiation by category.** Average category ratings range from **3.52 to 3.58** in this synthetic dataset.
- **The last month is incomplete.** November 2025 contains data only through **14 November**, so it should not be compared directly with full months.

## Power BI dashboard

The report has three pages. The screenshots below are previews; the [PBIX file](powerbi/ecommerce_sales_dashboard.pbix) contains the interactive report.

### 1. Sales Overview

Completed-sales KPIs, monthly trends and order status distribution.

![Sales Overview Power BI report](images/Sales%20Overview.png)

### 2. Product Performance

Revenue by category and brand, product comparisons and leading products.

![Product Performance Power BI report](images/Product%20Perfomance.png)

### 3. Customers, Orders & Ratings

Purchasing customers, repeat purchasing, order outcomes and review ratings.

![Customers, Orders and Ratings Power BI report](images/Customers%2C%20Orders%20%26%20Ratings.png)

## Data quality and limitations

The notebook and SQL checks found no missing values, duplicate primary keys, broken references or monetary reconciliation differences in the validated tables. The preparation process converted dates and removed two columns; it did **not** artificially correct inconsistent dates.

Two chronology issues remain in the source data:

- **9,930 orders** are dated before the associated customer's signup.
- **7,455 reviews** are dated before the corresponding order.

I retained these records and documented the limitations rather than inventing replacement dates. As a result, signup dates should not be used for customer-tenure or cohort conclusions, and review dates should not be used to measure time from purchase to review. Reviews also cover orders of different statuses. The dataset does not support conclusions about profit, acquisition costs or causal drivers of customer behaviour.

More detail is available in the [preparation notebook](notebooks/01_data_preparation.ipynb), [SQL validation script](sql/02_data_validation.sql) and [data dictionary](data/data_dictionary.md).

## Project files and documentation

| Resource | Contents |
| --- | --- |
| [Python notebook](notebooks/01_data_preparation.ipynb) | Preparation, validation and CSV exports |
| [SQL scripts and guide](sql/README.md) | Schema, validation, business analysis and setup instructions |
| [Power BI report and guide](powerbi/README.md) | Report pages, model and opening/refresh guidance |
| [DAX documentation](docs/dax_measures.md) | 22 exported measures, formulas and calculation notes |
| [Data dictionary](data/data_dictionary.md) | Tables, fields and known limitations |
| [Dashboard documentation](dashboard/README.md) | Bonus web dashboard setup and verification notes |

The original CSVs are in `data/raw/` and prepared CSVs in `data/processed/`. The repository also includes `requirements.txt` for the Python analysis environment.

## Bonus: AI-Assisted Interactive Dashboard

I also built a supplementary interactive dashboard using React and AI-assisted development tools, deployed on Vercel. It provides period filters, sales charts, customer views and a sortable product table.

**[View the live dashboard](https://ecommerce-sales-dashboard-zeta.vercel.app/)**

This is an additional way to explore the results; the main analytics deliverables are the Python notebook, MySQL analysis and Power BI report.
