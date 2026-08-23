import dotenv from 'dotenv';
dotenv.config();

import { dbDriver } from '../db/database';
import { EvaluationService } from '../services/evaluationService';

async function main() {
  const isGeminiKeySet = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);

  console.log('================================================================');
  console.log('SmartSpend / AI Budget Guardian: Transaction Classification Benchmark');
  console.log('================================================================\n');

  if (!isGeminiKeySet) {
    console.warn('⚠️  GEMINI_API_KEY not set — this run used the heuristic fallback only, not the actual Gemini model. Results reflect keyword-matching accuracy, not AI classification accuracy.\n');
  }

  console.log('Initializing SQLite database and synthetic benchmark suite...');
  await dbDriver.initialize();

  console.log('Running evaluation against 60 synthetic Indian transactions...');
  const report = await EvaluationService.runBenchmark(true);

  if (!isGeminiKeySet) {
    console.log('\n⚠️  GEMINI_API_KEY not set — this run used the heuristic fallback only, not the actual Gemini model. Results reflect keyword-matching accuracy, not AI classification accuracy.\n');
  }

  console.log('\n' + EvaluationService.generateMarkdownReport(report));
  console.log('================================================================');
  console.log(`Benchmark completed successfully. Accuracy: ${report.overallAccuracy}%`);
  console.log('Report saved to SQLite table: evaluation_runs');
  console.log('================================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error during benchmark run:', err);
  process.exit(1);
});
