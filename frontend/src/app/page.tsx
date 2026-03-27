"use client";
import { useRouter } from "next/navigation";
import { randomid } from "ksort-id";

const Home = () =>{
	const router = useRouter();

	const createRoom = () => {
		const roomId = randomid(5); // unique id
		router.push(`/room/${roomId}`);
	};

	return (
		<div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
			<h1 className="text-4xl font-bold mb-8">CodeSync</h1>
			<button 
			onClick={createRoom}
			className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition"
			>
			Create New Room
			</button>
		</div>
	);
}

export default Home;