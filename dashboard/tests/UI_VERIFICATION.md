# UI verification scope and historical regression record

## Current scope

The current source contains five KPI cards, revenue charts, a product table,
Customer Mix, Order Status Distribution, Completed-order Frequency and Rating
Distribution. The 15 Node tests check calculations and snapshots; they do not
mount the React interface. The SQL comparison script provides separate numerical
checks and does not verify browser interactions.

The results below are retained from an earlier local browser check of the
four-KPI interface. They are historical evidence, not a new verification of the
current interface or the deployed Vercel revision. No additional browser checks
were performed during the GitHub documentation update.

The following current-version checks are not established by this historical
record and remain useful regression scenarios:

- All five KPI cards and every distribution update with year/quarter selections.
- All-period reset restores the expected selection and displayed values.
- Product sorting and monthly point selection reset when the period changes.
- Keyboard and touch details, partial-month labels and narrow layouts work with
  the current sections.

These are coverage gaps, not reports of confirmed interface failures.

## Historical period-selector check

The earlier record reports verification in the local dashboard browser after
fixing duplicate sibling React keys.

The monthly chart and product table retained their component identities across
period changes. Tooltip selection and table sorting reset through effects rather
than changing component keys. No analytical code or source data was changed.

| Year | Quarter | Monthly charts | Category charts | Brand charts | Product tables | KPI sets | Month points |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| All | All | 1 | 1 | 1 | 1 | 1 | 23 |
| 2024 | All | 1 | 1 | 1 | 1 | 1 | 12 |
| 2025 | All | 1 | 1 | 1 | 1 | 1 | 11 |
| 2025 | Q1 | 1 | 1 | 1 | 1 | 1 | 3 |
| 2025 | Q4 | 1 | 1 | 1 | 1 | 1 | 2 |
| All | Q4 | 1 | 1 | 1 | 1 | 1 | 5 |

For each selection, browser checks confirmed the four KPI values against the
validated snapshot, category and brand revenue sums against the displayed KPI,
and exactly ten product rows. Product rankings changed with the selected period.
November's partial-month annotation appeared only when November 2025 was included.

After returning to All periods, pointer movement onto March 2024 showed:

- Month: Mar 2024
- Completed Revenue: 134,569.53
- Completed Orders: 213
- Completed AOV: 631.78

Keyboard focus on February 2024 also displayed its complete monthly details.
Each native point tooltip contains all four fields. The sticky navigation stayed
at the viewport top while the page was scrolled. All periods was restored after
testing.
