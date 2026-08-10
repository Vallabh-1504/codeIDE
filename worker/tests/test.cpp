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
}
