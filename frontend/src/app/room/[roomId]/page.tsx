import CodeEditor from '@/components/CodeEditorWrapper';

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = await params;
    return (
        <main>
            <CodeEditor roomId={roomId} /> 
        </main>
    );
}