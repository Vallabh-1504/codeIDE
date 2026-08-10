import { Queue, QueueEvents } from 'bullmq';
import { ENV } from '../src/config/env';
import { redisConnection } from '../src/config/redis';

const QUEUE_NAME = ENV.JUDGE_QUEUE_NAME || 'judge-execution-queue';
const TOTAL_JOBS = 50;

const cppOptimizedCode = `
#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

void solve() {
    int n, k;
    if (!(cin >> n >> k)) return;
    
    vector<int> nums(n);
    for (int i = 0; i < n; ++i) {
        cin >> nums[i];
    }
    
    unordered_map<long long, int> prefixCounts;
    prefixCounts[0] = 1;
    long long currentSum = 0;
    long long count = 0;
    
    for (int num : nums) {
        currentSum += num;
        if (prefixCounts.find(currentSum - k) != prefixCounts.end()) {
            count += prefixCounts[currentSum - k];
        }
        prefixCounts[currentSum]++;
    }
    
    cout << count << "\\n";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int t;
    if (cin >> t) {
        while (t--) {
            solve();
        }
    }
    return 0;
}
`;

const pythonOptimizedCode = `
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

const cppSegfaultCode = `
#include <iostream>
using namespace std;
int main() {
    int* ptr = nullptr;
    *ptr = 100; // Will trigger SIGSEGV
    return 0;
}
`;

const cppInfiniteLoopCode = `
#include <iostream>
using namespace std;
int main() {
    while(true) {} // Should be killed at exactly 5.0s
    return 0;
}
`;

const pythonMemoryLeakCode = `
# Attempts to allocate massive arrays until the container's 512MB limit is breached
arr = []
while True:
    arr.append(' ' * 10**6)
`;




// Assume the code strings from Step 1 are stored in these variables
const payloads = [
    { type: 'Optimized C++', lang: 'cpp', code: cppOptimizedCode },
    { type: 'Optimized Python', lang: 'python', code: pythonOptimizedCode },
    { type: 'Segfault C++', lang: 'cpp', code: cppSegfaultCode },
    { type: 'Infinite Loop C++', lang: 'cpp', code: cppInfiniteLoopCode },
    { type: 'Memory Leak Python', lang: 'python', code: pythonMemoryLeakCode }
];

const runChaosBenchmark = async () => {
    const judgeQueue = new Queue(QUEUE_NAME, { connection: redisConnection as any });
    const queueEvents = new QueueEvents(QUEUE_NAME, { connection: redisConnection as any });

    console.log(`Initiating Chaos Benchmark: ${TOTAL_JOBS} concurrent submissions...`);
    
    let completed = 0;
    const stats = { AC: 0, TLE: 0, RE: 0, InternalError: 0 };
    const latencies: number[] = [];
    
    const startTime = Date.now();

    queueEvents.on('completed', ({ jobId, returnvalue }) => {
        completed++;

        // returnvalue can be a string or an object depending on how the worker stored it.
        let result: any = returnvalue;
        if (typeof returnvalue === 'string') {
            try {
                result = JSON.parse(returnvalue);
            } catch (err) {
                // fallback: keep as string
                result = { status: returnvalue };
            }
        }

        latencies.push((result && result.totalTime) || 0);

        // Track the exact verdicts
        const status = (result && result.status) || '';
        if (status === 'Accepted') stats.AC++;
        else if (status === 'Time Limit Exceeded') stats.TLE++;
        else if (status === 'Runtime Error') stats.RE++;
        else stats.InternalError++;

        process.stdout.write(`\rProgress: [${completed}/${TOTAL_JOBS}] | Latest Verdict: ${status.padEnd(20)}`);

        if (completed === TOTAL_JOBS) {
            const wallClockTime = (Date.now() - startTime) / 1000;
            const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
            const tps = TOTAL_JOBS / wallClockTime;

            console.log('\n\n📊 --- BENCHMARK RESULTS ---');
            console.log(`Total Wall-Clock Time : ${wallClockTime.toFixed(2)} seconds`);
            console.log(`Throughput (TPS)      : ${tps.toFixed(2)} jobs/sec`);
            console.log(`Average Job Latency   : ${avgLatency.toFixed(3)} seconds`);
            console.log(`\n🛡️ --- RESILIENCE BREAKDOWN ---`);
            console.log(`Valid Executions (AC) : ${stats.AC}`);
            console.log(`Caught TLEs           : ${stats.TLE}`);
            console.log(`Caught Segfaults/REs  : ${stats.RE}`);
            console.log(`System Crashes        : ${stats.InternalError} (Target is 0)`);
            
            process.exit(0);
        }
    });

    // Fire all jobs into Redis asynchronously
    for (let i = 0; i < TOTAL_JOBS; i++) {
        // Ensure we never pick an undefined payload (fallback to first payload)
        const randomPayload = payloads[Math.floor(Math.random() * payloads.length)]!;

        await judgeQueue.add('chaos-job', {
            jobType: 'submit',
            questionId: 101, // The heavy LCS question
            language: randomPayload.lang,
            code: randomPayload.code,
            userId: `benchmarker-${i}`
        });
    }
};

runChaosBenchmark().catch(console.error);