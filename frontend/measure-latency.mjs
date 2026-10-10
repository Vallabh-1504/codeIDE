import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import WebSocket from 'ws';
import { performance } from 'perf_hooks';

const YJS_URL = 'ws://localhost:1234';
const ROOM_NAME = 'latency-test-room';

async function measure() {
    console.log('Connecting to Yjs server...');
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();
    
    const provider1 = new WebsocketProvider(YJS_URL, ROOM_NAME, doc1, { WebSocketPolyfill: WebSocket });
    const provider2 = new WebsocketProvider(YJS_URL, ROOM_NAME, doc2, { WebSocketPolyfill: WebSocket });
    
    const array1 = doc1.getArray('test');
    const array2 = doc2.getArray('test');
    
    await new Promise(resolve => {
        let connected = 0;
        const check = () => {
            connected++;
            if(connected === 2) resolve();
        };
        provider1.on('status', event => { if (event.status === 'connected') check(); });
        provider2.on('status', event => { if (event.status === 'connected') check(); });
    });
    
    console.log('Both clients connected. Starting measurement...');
    
    const latencies = [];
    const NUM_ITERATIONS = 100;
    
    return new Promise(resolve => {
        let currentIteration = 0;
        let startTime;
        
        array2.observe(event => {
            const endTime = performance.now();
            const latency = endTime - startTime;
            latencies.push(latency);
            
            if (currentIteration < NUM_ITERATIONS) {
                // Short delay between iterations to avoid batching effects on localhost
                setTimeout(runNext, 10);
            } else {
                finish();
                resolve();
            }
        });
        
        function runNext() {
            currentIteration++;
            startTime = performance.now();
            array1.insert(0, [currentIteration]);
        }
        
        function finish() {
            const avg = latencies.reduce((a,b) => a+b, 0) / latencies.length;
            const sorted = [...latencies].sort((a,b) => a-b);
            const p95 = sorted[Math.floor(sorted.length * 0.95)];
            const min = sorted[0];
            const max = sorted[sorted.length - 1];
            
            console.log(`\n=== Latency Stats over ${NUM_ITERATIONS} iterations ===`);
            console.log(`Average: ${avg.toFixed(2)} ms`);
            console.log(`p95:     ${p95.toFixed(2)} ms`);
            console.log(`Min:     ${min.toFixed(2)} ms`);
            console.log(`Max:     ${max.toFixed(2)} ms`);
            
            provider1.disconnect();
            provider2.disconnect();
        }
        
        // Start the first iteration after a brief pause
        setTimeout(runNext, 500);
    });
}

measure().then(() => {
    console.log('\nMeasurement complete.');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
