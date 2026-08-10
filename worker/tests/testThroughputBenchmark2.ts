import { Queue, QueueEvents } from 'bullmq';
import { ENV } from '../src/config/env';
import { redisConnection } from '../src/config/redis';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// NOTE: Also set concurrency: 6 in JudgeWorkerSetup.ts
//       Also add --cpus 1.0 flag in JudgeJobSandboxService.ts
const QUEUE_NAME = ENV.JUDGE_QUEUE_NAME || 'judge-execution-queue';
const TOTAL_JOBS = 60;   // 30 C++ + 30 Python (alternating, deterministic)

// WARMUP_JOBS must equal concurrency in JudgeWorkerSetup.ts so every warmup
// job is picked up instantly with zero queue wait. This isolates true per-job
// cost: Docker cold start + compilation + execution, with no queue contamination.
const WARMUP_JOBS = 6;

// ─── AC PAYLOADS ONLY ────────────────────────────────────────────────────────
const cppCode = `
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

void solve() {
    int n, k;
    if (!(cin >> n >> k)) return;
    vector<int> nums(n);
    for (int i = 0; i < n; ++i) cin >> nums[i];

    unordered_map<long long, int> prefixCounts;
    prefixCounts[0] = 1;
    long long currentSum = 0, count = 0;

    for (int num : nums) {
        currentSum += num;
        if (prefixCounts.find(currentSum - k) != prefixCounts.end())
            count += prefixCounts[currentSum - k];
        prefixCounts[currentSum]++;
    }
    cout << count << "\\n";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int t;
    if (cin >> t) while (t--) solve();
    return 0;
}
`;

const pythonCode = `
import sys
def solve():
    input_data = sys.stdin.read().split()
    if not input_data: return
    t = int(input_data[0])
    idx = 1
    for _ in range(t):
        if idx >= len(input_data): break
        n = int(input_data[idx])
        k = int(input_data[idx+1])
        idx += 2
        nums = [int(x) for x in input_data[idx:idx+n]]
        idx += n
        prefix_counts = {0: 1}
        current_sum = 0
        count = 0
        for num in nums:
            current_sum += num
            if (current_sum - k) in prefix_counts:
                count += prefix_counts[current_sum - k]
            prefix_counts[current_sum] = prefix_counts.get(current_sum, 0) + 1
        print(count)
solve()
`;

// Strictly alternating — 30 C++, 30 Python, no randomness
const payloads = [
    { type: 'C++',    lang: 'cpp',    code: cppCode    },
    { type: 'Python', lang: 'python', code: pythonCode },
];

// ─── STATS HELPERS ───────────────────────────────────────────────────────────
function percentile(sortedArr: number[], p: number): number {
    if (sortedArr.length === 0) return 0;
    const idx = Math.ceil((p / 100) * sortedArr.length) - 1;
    return sortedArr[Math.max(0, idx)] ?? 0;
}

function ms(n: number): string {
    return `${n.toFixed(0)}ms`;
}

// ─── BENCHMARK ───────────────────────────────────────────────────────────────
const runACBenchmark = async () => {
    const judgeQueue  = new Queue(QUEUE_NAME, { connection: redisConnection as any });
    const queueEvents = new QueueEvents(QUEUE_NAME, { connection: redisConnection as any });

    // ── PHASE 1: WARMUP ──────────────────────────────────────────────────────
    // Fire exactly WARMUP_JOBS jobs simultaneously so all worker slots fill at
    // once. Every job gets picked up with zero queue wait → pure per-job cost.
    console.log(`\n⚙️  Warmup phase: firing ${WARMUP_JOBS} jobs (one per worker slot)...\n`);

    // Fire all warmup jobs at once via Promise.all — no sequential awaiting
    const warmupJobs = await Promise.all(
        Array.from({ length: WARMUP_JOBS }, (_, i) => {
            const payload = payloads[i % payloads.length]!;
            return judgeQueue.add('warmup', {
                jobType:    'submit',
                questionId: 101,
                language:   payload.lang,
                code:       payload.code,
                userId:     `warmup-${i}`,
            });
        })
    );

    // Wait for every warmup job to complete before starting the main benchmark.
    // job.waitUntilFinished() uses QueueEvents internally — no polling.
    const warmupStartedAt = Date.now();
    await Promise.all(warmupJobs.map(job => job.waitUntilFinished(queueEvents)));
    const warmupElapsedMs = Date.now() - warmupStartedAt;

    // Warmup summary — wall clock / WARMUP_JOBS gives the per-slot cost since
    // all jobs ran in parallel. This is the resume/README per-job latency number.
    const perJobCostMs = warmupElapsedMs;   // all 6 ran simultaneously
    console.log(`✅  Warmup complete.`);
    console.log(`    ${WARMUP_JOBS} jobs finished in  : ${ms(warmupElapsedMs)}`);
    console.log(`    Per-job latency (zero queue wait) : ~${ms(perJobCostMs)}`);
    console.log(`    → This is your true isolated per-job cost\n`);

    // ── PHASE 2: MAIN BENCHMARK ──────────────────────────────────────────────
    // Per-job enqueue timestamps for true end-to-end latency
    // Key: BullMQ job ID → timestamp when job was added to Redis
    const jobEnqueuedAt = new Map<string, number>();

    let completed = 0;
    const e2eLatenciesMs:     number[] = [];   // enqueue → completed event (user-facing)
    const sandboxLatenciesMs: number[] = [];   // runner.py internal execution time

    const wallStart = Date.now();

    // ── Event listener registered BEFORE jobs are enqueued ──────────────────
    queueEvents.on('completed', ({ jobId, returnvalue }) => {
        // Ignore any stale warmup completions that fire after warmup phase ends
        if (!jobEnqueuedAt.has(jobId)) return;

        const completedAt = Date.now();
        completed++;

        // True end-to-end latency: Redis enqueue → result ready
        const enqueuedAt = jobEnqueuedAt.get(jobId)!;
        e2eLatenciesMs.push(completedAt - enqueuedAt);
        jobEnqueuedAt.delete(jobId);

        // Sandbox-internal execution time from runner.py (seconds → ms)
        let result: any = returnvalue;
        if (typeof returnvalue === 'string') {
            try { result = JSON.parse(returnvalue); } catch { result = {}; }
        }
        if (result?.totalTime) {
            sandboxLatenciesMs.push(result.totalTime * 1000);
        }

        process.stdout.write(
            `\rProgress: [${String(completed).padStart(2)}/${TOTAL_JOBS}]` +
            `  |  E2E: ${ms(e2eLatenciesMs[e2eLatenciesMs.length - 1] ?? 0).padEnd(8)}`
        );

        if (completed === TOTAL_JOBS) printResults();
    });

    // ── Enqueue all main jobs ────────────────────────────────────────────────
    console.log(`Queuing ${TOTAL_JOBS} AC jobs (${TOTAL_JOBS / 2} C++ / ${TOTAL_JOBS / 2} Python)...\n`);

    for (let i = 0; i < TOTAL_JOBS; i++) {
        const payload = payloads[i % payloads.length]!;
        const job = await judgeQueue.add('ac-benchmark', {
            jobType:    'submit',
            questionId: 101,
            language:   payload.lang,
            code:       payload.code,
            userId:     `benchmarker-${i}`,
        });

        if (job.id) {
            // Record AFTER add() resolves — job is now visible in Redis.
            // Closest proxy for "user hit submit".
            jobEnqueuedAt.set(job.id, Date.now());
        }
    }

    console.log('All jobs queued. Waiting for workers...\n');

    // ── Results printer ──────────────────────────────────────────────────────
    function printResults() {
        const wallClockSec = (Date.now() - wallStart) / 1000;
        const tps = TOTAL_JOBS / wallClockSec;

        // Sort once for all percentile calculations
        const sortedE2E     = [...e2eLatenciesMs].sort((a, b) => a - b);
        const sortedSandbox = [...sandboxLatenciesMs].sort((a, b) => a - b);

        const avgE2E = sortedE2E.reduce((a, b) => a + b, 0) / (sortedE2E.length || 1);
        const avgSbx = sortedSandbox.reduce((a, b) => a + b, 0) / (sortedSandbox.length || 1);

        console.log('\n\n══════════════════════════════════════════════');
        console.log('  ⚙️   WARMUP RESULT  (zero queue-wait baseline)');
        console.log('══════════════════════════════════════════════');
        console.log(`  Per-job latency    : ~${ms(perJobCostMs)}  ← use this on resume`);

        console.log('\n══════════════════════════════════════════════');
        console.log('  📊  AC THROUGHPUT BENCHMARK  (60-job burst)');
        console.log('══════════════════════════════════════════════');
        console.log(`  Total Jobs         : ${TOTAL_JOBS} (${TOTAL_JOBS / 2} C++ / ${TOTAL_JOBS / 2} Python)`);
        console.log(`  Concurrency        : 6 workers`);
        console.log(`  Wall-Clock Time    : ${wallClockSec.toFixed(2)}s`);
        console.log(`  Throughput (TPS)   : ${tps.toFixed(2)} jobs/sec`);

        console.log('\n  ⏱   END-TO-END LATENCY  (enqueue → result ready)');
        console.log('  ─────────────────────────────────────────────');
        console.log(`  Average            : ${ms(avgE2E)}`);
        console.log(`  P50 (median)       : ${ms(percentile(sortedE2E, 50))}`);
        console.log(`  P95                : ${ms(percentile(sortedE2E, 95))}`);
        console.log(`  P99                : ${ms(percentile(sortedE2E, 99))}`);
        console.log(`  Best               : ${ms(sortedE2E[0] ?? 0)}`);
        console.log(`  Worst              : ${ms(sortedE2E[sortedE2E.length - 1] ?? 0)}`);

        if (sortedSandbox.length > 0) {
            console.log('\n  🐳  SANDBOX EXECUTION TIME  (runner.py internal)');
            console.log('  ─────────────────────────────────────────────');
            console.log(`  Average            : ${ms(avgSbx)}`);
            console.log(`  P50                : ${ms(percentile(sortedSandbox, 50))}`);
            console.log(`  P95                : ${ms(percentile(sortedSandbox, 95))}`);
            console.log(`  Docker overhead    : ~${ms(perJobCostMs - avgSbx)}  (warmup E2E minus sandbox avg)`);
        }

        console.log('\n══════════════════════════════════════════════\n');

        process.exit(0);
    }
};

runACBenchmark().catch(console.error);