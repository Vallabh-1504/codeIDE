import { executeUserCode } from "./executeUserCode";


async function testExecuteUserCode1(){
    const testCode = `
        #include <iostream>
        int main(){
            std::cout << "Hello from docker code execution engine. Engine is running." << std::endl;
        }
    `;

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


async function testExecuteUserCode2(){
    const testCode = `
        #include <iostream>
        int main(){
            while(true){
                // infinite loop
            }
        }
    `;

    try{
        const result = await executeUserCode("test-job-02", testCode);
        console.log(result.success);
        console.log(result.output);
        console.log(result!.error);
    }
    catch(err){
        console.error(err);
    }
};


testExecuteUserCode1();
testExecuteUserCode2();
