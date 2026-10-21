# E-commerce Sales & Customer Analytics dashboard

A supplementary React + Vite dashboard developed with AI-assisted development tools from the existing processed datasets and validated business definitions. The primary analytics deliverables are the Python, MySQL and Power BI work described in the [main project README](../README.md).

**Live demo:** [E-commerce Sales & Customer Analytics](https://ecommerce-sales-dashboard-zeta.vercel.app/), deployed on Vercel.

The data is synthetic and artificially generated for educational and portfolio purposes. Findings are illustrative, not conclusions about a real company.

## Run locally

Requirements: Node.js 22.12+ (tested with 24.19) and pnpm (tested with 11.19).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite. To build and preview the production assets:

```sh
pnpm build
pnpm preview
```

The build output is `dist/`. It contains the web application and aggregate data only. It does not contain source CSVs, individual customer records, SQL files, or Python. No database, API keys, environment variables, or runtime data service is required. Fonts use the system font stack; there are no external font or chart requests.

## Dashboard content

- Five KPI cards: Completed Revenue, Completed Orders, Completed AOV, Customers with Completed Orders, and Repeat Customer Rate.
- Three revenue charts: monthly completed revenue, completed revenue by category, and completed revenue by brand.
- Order Status Distribution, with cancellation and return rates expressed as shares of all orders in the selected period.
- Completed-order Frequency and Rating Distribution. Ratings include all order statuses and use the related order date for period selection, not the review date.
- Compact Customer Mix bar: repeat and one-time purchasing customers, showing counts and percentages for the selected period. One-time customers are purchasing customers minus repeat customers; the existing Repeat Customer Rate KPI is unchanged. All periods shows 612 repeat (18.43%) and 2,708 one-time (81.57%), totalling 3,320.
- Top 10 products table, with sortable columns and the original revenue ranks preserved.
- Exact monthly values via pointer hover, keyboard focus/activation, or touch. The bar charts display exact revenue values directly.
- Definition tooltips, keyboard-accessible navigation, responsive layout, and horizontal scrolling for dense charts/tables on narrow screens.
- Sticky navigation remains visible on desktop and mobile. Anchor scrolling accounts for the navigation's measured height, including wrapped mobile layouts.
- Year (All, 2024, 2025) and quarter (All, Q1–Q4) selectors apply to every KPI, chart, and product rank. The initial selection and reset action are **All periods**.

With Year set to All, selecting a quarter includes that quarter in both years. Repeat-customer qualification and its denominator are recomputed from completed orders within that selected period; annual or quarterly repeat counts/rates are never added or averaged. Monthly charts leave gaps where quarter selection omits intervening months. November 2025 is labelled partial whenever included.

All 15 selector combinations are calculated during the build from the processed orders and related items, using the same aggregation function. The browser selects an entire matching aggregate view atomically; it receives no customer-level records and does not derive period KPIs from already aggregated totals. Top products are ranked within each period before taking the top 10. Changing period resets table sorting and chart focus to avoid stale detail displays.

## Analytical contract

| Output | Existing SQL section | Definition |
| --- | --- | --- |
| Completed Revenue | 3 | Sum `orders.total_amount` where `order_status = 'completed'` |
| Completed Orders | 3 | Count completed orders |
| Completed AOV | 3 | Average `total_amount` across completed orders, rounded to 2 decimals |
| Customers with Completed Orders | 5 | Distinct customers with at least one completed order in the selected period |
| Repeat Customer Rate | 5 | Customers with at least 2 completed orders in the selected period / customers with at least 1 completed order in that same period × 100 |
| Monthly sales | 4 | Completed order metrics grouped by `order_date` calendar month |
| Category sales | 6 | Sum `order_items.item_total` for completed orders, joined to products and grouped by category |
| Brand sales | 7 | Same item-level revenue logic, grouped by brand |
| Top products | 8 | Product-level completed revenue; `DENSE_RANK` descending, product ID tie-breaker, `LIMIT 10` |
| Order status distribution and outcome rates | 2 | Counts and shares of all selected-period orders; cancelled and returned shares are the displayed rates |
| Customer Mix and completed-order frequency | Extension of 5 | Partition purchasing customers by their number of completed orders in the selected period |
| Rating Distribution | Extension of 10 | Count review records by rating; all statuses, restricted by the related order date |

Section numbers refer to `../sql/03_business_analysis.sql`. Product/category/brand completed-order counts use distinct order IDs. Their order counts are not additive across groups. Monetary arithmetic uses integer cents; positive half-up rounding follows MySQL exact-number `ROUND`. Final AOV is computed from orders, never averaged from grouped AOVs.

Baseline for this snapshot:

| Metric | Value |
| --- | ---: |
| Completed Revenue | 2,419,712.58 |
| Completed Orders | 4,021 |
| Completed AOV | 601.77 |
| Repeat Customers | 612 |
| Customers with completed orders | 3,320 |
| Repeat Customer Rate | 18.43% |

The coverage is 1 January 2024–14 November 2025. November 2025 is explicitly marked partial. No currency symbol is assumed.

## Data preparation and provenance

`scripts/aggregate.mjs` reads only the five CSVs in `../data/processed/`. The core calculations are in `scripts/analytics.mjs`. Before generating output, it verifies primary keys, foreign keys, user consistency, products in reviewed orders, positive quantities/amounts, statuses, rating range, orders with items, item multiplication, and order/item total equality. It reports the known chronology inconsistencies without dropping or changing records.

The script reconciles complete monthly, category, brand, and product revenue to Completed Revenue. Product reconciliation happens before limiting the table to 10 rows.

Generated files:

- `src/data/dashboard.json`: original All-periods aggregate values plus the 14 filtered views in `periods`, rendered by React.
- `src/data/provenance.json`: SHA-256 hashes of the five processed CSVs, three supporting SQL files, dictionary, aggregation logic, and generated snapshot; also maps outputs to SQL sections.

Keep both generated JSON files in version control. Do not hand-edit them.

When this folder is inside the original repository, `pnpm dev` and `pnpm build` regenerate the aggregate from the processed source files. Missing individual source files cause a failure rather than silently using stale values. `pnpm validate` independently recomputes and compares the committed snapshot without writing it.

When the dashboard folder is copied out on its own, the build verifies and uses its committed aggregate snapshot. This is a fixed snapshot: it cannot revalidate absent source CSVs. Changes to aggregation logic or the snapshot fail its checksums; regenerate in the original repository to update them. Checksums support reproducibility and accidental-change detection, not protection against intentional edits to both files.

## Verification

```sh
pnpm test
pnpm validate
python -B scripts/verify_sql.py
pnpm build
```

Run these commands from `dashboard/`. `pnpm test` includes a standalone-snapshot test that creates and removes temporary files. `pnpm dev` and `pnpm build` regenerate aggregate JSON when parent sources are present; the build also writes `dist/`. For a read-only comparison, use `pnpm validate` and the Python command only.

The Python command requires the original parent repository and Python 3, with no third-party Python packages. It executes the SELECT statements read directly from the existing SQL files against an in-memory SQLite database. MySQL `DATE_FORMAT` is registered for the calendar-month format used by the SQL. For each period, an in-memory orders view applies the year/quarter predicate before executing the same SELECTs. Money equality checks reload monetary fields as exact integer cents. No SQL files are rewritten.

The existing comparison verified displayed sales outputs in sections 3–8 for **all 15 year/quarter combinations**, status counts/shares, and the additional customer/rating distributions. Validation row counts, relationships, exact amounts and chronology counts also matched. The script uses SQLite; it does not execute native MySQL. Separately, the project owner has confirmed direct MySQL checks and agreement with the main Power BI KPIs. See the [SQL guide](../sql/README.md) and [Power BI guide](../powerbi/README.md) for that distinction and the confirmed baseline. Separate native execution logs are not included.

Representative period checks:

| Period | Completed Revenue | Completed Orders | Completed AOV | Repeat Customer Rate |
| --- | ---: | ---: | ---: | ---: |
| All periods | 2,419,712.58 | 4,021 | 601.77 | 18.43% |
| 2024, all quarters | 1,266,743.53 | 2,135 | 593.32 | 10.67% |
| 2025, Q1 | 275,889.40 | 502 | 549.58 | 2.66% |
| 2025, Q4 (through 14 Nov) | 182,134.33 | 276 | 659.91 | 0.36% |
| All years, Q4 | 503,909.08 | 790 | 637.86 | 2.74% |

The 15 Node tests cover completed-status scope, period-specific repeat-customer denominators and product rankings, calendar quarter/year boundaries, distinct order counts, ranking ties, the top-10 limit, monetary rounding, invalid relationships/amounts, empty-period results, aggregate partitions, the baseline, customer mix, distribution counts and standalone snapshot checksum enforcement. These are calculation/snapshot tests; they do not mount React components or automate browser interactions.

Earlier development checks covered the production build and local HTTP response. The retained browser regression record covers six selections in an earlier four-KPI interface. It is not a complete verification record for the current five-KPI interface and added distributions. See [UI verification scope and historical results](tests/UI_VERIFICATION.md). No fresh build, test run or browser regression is implied by this documentation update.

## Vercel deployment reference

The supplementary dashboard is deployed at the live-demo link above. The following settings document how this source is configured for Vercel; they do not establish that the deployed revision is identical to the current local files. Configuration is included in `vercel.json`.

1. Include the `dashboard/` folder, lockfile and both aggregate JSON files in the source repository.
2. Import the repository into Vercel and set **Root Directory** to `dashboard` (or leave it at the repository root if publishing this folder as a separate repository).
3. Select **Vite**. The supplied configuration uses **Install Command** `pnpm install --frozen-lockfile`, **Build Command** `pnpm build`, and **Output Directory** `dist`.
4. Choose Node.js **24.x** or another compatible version satisfying `package.json`.
5. To regenerate from the parent processed files on each deployment, enable Vercel's option to include source files outside the Root Directory. Otherwise the verified, committed aggregate snapshot is used. A partially available source checkout fails validation intentionally.
6. Deploy when ready. The generated static output has no server or database dependency.

Reference: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## Limitations

The data is synthetic and artificially generated for educational and portfolio purposes. The findings do not describe a real company. `order_date` supports calendar sales trends without timezone conversion. `signup_date` must not be used for tenure/cohorts, and `review_date` must not be used for purchase-to-review timing. The retained chronology exceptions are 9,930 orders before signup and 7,455 reviews before the order date.

The dashboard charts the distribution of `reviews.rating` from 1 to 5. It does not chart category average ratings, which vary only from 3.52 to 3.58. Review populations include all order statuses, not only completed purchases. Currency is undocumented. The dashboard does not introduce profit, conversion, lifetime value, or other unsupported measures.

## Dataset attribution and license

The source is **E-commerce_dataset** by **Abhay Ayare**, available on [Kaggle](https://www.kaggle.com/datasets/abhayayare/e-commerce-dataset) under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). It is synthetic data generated with Python, Faker, NumPy and Pandas. This dashboard uses prepared and aggregated data; distributed dataset adaptations are subject to the applicable attribution and ShareAlike terms. See the [main attribution and changes notice](../README.md#dataset-source--license). The dataset license does not automatically apply to the independently developed React or other application code. This documentation update does not alter the deployed site.
