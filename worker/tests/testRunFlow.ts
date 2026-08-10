import { Queue, QueueEvents } from 'bullmq';
import { ENV } from '../src/config/env'; 
import { redisConnection } from '../src/config/redis';

const QUEUE_NAME = ENV.JUDGE_QUEUE_NAME || 'judge-execution-queue';

const testRunFlow = async () => {
    console.log(`[Test] Connecting to Queue: ${QUEUE_NAME} for RUN test`);

    const judgeQueue = new Queue(QUEUE_NAME, { connection: redisConnection as any});
    const queueEvents = new QueueEvents(QUEUE_NAME, { connection: redisConnection as any });

    // The standard O(N) C++ solution for Question 101
    const validCppCode = `
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
        if (prefixCounts.find(currentSum - k) != prefixCounts.end()) {
            count += prefixCounts[currentSum - k];
        }
        prefixCounts[currentSum]++;
    }
    cout << count << "\\n";
}
int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int t; if (cin >> t) { while (t--) solve(); }
    return 0;
}`;

    // Crucial difference: jobType is 'run'
    console.log("[Test] Pushing 'run' job to Queue...");
    const job = await judgeQueue.add('test-run', {
        jobType: 'run', 
        questionId: 101, 
        language: 'cpp',
        code: validCppCode,
        userId: 'tester-002'
    });
    
    console.log(`[Test] Job added with ID: ${job.id}. Waiting for worker...`);

    queueEvents.on('completed', ({ jobId, returnvalue }) => {
        if (jobId === job.id) {
            console.log("\n✅ 'Run' Job Completed Successfully!");
            console.log("Result JSON from Sandbox:\n", JSON.stringify(returnvalue, null, 2));
            
            // Verification Checks
            if (returnvalue.totalCases > 1) {
                console.warn("⚠️ WARNING: Fetched more than just the sample cases!");
            }
            if (returnvalue.verdicts[0] && !returnvalue.verdicts[0].expectedOutput) {
                console.warn("⚠️ WARNING: Sandbox did not return expected/actual outputs for the sample case!");
            }
            
            process.exit(0);
        }
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
        if (jobId === job.id) {
            console.error(`\n❌ Job ${jobId} Failed!`);
            console.error("Reason:", failedReason);
            process.exit(1);
        }
    });
};

testRunFlow().catch(console.error);