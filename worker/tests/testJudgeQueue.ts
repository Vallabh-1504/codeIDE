import { Queue, QueueEvents } from 'bullmq';
import { ENV } from '../src/config/env'; 
import { redisConnection } from '../src/config/redis';
import { JudgeJobData } from '../src/types';

// Ensure this matches your worker's environment configuration
const QUEUE_NAME = ENV.JUDGE_QUEUE_NAME || 'judge-execution-queue';

const validCppOptimizedCode = `
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
}`;

const validCppNaiveCode = `
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int T;
    cin >> T;

    while (T--) {
        int N, K;
        cin >> N >> K;

        vector<int> nums(N);

        for (int i = 0; i < N; i++) {
            cin >> nums[i];
        }

        int count = 0;

        // Check every possible subarray
        for (int start = 0; start < N; start++) {
            for (int end = start; end < N; end++) {

                int sum = 0;

                // Compute sum of nums[start...end]
                for (int i = start; i <= end; i++) {
                    sum += nums[i];
                }

                if (sum == K) {
                    count++;
                }
            }
        }

        cout << count << endl;
    }

    return 0;
}`;

const runTest = async () => {
    console.log(`[Test] Connecting to Queue: ${QUEUE_NAME}`);

    // 1. Initialize the Producer (to add jobs)
    const judgeQueue = new Queue(QUEUE_NAME, { connection: redisConnection as any });

    // 2. Initialize the Listener (to get results)
    const queueEvents = new QueueEvents(QUEUE_NAME, { connection: redisConnection as any });

    const payload: JudgeJobData = {
        jobType: 'submit',
        questionId: 101, // Assumes this ID exists in your seeded MongoDB
        language: 'cpp',
        // code: validCppNaiveCode,
        code: validCppOptimizedCode,
        userId: 'tester-001'
    };

    console.log("[Test] Pushing job to Queue...");
    const job = await judgeQueue.add('test-submission', payload);
    console.log(`[Test] Job added with ID: ${job.id}. Waiting for worker...`);

    // 3. Listen for the exact result
    // BullMQ passes the data returned by your worker inside the 'returnvalue' property
    queueEvents.on('completed', ({ jobId, returnvalue }) => {
        if (jobId === job.id) {
            console.log("\n✅ Job Completed Successfully!");
            console.log("Result JSON from Sandbox:\n", JSON.stringify(returnvalue, null, 2));
            
            // Cleanly exit the test script
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

runTest().catch((error) => {
    console.error("[Test] Fatal Setup Error:", error);
    process.exit(1);
});