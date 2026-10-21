# Power BI Report

This three-page report explores sales, product performance and customer purchasing behaviour using synthetic e-commerce data. It is the project's main visual analytics deliverable.

[Open the PBIX file](ecommerce_sales_dashboard.pbix) · [Project overview and key results](../README.md) · [DAX measures](../docs/dax_measures.md)

## Report Pages

| Page | Focus |
| --- | --- |
| Sales Overview | Completed-sales KPIs, monthly trends and order status distribution |
| Product Performance | Revenue by category and brand, product comparisons and leading products |
| Customers, Orders & Ratings | Purchasing customers, repeat purchasing, order outcomes and review ratings |

## Data Model

The model includes three fact tables (`FactOrders`, `FactOrderItems` and `FactReviews`), three dimension tables (`DimCustomer`, `DimProduct` and `DimDate`), the `_Measures` table and the supporting `Rating View` table.

The [DAX documentation](../docs/dax_measures.md) contains the 22 exported measures, their exact formulas and explanations of calculation logic and filter context.

Screenshots of all three report pages are available in the [main README](../README.md#power-bi-dashboard).
