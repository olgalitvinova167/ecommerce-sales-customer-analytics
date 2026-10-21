"""Read-only, independent SQL parity check. Python standard library only.

Runs the existing SELECT statements in an in-memory SQLite database, registering
MySQL's DATE_FORMAT for the sole '%Y-%m' format used by the existing queries.
No SQL/source files are modified. This does not claim native MySQL execution.
"""
import csv
import json
import re
import sqlite3
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent
snapshot = json.loads((ROOT / 'src/data/dashboard.json').read_text(encoding='utf-8'))
db = sqlite3.connect(':memory:')
db.row_factory = sqlite3.Row
db.create_function('DATE_FORMAT', 2, lambda value, fmt: value[:7] if fmt == '%Y-%m' else None)
money_columns = {'price', 'total_amount', 'item_price', 'item_total'}
integer_columns = {'quantity', 'rating'}

for table in ['users', 'products', 'orders', 'order_items', 'reviews']:
    with (SOURCE / 'data/processed' / f'{table}.csv').open(encoding='utf-8-sig', newline='') as handle:
        reader = csv.DictReader(handle)
        columns = reader.fieldnames
        assert columns
        declarations = ', '.join(f'"{c}" ' + ('REAL' if c in money_columns else 'INTEGER' if c in integer_columns else 'TEXT') for c in columns)
        db.execute(f'CREATE TABLE "{table}" ({declarations})')
        rows = [[float(r[c]) if c in money_columns else int(r[c]) if c in integer_columns else r[c] for c in columns] for r in reader]
        db.executemany(f'INSERT INTO "{table}" VALUES ({",".join("?" for _ in columns)})', rows)
        db.execute(f'CREATE UNIQUE INDEX "{table}_pk" ON "{table}" ("{columns[0]}")')


def statements(filename):
    sql = (SOURCE / 'sql' / filename).read_text(encoding='utf-8-sig')
    sql = re.sub(r'--[^\n]*', '', sql)
    return [s.strip() for s in sql.split(';') if s.strip() and not s.strip().upper().startswith('USE ')]


queries = statements('03_business_analysis.sql')


def verify_view(view, period):
    for section, key in [(3, 'kpis'), (4, 'monthly'), (5, 'kpis'), (6, 'categories'), (7, 'brands'), (8, 'topProducts')]:
        actual = [dict(row) for row in db.execute(queries[section - 1])]
        expected = [view[key]] if key == 'kpis' else view[key]
        # Category/brand SQL has no secondary tie order; compare those rows by key.
        if key in ('categories', 'brands'):
            label = 'category' if key == 'categories' else 'brand'
            actual = sorted(actual, key=lambda r: r[label])
            expected = sorted(expected, key=lambda r: r[label])
        assert len(actual) == len(expected), f'{period}, section {section}: row count mismatch'
        for sql_row, dashboard_row in zip(actual, expected):
            for field, value in sql_row.items():
                assert value == dashboard_row[field], f'{period}, section {section}, {field}: SQL {value}, dashboard {dashboard_row[field]}'
    status_rows = {r['order_status']: dict(r) for r in db.execute(queries[1])}
    for row in view['statusDistribution']:
        source_row = status_rows.get(row['label'])
        assert row['count'] == (source_row['order_count'] if source_row else 0)
        assert row['percentage'] == (source_row['order_share_pct'] if source_row else 0)
    customer_cte = "WITH customer_orders AS (SELECT user_id, COUNT(*) AS n FROM orders WHERE order_status = 'completed' GROUP BY user_id) "
    new_queries = {
        'customerFrequency': customer_cte + "SELECT CASE WHEN n >= 4 THEN '4+' ELSE CAST(n AS TEXT) END AS label, COUNT(*) AS count FROM customer_orders GROUP BY label",
        'customerGender': customer_cte + "SELECT u.gender AS label, COUNT(*) AS count FROM customer_orders c JOIN users u ON u.user_id = c.user_id GROUP BY u.gender",
        'ratingDistribution': "SELECT CAST(r.rating AS TEXT) AS label, COUNT(*) AS count FROM reviews r JOIN orders o ON o.order_id = r.order_id GROUP BY r.rating",
    }
    for key, query in new_queries.items():
        actual = {r['label']: r['count'] for r in db.execute(query)}
        total = sum(actual.values())
        assert sum(r['count'] for r in view[key]) == total, f'{period}: {key} total'
        for row in view[key]:
            n = actual.get(row['label'], 0)
            assert row['count'] == n, f'{period}: {key} {row}'
            pct = float((Decimal(n) * 100 / total).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)) if total else None
            assert row['percentage'] == pct, f'{period}: {key} percentage'
    assert sum(r['count'] for r in view['customerGender']) == view['kpis']['customers_with_completed_orders']
    assert view['customerFrequency'][0]['count'] == view['kpis']['customers_with_completed_orders'] - view['kpis']['repeat_customers']
    assert sum(r['count'] for r in view['customerFrequency'][1:]) == view['kpis']['repeat_customers']
    print(f'PASS {period}: existing sales outputs; status shares; frequency, gender, rating counts and percentages; one-time/repeat partitions')


verify_view(snapshot, 'All periods')
# Filter only the in-memory orders relation. Original SQL SELECTs and source files
# remain unchanged; all joins and customer counts therefore use the same scope.
db.execute('ALTER TABLE orders RENAME TO source_orders')
for period, view in snapshot['periods'].items():
    year, quarter = period.split('-')
    conditions = []
    if year != 'all':
        assert year in ('2024', '2025')
        conditions.append(f"strftime('%Y', order_date) = '{year}'")
    if quarter != 'all':
        assert quarter in ('1', '2', '3', '4')
        first_month = (int(quarter) - 1) * 3 + 1
        conditions.append(f"CAST(strftime('%m', order_date) AS INTEGER) BETWEEN {first_month} AND {first_month + 2}")
    db.execute('CREATE TEMP VIEW orders AS SELECT * FROM source_orders WHERE ' + ' AND '.join(conditions))
    verify_view(view, period)
    db.execute('DROP VIEW orders')
db.execute('ALTER TABLE source_orders RENAME TO orders')

for index, query in enumerate(statements('02_data_validation.sql')):
    rows = [dict(row) for row in db.execute(query)]
    if index == 0:
        assert {r['table_name']: r['row_count'] for r in rows} == snapshot['validation']['rowCounts']
    else:
        for row in rows:
            for key, value in row.items():
                if key == 'check_name':
                    continue
                expected = {'reviews_before_order': snapshot['validation']['chronology']['reviewsBeforeOrder'], 'orders_before_signup': snapshot['validation']['chronology']['ordersBeforeSignup']}.get(key, 0)
                # Binary REAL equality is unsuitable for the original DECIMAL amount
                # checks. Those two SELECTs are verified below using integer cents.
                if key not in ('item_total_mismatches', 'order_total_mismatches'):
                    assert value == expected, f'{key}: {value}, expected {expected}'

# Re-load monetary fields as integer cents for exact DECIMAL-equivalent equality.
from decimal import Decimal
for table, fields in [('orders', ['total_amount']), ('order_items', ['item_price', 'item_total'])]:
    with (SOURCE / 'data/processed' / f'{table}.csv').open(encoding='utf-8-sig', newline='') as handle:
        pk = 'order_id' if table == 'orders' else 'order_item_id'
        for row in csv.DictReader(handle):
            assignments = ', '.join(f'{field} = ?' for field in fields)
            values = [int(Decimal(row[field]) * 100) for field in fields]
            db.execute(f'UPDATE {table} SET {assignments} WHERE {pk} = ?', [*values, row[pk]])
for query in statements('02_data_validation.sql'):
    if 'AS item_total_mismatches' in query or 'AS order_total_mismatches' in query:
        assert db.execute(query).fetchone()[0] == 0
print('PASS validation SQL: row counts, relationships, exact amounts, and known chronology counts')
print('All dashboard outputs match the existing SQL SELECTs in SQLite. Native MySQL was not run.')
