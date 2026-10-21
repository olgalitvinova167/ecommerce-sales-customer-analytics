# Power BI Report

This interactive three-page Power BI report explores sales performance, product performance, customer purchasing behaviour, and reviews using e-commerce data.

[Open the PBIX file](ecommerce_sales_dashboard.pbix) · [Project overview and key results](../README.md) · [DAX measures](../docs/dax_measures.md)

## 1. Report Pages

### Sales Overview

Presents the main sales and order performance KPIs:

- Completed Revenue
- Completed Orders
- Completed AOV
- Completed Items Sold

Visualisations show monthly revenue and order trends, the distribution of orders by status, and cancellation and return rates.

### Product Performance

Enables analysis of completed sales by product category, brand, and individual product.

The main KPIs are Completed Revenue and Completed Items Sold.

Visualisations show revenue by category and brand, comparisons of revenue per unit with sales volume, and leading products by completed revenue alongside customer ratings.

### Customers, Orders & Ratings

Focuses on customer purchasing behaviour and feedback.

The main KPIs are:

- Customers with Completed Orders
- Repeat Customers
- Repeat Customer Rate
- Average Rating

Visualisations cover completed revenue by customer city, customers by gender, rating distribution, monthly customer counts by order outcome, and popular brands and products.

## 2. Navigation and Interactivity

Navigation tabs at the top of the report allow users to switch between the three pages.

Interactive filters are available on each page:

| Page | Filters |
| --- | --- |
| Sales Overview | Order period |
| Product Performance | Category, brand, order period |
| Customers, Orders & Ratings | Gender, order period |

These filters support analysis of selected periods and data segments. Reset buttons restore the corresponding filters to their default state.

The Customers, Orders & Ratings page also includes a toggle between popular brands and individual products.

## 3. Data Model

The Power BI model includes three fact tables (`FactOrders`, `FactOrderItems`, `FactReviews`), three dimension tables (`DimCustomer`, `DimProduct`, `DimDate`), the `_Measures` table, and the supporting `Rating View` table.

A total of 22 DAX measures were created to calculate the report's analytical metrics. Their formulas and purposes are documented in [DAX Measures](../docs/dax_measures.md).

Screenshots of all three report pages are available in the [main project README](../README.md#power-bi-dashboard).
