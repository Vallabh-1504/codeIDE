import sys
import json
import subprocess
import time
import os
from typing import Dict, List, Tuple, Any

# Constants
DIR_PATH = "/app"
TESTCASES_FILE = f"{DIR_PATH}/testcases.json"
RESULTS_FILE = f"{DIR_PATH}/results.json"
TIME_LIMIT = 5.0  # 5 seconds per testcase

class SandboxEvaluator:
    @staticmethod
    def compare_outputs(expected: str, actual: str) -> bool:
        """
        Performs strict string matching. 
        Strips trailing whitespaces from each line to handle minor formatting differences 
        """
        expected_lines = [line.rstrip() for line in expected.strip().splitlines()]
        actual_lines = [line.rstrip() for line in actual.strip().splitlines()]
        
        return expected_lines == actual_lines
    
class ExecutionEngine:
    def __init__(self):
        self.language = self._detect_language()
        self.executable = ""

    def _detect_language(self) -> str:
        if os.path.exists(f"{DIR_PATH}/main.cpp"):
            return "cpp"
        elif os.path.exists(f"{DIR_PATH}/main.py"):
            return "python"
        else:
            raise FileNotFoundError("No source code found in sandbox.")
        
    def compile(self) -> Tuple[bool, str]:
        """Compiles the code if necessary. Returns (Success, ErrorMsg)."""
        if self.language == "cpp":
            self.executable = f"{DIR_PATH}/solution"
            cmd = ["g++", "-O2", f"{DIR_PATH}/main.cpp", "-o", self.executable]
            
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=10.0)
                if result.returncode != 0:
                    return False, result.stderr
                return True, ""
            except subprocess.TimeoutExpired:
                return False, "Compilation Time Limit Exceeded"
        
        elif self.language == "python":
            self.executable = ["python3", f"{DIR_PATH}/main.py"]
            return True, ""
            
        return False, "Unsupported language"
    
    def run_testcase(self, input_data: str) -> Tuple[str, str, float]:
        """Runs a single test case. Returns (Status, Output/Error, ExecutionTime)."""
        start_time = time.time()
        
        cmd = [self.executable] if isinstance(self.executable, str) else self.executable
        
        try:
            process = subprocess.run(
                cmd,
                input=input_data,
                capture_output=True,
                text=True,
                timeout=TIME_LIMIT
            )
            exec_time = time.time() - start_time
            
            if process.returncode != 0:
                return "RE", process.stderr, exec_time
                
            return "OK", process.stdout, exec_time
            
        except subprocess.TimeoutExpired:
            return "TLE", "Time Limit Exceeded", TIME_LIMIT


class JudgeOrchestrator:
    def __init__(self):
        self.engine = ExecutionEngine()
        self.results = {
            "status": "Internal Error",
            "totalTime": 0.0,
            "totalMemory": 0,
            "passedCases": 0,
            "totalCases": 0,
            "verdicts": []
        }

    def write_results(self):
        with open(RESULTS_FILE, 'w') as f:
            json.dump(self.results, f)

    def fail_submission(self, status: str, error_details: str):
        self.results["status"] = status
        self.results["verdicts"].append({
            "status": status,
            "time": 0,
            "errorDetails": error_details
        })
        self.write_results()

    def execute(self):
        # 1. Compile
        success, err = self.engine.compile()
        if not success:
            self.fail_submission("Compile Error", err)
            return

        # 2. Load Testcases
        try:
            with open(TESTCASES_FILE, 'r') as f:
                testcases = json.load(f)
        except Exception as e:
            self.fail_submission("Internal Error", f"Failed to load test cases: {str(e)}")
            return

        self.results["totalCases"] = len(testcases)
        overall_status = "Accepted"
        
        # 3. Execution Loop
        for tc in testcases:
            tc_input = tc.get("input", "")
            tc_expected = tc.get("expectedOutput", "")
            is_hidden = tc.get("isHidden", True)

            # Run the binary
            status, output, exec_time = self.engine.run_testcase(tc_input)
            self.results["totalTime"] += exec_time

            verdict_obj = {
                "status": "",
                "time": round(exec_time, 3)
            }

            if status == "TLE":
                verdict_obj["status"] = "TLE"
                overall_status = "Time Limit Exceeded"
            elif status == "RE":
                verdict_obj["status"] = "RE"
                verdict_obj["errorDetails"] = output
                overall_status = "Runtime Error"
            else:
                # Execution succeeded, verify output
                if SandboxEvaluator.compare_outputs(tc_expected, output):
                    verdict_obj["status"] = "AC"
                    self.results["passedCases"] += 1
                else:
                    verdict_obj["status"] = "WA"
                    overall_status = "Wrong Answer"
                    
                    # Only leak expected/actual outputs if it's a sample test case
                    if not is_hidden:
                        verdict_obj["expectedOutput"] = tc_expected
                        verdict_obj["actualOutput"] = output

            self.results["verdicts"].append(verdict_obj)

            # Fail fast on the first hidden test case failure to save compute
            if verdict_obj["status"] != "AC" and is_hidden:
                break

        self.results["status"] = overall_status
        self.write_results()

if __name__ == "__main__":
    orchestrator = JudgeOrchestrator()
    try:
        orchestrator.execute()
    except Exception as e:
        orchestrator.fail_submission("Internal Error", str(e))