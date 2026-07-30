import type { Metadata } from 'next';
import StoryEditPage from '@/components/StoryEditPage/StoryEditPage';

export const metadata: Metadata = {
  title: 'Редагування історії | Подорожники',
};

type PageProps = {
  params: Promise<{
    storyId: string;
  }>;
};

export default async function EditStoryPage({ params }: PageProps) {
  const { storyId } = await params;

  return <StoryEditPage storyId={storyId} />;
}
