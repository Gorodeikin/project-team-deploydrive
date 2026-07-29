import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api/config';
import TravellersStoriesItem from '@/components/TravellersStoriesItem/TravellersStoriesItem';
import StorySavePanel from '@/components/StorySavePanel/StorySavePanel';
import type { Story } from '@/types/story';
import styles from './StoryPage.module.css';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ storyId: string }>;
};

interface ApiStoryDetail {
  _id: string;
  img: string;
  title: string;
  article: string;
  category: string;
  categoryName?: string;
  ownerId: string;
  date: string;
  favoriteCount?: number;
}

interface ApiPopularStory {
  _id: string;
  img: string;
  title: string;
  article: string;
  category: string;
  ownerId: string;
  date: string;
  favoriteCount?: number;
}

async function fetchStory(storyId: string): Promise<ApiStoryDetail> {
  const res = await fetch(
    `${API_BASE_URL}/stories/${encodeURIComponent(storyId)}`,
    { cache: 'no-store' }
  );

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    throw new Error('Unable to load story');
  }

  const json = await res.json();
  return json.data;
}

async function fetchAuthorName(ownerId: string): Promise<string> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/users/${encodeURIComponent(ownerId)}?page=1&perPage=1`,
      { cache: 'no-store' }
    );

    if (!res.ok) return 'Невідомий автор';

    const json = await res.json();
    return json?.data?.user?.name || 'Невідомий автор';
  } catch {
    return 'Невідомий автор';
  }
}

function toStoryCardData(apiStory: ApiPopularStory): Story {
  return {
    _id: apiStory._id,
    img: apiStory.img,
    title: apiStory.title,
    article: apiStory.article,
    category: apiStory.category,
    ownerId: apiStory.ownerId,
    date: apiStory.date,
    favoriteCount: apiStory.favoriteCount,
    description:
      apiStory.article.length > 200
        ? apiStory.article.slice(0, 200) + '...'
        : apiStory.article,
    author: 'Автор',
    readTime: 1,
    avatar: '/images/avatar.webp.webp',
  };
}

async function fetchPopularStories(): Promise<Story[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/stories/popular?page=1&perPage=3`,
      { cache: 'no-store' }
    );

    if (!res.ok) return [];

    const json = await res.json();
    const stories: ApiPopularStory[] = json?.data?.stories || [];

    return stories.slice(0, 3).map(toStoryCardData);
  } catch (error) {
    console.error(
      'Failed to load popular stories for story detail page:',
      error
    );
    return [];
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export default async function StoryDetailPage({ params }: PageProps) {
  const { storyId } = await params;

  const story = await fetchStory(storyId);
  const [authorName, popularStories] = await Promise.all([
    fetchAuthorName(story.ownerId),
    fetchPopularStories(),
  ]);

  return (
    <article className={styles.page}>
      <div className={`container ${styles.container}`}>
        <h1 className={styles.title}>{story.title}</h1>

        <div className={styles.metadata}>
          <div className={styles.metaGroup}>
            <span className={styles.metaLabel}>Автор статті</span>
            <Link
              href={`/travellers/${story.ownerId}`}
              className={styles.metaValue}
            >
              {authorName}
            </Link>
          </div>

          <div className={styles.metaGroup}>
            <span className={styles.metaLabel}>Опубліковано</span>
            <time dateTime={story.date} className={styles.metaValue}>
              {formatDate(story.date)}
            </time>
          </div>

          <span className={styles.categoryBadge}>
            {story.categoryName || 'Категорія'}
          </span>
        </div>

        <div className={styles.heroWrapper}>
          <Image
            src={story.img}
            alt={story.title}
            fill
            sizes="(min-width: 1440px) 1312px, 100vw"
            priority
            className={styles.heroImage}
          />
        </div>

        <div className={styles.contentRow}>
          <section className={styles.articleSection}>
            <p className={styles.articleText}>{story.article}</p>
          </section>

          <StorySavePanel storyId={story._id} ownerId={story.ownerId} />
        </div>
      </div>

      {popularStories.length > 0 && (
        <section className={styles.popularSection}>
          <div className="container">
            <h2 className={styles.popularTitle}>Популярні історії</h2>
            <ul className={styles.popularGrid}>
              {popularStories.map(popularStory => (
                <li key={popularStory._id} className={styles.popularItem}>
                  <TravellersStoriesItem story={popularStory} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}
