### Problem Statement

Given an array of integers `nums` and an integer `k`, return the total number of continuous subarrays whose sum equals to `k`.

You must handle input and output via standard I/O.

### Input Format
* The first line contains an integer $T$, the number of test cases.
* For each test case:
  * The first line contains two integers $N$ (the size of the array) and $K$.
  * The second line contains $N$ space-separated integers representing the array elements.

### Output Format
* For each test case, print a single integer on a new line representing the number of valid subarrays.

### Constraints
* $1 \le T \le 10$
* $1 \le N \le 2 \times 10^4$
* $-1000 \le \text{nums}[i] \le 1000$
* $-10^7 \le K \le 10^7$

### Example

**Input:**
```text
2
3 2
1 1 1
3 3
1 2 3
```

**Output:**
```text
2
2
```