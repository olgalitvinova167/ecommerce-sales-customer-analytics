# E-commerce Sales & Customer Analytics

**Python · Pandas · MySQL · Power BI · DAX**

## About the project

This end-to-end analytics project examines e-commerce sales, product performance, customer purchasing behaviour and order outcomes.

**Business objective:** distinguish completed sales from orders in other statuses, assess product and customer performance, and evaluate whether the source data supports reliable business conclusions.

I prepared and validated five related tables using Python and Pandas, performed business analysis in MySQL and built a three-page interactive Power BI report.

**The dataset is synthetic.** Findings demonstrate analytical methods rather than the actual performance of a real business.

**Explore:** [Power BI previews](#power-bi-dashboard) · [Python notebook](notebooks/01_data_preparation.ipynb) · [SQL analysis](sql/03_business_analysis.sql) · [Power BI file (.pbix)](powerbi/ecommerce_sales_dashboard.pbix) · [Data Quality Report](data/data_quality_report.md)

## What I worked on

- **Python / Pandas:** prepared five tables, converted date fields, validated the data and removed two columns following documented checks.
- **Data quality:** checked primary keys, relationships, financial calculations and chronological consistency.
- **MySQL:** analysed sales, products, customers and order statuses using joins, CTEs, aggregations and window functions.
- **Power BI / DAX:** developed a data model, KPI measures and a three-page interactive report.

## Dataset

Orders cover **1 January 2024 to 14 November 2025**. November is incomplete, and the source does not specify a currency.

| Table | Rows | Description |
|---|---:|---|
| `users` | 10,000 | Customers |
| `products` | 2,000 | Product catalogue |
| `orders` | 20,000 | Orders and statuses |
| `order_items` | 43,525 | Items within orders |
| `reviews` | 15,000 | Product reviews and ratings |

**Source and licence:** [E-commerce_dataset](https://www.kaggle.com/datasets/abhayayare/e-commerce-dataset) by **Abhay Ayare**, generated with Python, Faker, NumPy and Pandas. Kaggle lists the dataset under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Original files are retained in `data/raw/`; prepared files are in `data/processed/`. Changes include date conversions and removal of `products.rating` and `reviews.review_text`. Attribution and ShareAlike terms apply to the dataset and its adaptations, not automatically to independently developed project code.

## Key KPIs

Sales KPIs include **completed orders only** (`order_status = 'completed'`) and were cross-checked against SQL and Power BI results.

| Metric | Result |
|---|---:|
| Completed revenue | **2,419,712.58** |
| Completed orders | **4,021** |
| Average completed order value | **601.77** |
| Items sold in completed orders | **12,226** |
| Customers with completed orders | **3,320** |
| Repeat customers (2+ completed orders) | **612** |
| Repeat customer rate | **18.43%** |

## Key findings

**1. Most purchasing customers placed one completed order.** Of 3,320 customers with completed orders, 2,708 placed one and 612 placed at least two. The **18.43%** repeat rate describes this observation period, not long-term customer retention.

**2. Almost 40% of orders were cancelled or returned.** Cancelled orders account for **19.60%** (3,920), and returned orders for **20.33%** (4,066): **39.93%** combined. The available data does not reliably establish the reasons. These are shares of order counts, not estimates of lost revenue.

**3. Order status materially changes sales reporting.** Total order value across all statuses is **11,918,668.95**, versus **2,419,712.58** for completed orders. This project defines completed revenue using `completed` orders only, excluding cancelled, returned and unfinished orders.

**4. Electronics leads completed sales by category.** Electronics contributes approximately **966K**, or around **40%** of total completed revenue (**2.42M**), followed by Automotive at approximately **545K**. This shows that completed sales value is concentrated in a few categories; it does not establish their profitability. Values are rounded as displayed in the Power BI report.

**5. Category ratings are closely grouped.** Average ratings range from **3.52 to 3.58**, offering limited differentiation between product categories on this metric alone.

## Business recommendations

*These are illustrative next steps for a synthetic case study, not proven causes of business problems or guaranteed improvements for a real retailer.*

**1. Capture structured cancellation and return reasons.** Offer customers a reason selection when cancelling an order or returning an item, and store it against the relevant order or item. This would enable evidence-based analysis of the most common reasons.

**2. Monitor cancellations and returns separately.** Track their counts and rates over time to identify changes in each process independently, rather than combining them into one outcome.

**3. Segment repeat purchasing behaviour.** Compare customers with one versus multiple completed orders, including the product categories they buy, before considering initiatives intended to increase purchase frequency.

## Power BI dashboard

The report has three interactive pages. The screenshots below provide previews; [download the `.pbix` file](powerbi/ecommerce_sales_dashboard.pbix) to explore the report in Power BI Desktop.

### 1. Sales Overview

Completed-sales KPIs, monthly sales trends and order status distribution.

![Sales Overview Power BI report](images/Sales%20Overview.png)

### 2. Product Performance

Revenue by category and brand, product comparisons and leading products.

![Product Performance Power BI report](images/Product%20Perfomance.png)

### 3. Customers, Orders & Ratings

Purchasing customers, repeat purchases, order outcomes and product ratings.

![Customers, Orders and Ratings Power BI report](images/Customers%2C%20Orders%20%26%20Ratings.png)

## Data quality and limitations

Data quality assessment was an important analytical outcome, not just a preparation step. Checks found no missing values, duplicate primary keys, broken checked relationships or order-amount reconciliation differences. However, two substantial chronology issues were identified:

| Issue | Affected records | Share |
|---|---:|---:|
| Orders dated before customer signup | **9,930 of 20,000** | **49.65%** |
| Reviews dated before their orders | **7,455 of 15,000** | **49.70%** |

These records were retained rather than assigned invented dates. As a result, customer-tenure and registration-based cohort conclusions, as well as purchase-to-review timing, cannot be established reliably. These date issues do not, by themselves, invalidate the completed-order financial totals.

Two column removals were also supported by checks:

- **`products.rating`:** among 1,999 products with reviews, **1,989** source ratings differed from averages calculated using `reviews.rating` (rounded to two decimals). Because the source calculation method was undocumented, the processed table excludes `products.rating` and uses individual review ratings for analysis.
- **`reviews.review_text`:** 15,000 reviews contained only **10 distinct, repeated comments**, without a clear pattern explaining cancellation or return reasons. The field was excluded from processed data but remains in the raw files.

Other limitations include the synthetic dataset, unspecified currency and timezones, incomplete November 2025 data, and insufficient information to calculate profit or customer acquisition costs.

See the [Data Quality Report](data/data_quality_report.md) and [Data Dictionary](data/data_dictionary.md) for the checks, decisions and field definitions.

## Project files and documentation

| Resource | Contents |
|---|---|
| [Python notebook](notebooks/01_data_preparation.ipynb) | Preparation, validation and CSV exports |
| [SQL scripts and guide](sql/README.md) | Schema, validation, business analysis and setup |
| [Power BI report and guide](powerbi/README.md) | Report pages, model and opening instructions |
| [DAX documentation](docs/dax_measures.md) | 22 measures, formulas and calculation notes |
| [Data Quality Report](data/data_quality_report.md) | Data quality checks and cleaning decisions |
| [Data Dictionary](data/data_dictionary.md) | Table and field definitions |

Python dependencies are listed in [`requirements.txt`](requirements.txt).

## Bonus: Interactive web dashboard

A supplementary web dashboard provides another way to explore the analytical results, with period filters, sales charts, customer views and a sortable product table.

**[Explore the live dashboard on Vercel](https://ecommerce-sales-dashboard-zeta.vercel.app/)**

This visualization complements the main Python, MySQL and Power BI analysis.
