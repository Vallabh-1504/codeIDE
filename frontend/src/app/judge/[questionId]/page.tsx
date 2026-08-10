import JudgeWorkspace from '@/components/JudgeWorkspaceWrapper';

export default async function JudgePage({ params }: { params: Promise<{ questionId: string }> }) {
    const { questionId } = await params;
    return (
        <main>
            <JudgeWorkspace questionId={Number(questionId)} />
        </main>
    );
}
