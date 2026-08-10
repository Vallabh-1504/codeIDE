import { Language } from "@/types/playground";

export const DEFAULT_TEMPLATES: Record<Language, string> = {
    cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
    python: `print("Hello, World!")
`,
};
