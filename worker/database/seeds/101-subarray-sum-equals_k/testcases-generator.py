import json
import random
import os

# 1. REFERENCE SOLUTION
def solve(n, k, nums):
    """100% correct O(N) solution to compute expected output."""
    count = 0
    prefix_sum = 0
    sum_counts = {0: 1}
    for num in nums:
        prefix_sum += num
        if (prefix_sum - k) in sum_counts:
            count += sum_counts[prefix_sum - k]
        sum_counts[prefix_sum] = sum_counts.get(prefix_sum, 0) + 1
    return count

# 2. HELPER: FORMATTING
def build_json_document(test_cases_data):
    """
    Takes a list of (n, k, nums) tuples and formats them into a single 
    JSON object exactly matching the UI/DB structure.
    T is constrained between 1 and 10[cite: 2].
    """
    t = len(test_cases_data)
    input_lines = [str(t)]
    output_lines = []

    for n, k, nums in test_cases_data:
        # Append input constraints
        input_lines.append(f"{n} {k}")
        input_lines.append(" ".join(map(str, nums)))
        
        # Compute and append output
        ans = solve(n, k, nums)
        output_lines.append(str(ans))

    return {
        "input": input_lines,
        "expectedOutput": output_lines
    }

# 3. TEST CASE GENERATORS
def generate_baseline_cases():
    """Type 1: Small random constraints to test basic logic correctness."""
    cases = []
    for _ in range(10): # T = 10[cite: 2]
        n = random.randint(10, 100)
        k = random.randint(-50, 50)
        nums = [random.randint(-100, 100) for _ in range(n)]
        cases.append((n, k, nums))
    return build_json_document(cases)


def generate_edge_cases():
    """Type 2: Extreme mathematical edges (zeros, impossible K, alternating)."""
    cases = []
    
    # Edge 1: All zeros with K=0 (massive number of valid subarrays)
    cases.append((1000, 0, [0] * 1000))
    
    # Edge 2: No match possible (positive numbers, massive negative K)[cite: 2]
    cases.append((1000, -10000000, [random.randint(1, 1000) for _ in range(1000)]))
    
    # Edge 3: Alternating signs targeting K=0
    alternating = [1, -1] * 500
    cases.append((1000, 0, alternating))
    
    # Edge 4: Minimum constraints N=1, Match[cite: 2]
    cases.append((1, 5, [5]))

    # Edge 5: Minimum constraints N=1, No Match[cite: 2]
    cases.append((1, 5, [10]))

    return build_json_document(cases)


def generate_stress_cases():
    """Type 3: Maximum constraints to trigger Time Limit Exceeded (TLE) on O(N^2) code."""
    cases = []
    for _ in range(3): # Lower T for massive arrays to stay within realistic execution times
        n = 20000 # Max N constraint[cite: 2]
        k = random.randint(-10000, 10000)
        nums = [random.randint(-1000, 1000) for _ in range(n)] # Max num constraints[cite: 2]
        cases.append((n, k, nums))
    return build_json_document(cases)


def generate_memory_pressure_cases():
    """Type 4: Highly distributed values to force maximum Hash Map growth (MLE)."""
    cases = []
    for _ in range(2):
        n = 20000 # Max N constraint[cite: 2]
        k = random.randint(-10000, 10000)
        # Create an array of widely distributed unique-ish numbers to avoid hash map collisions
        nums = [random.randint(1, 1000) * (1 if i % 2 == 0 else -1) for i in range(n)]
        cases.append((n, k, nums))
    return build_json_document(cases)

# 4. MAIN SEED COMPILER
def main():
    print("Generating hidden test cases...")
    
    # Compile all distinct case types into the final array
    hidden_cases = [
        generate_baseline_cases(),
        generate_edge_cases(),
        generate_stress_cases(),
        generate_memory_pressure_cases()
    ]
    
    # Get the absolute path for the output file, ensuring it's in the same directory as the script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, 'hidden-cases.json')

    # Output to the JSON file expected by the TypeScript seeder
    with open(output_path, 'w') as f:
        json.dump(hidden_cases, f, indent=4)
        
    print(f"Successfully generated {len(hidden_cases)} hidden evaluation blocks in '{output_path}'")

if __name__ == "__main__":
    main()