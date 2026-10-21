# DAX Measures

A total of **22 DAX measures** were created in Power BI to analyse sales performance, order statuses, customer purchasing behaviour, product performance, and customer reviews.

## 1. Sales & Revenue

### Completed Revenue

```dax
CALCULATE(
    SUM(FactOrderItems[item_total]),
    FactOrders[order_status] = "completed"
)
```

Calculates revenue from completed orders, excluding other order statuses. Used to assess completed sales performance.

### Completed AOV

```dax
CALCULATE(
    AVERAGE(FactOrders[total_amount]),
    FactOrders[order_status] = "completed"
)
```

Calculates the average total value of a completed order. Used to track average order value.

### Total Order Value

```dax
SUM(FactOrderItems[item_total])
```

Sums order-item values in the current filter context, without explicitly restricting order status. Used to compare overall order value with completed revenue.

### Completed Revenue per Item

```dax
DIVIDE(
    [Completed Revenue],
    [Completed Items Sold]
)
```

Divides completed revenue by the number of units sold in completed orders. Used to assess revenue generated per unit sold.

## 2. Orders & Returns

### Completed Orders

```dax
CALCULATE(
    DISTINCTCOUNT(FactOrderItems[order_id]),
    FactOrders[order_status] = "completed"
)
```

Counts distinct completed orders. Used to measure completed sales volume.

### Total Orders

```dax
DISTINCTCOUNT(FactOrderItems[order_id])
```

Counts distinct orders in the selected period or filter context. Used to measure overall order volume.

### Cancelled Orders

```dax
CALCULATE(
    DISTINCTCOUNT(FactOrderItems[order_id]),
    FactOrders[order_status] = "cancelled"
)
```

Counts distinct cancelled orders. Used to monitor cancellations.

### Cancellation Rate

```dax
DIVIDE(
    [Cancelled Orders],
    [Total Orders]
)
```

Calculates cancelled orders as a share of total orders in the current filter context. Used to track cancellation frequency.

### Returned Orders

```dax
CALCULATE(
    DISTINCTCOUNT(FactOrderItems[order_id]),
    FactOrders[order_status] = "returned"
)
```

Counts distinct returned orders. Used to monitor return volume.

### Return Rate

```dax
DIVIDE(
    [Returned Orders],
    [Total Orders]
)
```

Calculates returned orders as a share of total orders in the current filter context. Used to track return frequency.

## 3. Customer Analytics

### Customers with Completed Orders

```dax
CALCULATE(
    DISTINCTCOUNT(FactOrders[user_id]),
    FactOrders[order_status] = "completed"
)
```

Counts unique customers with at least one completed order. Used to measure the purchasing customer base.

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

Counts customers with at least two completed orders in the current context. Used to identify repeat purchasing.

### Repeat Customer Rate

```dax
DIVIDE(
    [Repeat Customers],
    [Customers with Completed Orders]
)
```

Calculates repeat customers as a share of customers with completed orders. Used to assess repeat purchasing behaviour.

### Customers with Cancelled or Returned Orders

```dax
CALCULATE(
    DISTINCTCOUNT(FactOrders[user_id]),
    FactOrders[order_status] IN { "Cancelled", "Returned" }
)
```

Counts unique customers with at least one cancelled or returned order. Used to assess how many customers are associated with cancellations or returns.

## 4. Product Performance

### Completed Items Sold

```dax
CALCULATE(
    SUM(FactOrderItems[quantity]),
    FactOrders[order_status] = "completed"
)
```

Sums units sold in completed orders. Used to analyse sales volume and product demand.

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

Ranks products within their category by completed revenue, taking selected filters into account. Used to identify leading products within each category.

### Demand Ranking Score

```dax
[Completed Items Sold] * 1000000
    + [Completed Revenue]
```

Combines units sold and completed revenue into a sorting score, with greater emphasis on unit sales. Used to rank products by demand and revenue.

## 5. Ratings & Reviews

### Average Rating

```dax
AVERAGE(FactReviews[rating])
```

Calculates the average rating from customer reviews. Used to compare product and category ratings.

### Review Count

```dax
COUNTROWS(FactReviews)
```

Counts review records. Used to show how many reviews support a product's rating.

## 6. Supporting Measures

### Average Rating Display

```dax
IF(
    ISBLANK([Average Rating]),
    "-",
    FORMAT([Average Rating], "0.00")
)
```

Displays the average rating to two decimal places, or a dash when no rating is available.

### Review Count Display

```dax
IF(
    ISBLANK([Review Count]),
    "-",
    FORMAT([Review Count], "#,0")
)
```

Formats the review count for display, or shows a dash when the count is unavailable.

### Repeat Customer Rate Trend

```dax
COALESCE ( [Repeat Customer Rate], 0 )
```

Replaces blank repeat-customer-rate values with zero for trend-chart display.
