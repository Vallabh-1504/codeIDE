import { Language } from "@/types/playground";

export const JUDGE_TEMPLATES: Record<Language, string> = {
    cpp: `#include <iostream>
using namespace std;

int main() {
    // read input with cin, print your answer with cout
    return 0;
}
`,
    python: `# read input with input(), print your answer with print()
`,
};
