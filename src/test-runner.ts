import { runTaxEngineTests } from './services/taxEngine.test';

const res = runTaxEngineTests();
console.log('--- BillSetu Tax Engine Verification ---');
res.results.forEach(r => console.log(r));
console.log(`\nAll Passed: ${res.passed}`);
if (!res.passed) {
  process.exit(1);
}
