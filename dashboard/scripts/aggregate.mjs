import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from 'csv-parse/sync';
import { aggregatePeriods, tables, primaryKeys } from './analytics.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, '..');
const target = resolve(root, 'src/data/dashboard.json');
const manifestFile = resolve(root, 'src/data/provenance.json');
const checkOnly = process.argv.includes('--check');
const sha = content => createHash('sha256').update(content).digest('hex');
const sourceFiles = [...tables.map(t => `data/processed/${t}.csv`), 'sql/01_create_schema.sql', 'sql/02_data_validation.sql', 'sql/03_business_analysis.sql', 'data/data_dictionary.md'];
const present = sourceFiles.filter(name => existsSync(resolve(source, name)));

if (present.length === 0) {
  // A standalone export uses the committed, checksummed aggregate snapshot.
  // No fallback is allowed for partially missing source files.
  assert.ok(existsSync(target) && existsSync(manifestFile), 'No source datasets or verified aggregate snapshot. Build in the original repository first.');
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
  assert.equal(sha(readFileSync(target)), manifest.aggregateSha256, 'Aggregate snapshot checksum mismatch');
  assert.equal(sha(readFileSync(resolve(root, 'scripts/analytics.mjs'))), manifest.analyticsSha256, 'Aggregation logic changed. Regenerate with the processed sources present.');
  console.log('Standalone build: verified committed aggregate snapshot; source data unavailable for revalidation.');
} else {
  assert.equal(present.length, sourceFiles.length, 'Incomplete source checkout. All five processed datasets, SQL files, and dictionary are required.');
  const data = {};
  for (const table of tables) {
    data[table] = parse(readFileSync(resolve(source, `data/processed/${table}.csv`)), { columns: true, skip_empty_lines: true, bom: true });
    assert.ok(data[table][0]?.[primaryKeys[table]], `Invalid CSV header for ${table}`);
  }
  const result = aggregatePeriods(data);
  const content = JSON.stringify(result, null, 2) + '\n';
  const manifest = {
    aggregateSha256: sha(content),
    analyticsSha256: sha(readFileSync(resolve(root, 'scripts/analytics.mjs'))),
    sources: Object.fromEntries(sourceFiles.map(name => [name, sha(readFileSync(resolve(source, name)))])),
    sqlMapping: { kpis: [3, 5], monthly: [4], categories: [6], brands: [7], topProducts: [8] },
  };
  const manifestContent = JSON.stringify(manifest, null, 2) + '\n';
  if (checkOnly) {
    assert.equal(readFileSync(target, 'utf8'), content, 'Snapshot differs from processed datasets. Run the build to regenerate.');
    assert.equal(readFileSync(manifestFile, 'utf8'), manifestContent, 'Source or calculation provenance changed. Regenerate and review.');
  } else {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
    writeFileSync(manifestFile, manifestContent);
  }
  console.log(JSON.stringify({ kpis: result.kpis, validation: result.validation, snapshot: checkOnly ? 'matches' : 'generated' }, null, 2));
}
