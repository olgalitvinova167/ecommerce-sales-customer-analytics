# DAX Measures

[Project overview](../README.md) · [Power BI report guide](../powerbi/README.md)

## Source and scope

Authoritative source: `Ecommerce_DAX_Measures.txt`, supplied by the project owner as an export from Power BI Desktop using `INFO.VIEW.MEASURES()`. The supplied file contains **22 measures**, rather than the 21 stated in the request; the additional final entry is `Demand Ranking Score`. All 22 are documented below, with their exported expressions unchanged. All have home table `_Measures`. Exported Description fields are empty; explanations here are documentation derived from the formulas, not descriptions claimed to exist in the model.

Only export column delimiters and surrounding line breaks are removed from code blocks. Internal whitespace, literals and expressions are preserved. The export does not include relationships, storage modes or format strings. Formula inspection and read-only CSV calculations do not constitute a new Power BI Desktop execution or validation of every slicer combination.

## Measure inventory

| Group | Measures | Count |
| --- | --- | ---: |
| [Sales and Revenue](#sales-and-revenue) | `Completed Revenue`; `Completed AOV`; `Total Order Value`; `Completed Revenue per Item` | 4 |
| [Orders and Order Status](#orders-and-order-status) | `Completed Orders`; `Total Orders`; `Cancelled Orders`; `Cancellation Rate`; `Returned Orders`; `Return Rate` | 6 |
| [Customers and Retention](#customers-and-retention) | `Customers with Completed Orders`; `Repeat Customers`; `Repeat Customer Rate`; `Customers with Cancelled or Returned Orders` | 4 |
| [Product Performance and Ranking](#product-performance-and-ranking) | `Completed Items Sold`; `Product Revenue Rank within Category`; `Demand Ranking Score` | 3 |
| [Ratings and Reviews](#ratings-and-reviews) | `Average Rating`; `Review Count` | 2 |
| [Supporting and Display Measures](#supporting-and-display-measures) | `Average Rating Display`; `Review Count Display`; `Repeat Customer Rate Trend` | 3 |

## Key KPI definitions and filter context

- **Completed revenue:** sum of completed-order item totals. **Completed orders:** distinct order IDs represented in those items. **Completed units:** sum of their quantities.
- **Completed AOV:** arithmetic average of completed order totals in FactOrders. In the unrestricted current snapshot, it equals completed revenue divided by completed orders because the order totals reconcile and the populations coincide; the expressions are not interchangeable in every filter context.
- **Repeat rate:** customers with at least two completed orders divided by customers with at least one completed order, in the effective observation window.
- **Cancellation and return rates:** distinct orders of the specified status divided by current-context distinct item order IDs. They are order-count shares, not monetary or unit rates.
- **Ratings:** mean review rating across the effective review population, with no explicit completed-only restriction.

CALCULATE status predicates replace an existing filter on the same status column; other filters remain subject to model relationship propagation. None of the `Total` measures removes filters. Product filters can restrict items without necessarily restricting FactOrders in the reverse direction. Exact report behaviour requires its relationships and visual interactions, not just these expressions.

DIVIDE has no alternate-result argument in these measures: a zero or BLANK denominator returns BLANK. Percent measures return fractions; percentage display is a model/visual formatting choice not specified in the export. AVERAGE ignores blank values. The exported monetary calculations do not round to two decimal places or specify a currency.

## Sales and Revenue

### Completed Revenue

```dax
CALCULATE(
    SUM(FactOrderItems[item_total]),
    FactOrders[order_status] = "completed"
)
```

Sums order-line amounts, restricted to completed orders. It does not sum whole-order totals once per line. Product/category filters affect the included items through model relationships.

### Completed AOV

```dax
CALCULATE(
    AVERAGE(FactOrders[total_amount]),
    FactOrders[order_status] = "completed"
)
```

Averages nonblank FactOrders[total_amount] values for completed orders: one contribution per order row. This is an order-level average, not a ratio of the two exported item-based measures. See the consistency findings below.

### Total Order Value

```dax
SUM(FactOrderItems[item_total])
```

Sums item totals in the current context, with no explicit status exclusion. It includes all statuses only when the context is unrestricted; it is not completed revenue.

### Completed Revenue per Item

```dax
DIVIDE(
    [Completed Revenue],
    [Completed Items Sold]
)
```

Divides completed revenue by completed units sold. This is a quantity-weighted realised amount per unit, not an average of product list prices or order-line amounts.

## Orders and Order Status

### Completed Orders

```dax
CALCULATE(
    DISTINCTCOUNT(FactOrderItems[order_id]),
    FactOrders[order_status] = "completed"
)
```

Counts distinct order IDs in FactOrderItems for completed orders. Multiple lines of the same order count once. Orders without items cannot contribute; validation found no such orders in the current snapshot.

### Total Orders

```dax
DISTINCTCOUNT(FactOrderItems[order_id])
```

Counts distinct FactOrderItems[order_id] values in the current context, not rows of FactOrders or order lines. Product/category order counts can overlap and must not be summed to obtain a global order count.

### Cancelled Orders

```dax
CALCULATE(
    DISTINCTCOUNT(FactOrderItems[order_id]),
    FactOrders[order_status] = "cancelled"
)
```

Counts distinct item-level order IDs after applying cancelled status. The status predicate replaces a filter on the same FactOrders status column.

### Cancellation Rate

```dax
DIVIDE(
    [Cancelled Orders],
    [Total Orders]
)
```

Divides cancelled orders by Total Orders in the current context. The denominator is not explicitly cleared of status filters. In the unrestricted snapshot this is the share of all orders cancelled, not a revenue-loss rate.

### Returned Orders

```dax
CALCULATE(
    DISTINCTCOUNT(FactOrderItems[order_id]),
    FactOrders[order_status] = "returned"
)
```

Counts distinct item-level order IDs after applying returned status. It counts orders, not returned units or refund transactions.

### Return Rate

```dax
DIVIDE(
    [Returned Orders],
    [Total Orders]
)
```

Divides returned orders by Total Orders in the current context. The denominator includes all statuses only when no status filter applies. This is an order-count share, not a returned-unit rate.

## Customers and Retention

### Customers with Completed Orders

```dax
CALCULATE(
    DISTINCTCOUNT(FactOrders[user_id]),
    FactOrders[order_status] = "completed"
)
```

Counts distinct FactOrders[user_id] values on completed orders. The population is purchasing customers, not every registered user.

### Repeat Customers

```dax
COUNTROWS(
    FILTER(
        VALUES(FactOrders[user_id]),
        CALCULATE(
            COUNTROWS(FactOrders),
            FactOrders[order_status] = "completed"
        ) >= 2
    )
)
```

Starts with distinct users visible in the outer context. FILTER tests each user; CALCULATE converts that user row context to filter context and counts completed FactOrders rows. At least two completed orders are required. Validated unique order IDs make this row count an order count. Qualification is within the effective date and other filters, not necessarily lifetime. An outer status filter can restrict the initial candidate users before the inner completed filter is applied.

### Repeat Customer Rate

```dax
DIVIDE(
    [Repeat Customers],
    [Customers with Completed Orders]
)
```

Divides repeat customers by customers with completed orders, not all registered customers. Both measures are reevaluated in the current context. This measures observed repeat purchasing, not cohort retention.

### Customers with Cancelled or Returned Orders

```dax
CALCULATE(
    DISTINCTCOUNT(FactOrders[user_id]),
    FactOrders[order_status] IN { "Cancelled", "Returned" }
)
```

Counts distinct users with at least one order in either listed status. A customer with both statuses counts once and can also belong to the completed-customer population. Capitalised literals are preserved exactly; see the casing finding below.

## Product Performance and Ranking

### Completed Items Sold

```dax
CALCULATE(
    SUM(FactOrderItems[quantity]),
    FactOrders[order_status] = "completed"
)
```

Sums quantity on completed-order lines. Counts units, not distinct products or order lines.

### Product Revenue Rank within Category

```dax
VAR CurrentCategory =
    SELECTEDVALUE(DimProduct[category])

VAR CurrentProductRevenue =
    [Completed Revenue]

RETURN
IF(
    NOT ISBLANK(CurrentProductRevenue),
    RANKX(
        FILTER(
            ALLSELECTED(DimProduct),
            DimProduct[category] = CurrentCategory
                && NOT ISBLANK([Completed Revenue])
        ),
        CALCULATE([Completed Revenue]),
        ,
        DESC,
        DENSE
    )
)
```

Captures the single visible category using SELECTEDVALUE and the current completed revenue. If that revenue is BLANK, no rank is returned. RANKX ranks descending, with dense ties, over ALLSELECTED(DimProduct) filtered to that category and nonblank completed revenue. External product selections constrain the comparison set; this is not an unconditional rank across the full catalogue. Measure evaluation in FILTER and CALCULATE inside RANKX evaluates revenue for each candidate product row. Zero revenue is not explicitly excluded. Multiple categories make CurrentCategory BLANK; category totals also do not identify a single product. The expression has no ISINSCOPE guard, so totals need a visual-context check rather than interpretation as a product rank.

### Demand Ranking Score

```dax
[Completed Items Sold] * 1000000
    + [Completed Revenue]
```

Adds completed revenue to completed units multiplied by 1,000,000. This is a numeric sorting score, not revenue or a statistical demand forecast. It favours units but does not guarantee lexicographic units-first sorting for arbitrary data: a revenue difference of at least 1,000,000 can offset a one-unit difference. No incorrect current ordering is established by that scaling risk.

## Ratings and Reviews

### Average Rating

```dax
AVERAGE(FactReviews[rating])
```

Arithmetic mean of nonblank FactReviews[rating] values, weighted equally per review record. No completed-order restriction is present. Effective product/date/status filtering depends on model relationships and the visual context.

### Review Count

```dax
COUNTROWS(FactReviews)
```

Counts FactReviews rows in context, not distinct reviewers or reviewed products. No status restriction is specified. COUNTROWS returns BLANK for an empty table.

## Supporting and Display Measures

### Average Rating Display

```dax
IF(
    ISBLANK([Average Rating]),
    "-",
    FORMAT([Average Rating], "0.00")
)
```

Returns a hyphen when Average Rating is BLANK; otherwise formats it to two decimal places. FORMAT returns text, so use the numeric measure for arithmetic and numeric sorting.

### Review Count Display

```dax
IF(
    ISBLANK([Review Count]),
    "-",
    FORMAT([Review Count], "#,0")
)
```

Returns a hyphen when Review Count is BLANK; otherwise formats it as grouped whole-number text. This display result is not a numeric count.

### Repeat Customer Rate Trend

```dax
COALESCE ( [Repeat Customer Rate], 0 )
```

Replaces a BLANK repeat rate with numeric zero. This avoids gaps but makes no eligible denominator look like a measured zero repeat rate; interpret empty periods accordingly.

## Consistency review and remaining checks

### Confirmed documentation discrepancy: AOV definition

The previous root README described Completed AOV as revenue divided by order count. The export instead uses `AVERAGE(FactOrders[total_amount])` under completed status. The README now reflects the actual formula; no DAX was changed.

Read-only calculations on [processed orders](../data/processed/orders.csv) and [processed order items](../data/processed/order_items.csv) confirm 4,021 completed order rows and 4,021 distinct completed item order IDs. Both order totals and item totals sum to 2,419,712.58. Their order average is 601.7688584929..., displayed as **601.77**. This agrees with the previously verified all-period KPI and with [SQL business analysis](../sql/03_business_analysis.sql). It does not prove equivalence after product/category filtering: the order average can retain whole-order totals or a different order population while the revenue numerator includes only selected items. Check such contexts in Desktop before claiming equivalent filtered AOV definitions.

**Classification:** documentation only, corrected. No all-period numerical defect established.

### Confirmed definitions: order and repeat-customer populations

Total Orders deliberately uses distinct IDs in FactOrderItems. The [validation script](../sql/02_data_validation.sql) checks orders without items and monetary reconciliation; the current validated snapshot supports agreement with order-table counts at unrestricted scope. Orders appearing in more than one category must not be added across categories.

Repeat Customers requires at least two completed orders, consistent with SQL section 5 and the confirmed 612 repeat customers out of 3,320 completed-order customers (18.43%). It is not a count of customers with two orders of any status. Outer status selections and model filter propagation remain contextual checks, not a confirmed error in these all-period results.

### Status casing: not a confirmed defect

The processed order statuses and data dictionary use lowercase `cancelled` and `returned`; Customers with Cancelled or Returned Orders uses `"Cancelled"` and `"Returned"`. Power BI's engine is case insensitive, so this casing difference alone does not establish failed matches. Microsoft documents special considerations for DirectQuery with case-sensitive sources: [DirectQuery guidance](https://learn.microsoft.com/en-za/power-bi/connect-data/desktop-directquery-about).

The CSV reference population is **5,540 distinct users** with either cancelled or returned orders at unrestricted scope. This is a CSV cross-check, not a claimed new DAX runtime result. If this measure is checked in Desktop, reset filters and compare against that population; inspect storage mode, source collation and relationships if it differs. No casing correction was made or is required solely on the evidence of mixed letter case.

### Context-dependent risks requiring verification

| Area | Evidence from expression | Recommended verification | Status |
| --- | --- | --- | --- |
| Filtered AOV | Order-table AVERAGE versus item-based revenue/count | Compare product/category selections and relationship propagation; distinguish whole-order AOV from selected-item value per order | Possible interpretation mismatch; no confirmed current visual defect |
| Category product rank | SELECTEDVALUE, ALLSELECTED and no ISINSCOPE guard | Check single-category product rows, selected subsets, ties and totals; do not interpret a multi-category total as a product rank | Context-dependent limitation |
| Status-filtered rates | Numerator replaces its status filter; denominator does not clear status | Check any status slicer or cross-filtering used on rate visuals | Possible denominator mismatch under those interactions |
| Repeat customer candidates | VALUES(user_id) evaluated before the inner completed filter | Check explicit status selections if offered by the report | Context-dependent limitation |
| Demand score | Fixed 1,000,000 weighting | Reassess scale if data grows or the score is reused at other aggregation levels | Optional future robustness check |
| Empty-period trend | COALESCE converts BLANK to zero | Distinguish no eligible completed customers from a measured zero repeat rate when interpreting trends | Documented display choice |

No confirmed numerical DAX defect in the previously verified headline KPIs was established by this review. Their reference values remain in the [project README](../README.md#power-bi-dashboard). This review does not certify unexecuted filter combinations. No formulas, PBIX, datasets or analytical code were modified.
