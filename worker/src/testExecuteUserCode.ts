import { executeUserCode } from "./executeUserCode";

const testCode = `
#include <iostream>
int main(){
    std::cout << "Hello from docker code execution enginer. Engine is running." << std::endl;
}
`;

async function testExecuteUserCode(){
    try{
        const result = await executeUserCode("test-job-01", testCode);
        console.log(result.success);
        console.log(result.output);
        console.log(result!.error);
    }
    catch(err){
        console.error(err);
    }
};

testExecuteUserCode();