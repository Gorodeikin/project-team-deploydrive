'use client';

import { useEffect, useRef, useState } from 'react';
import css from './TravellerPage.module.css';
import { TravellerClientProps } from '@/types/traveller';
import type { User } from '@/types/user';
import TravellerInfo from '../TravellerInfo/TravellerInfo';
import MessageNoStories from '../MessageNoStories/MessageNoStories';
import TravellersStories, {
  FetchResult,
} from '../TravellersStories/TravellersStories';
import axios from 'axios';
import { mapStory, Story } from '@/types/story';
import { useAuthStore } from '@/lib/store/authStore';
import { apiClient } from '@/lib/api/apiClient';

type ProfileTab = 'saved' | 'my';
type SavedStatus = 'idle' | 'loading' | 'success' | 'error';

const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
  { id: 'saved', label: 'Збережені історії' },
  { id: 'my', label: 'Мої історії' },
];

const SAVED_EMPTY_TEXT =
  'У вас ще немає збережених історій, мерщій збережіть вашу першу історію!';

function getResponsiveSavedLimit() {
  if (typeof window === 'undefined') return 9;
  if (window.innerWidth < 768) return 4;
  if (window.innerWidth < 1440) return 6;
  return 9;
}

export default function TravellerPageClient({
  travellerId,
  initialTraveller,
  initialStories,
  initialHasNextPage,
}: TravellerClientProps) {
  const [displayedTraveller, setDisplayedTraveller] =
    useState(initialTraveller);
  const { user, isAuthenticated, isAuthReady, setUser } = useAuthStore();

  const canEditProfile =
    isAuthReady && isAuthenticated && user?._id === travellerId;

  const [activeTab, setActiveTab] = useState<ProfileTab>('saved');
  const [savedStories, setSavedStories] = useState<Story[]>([]);
  const [savedHasMore, setSavedHasMore] = useState(false);
  const [savedStatus, setSavedStatus] = useState<SavedStatus>('idle');
  const [resyncStatus, setResyncStatus] = useState<'idle' | 'error'>('idle');
  const [savedResyncKey, setSavedResyncKey] = useState(0);
  const savedFirstLoadDoneRef = useRef(false);
  const savedFetchSeqRef = useRef(0);

  // Single entry point for every page-1 saved-stories fetch (initial load,
  // explicit retry, and post-unsave resync) so a stale response from an
  // older in-flight request can never overwrite a newer one.
  const fetchSavedPageOne = async (opts: { background: boolean }) => {
    const seq = ++savedFetchSeqRef.current;
    if (!opts.background) {
      setSavedStatus('loading');
    }
    const limit = getResponsiveSavedLimit();

    try {
      const res = await apiClient.get('/users/me/saved', {
        params: { page: 1, perPage: limit },
      });
      if (seq !== savedFetchSeqRef.current) return;

      const payload = res.data?.data;
      const mapped: Story[] = (payload?.data ?? []).map(mapStory);

      setSavedStories(mapped);
      setSavedHasMore(!!payload?.hasNextPage);
      setSavedStatus('success');
      setResyncStatus('idle');
      setSavedResyncKey(k => k + 1);
      savedFirstLoadDoneRef.current = true;
    } catch (error) {
      if (seq !== savedFetchSeqRef.current) return;
      console.error('Failed to load saved stories:', error);
      if (opts.background) {
        setResyncStatus('error');
      } else {
        setSavedStatus('error');
      }
    }
  };

  useEffect(() => {
    if (!isAuthReady || !canEditProfile || activeTab !== 'saved') return;
    if (savedFirstLoadDoneRef.current) return;
    (async () => {
      await fetchSavedPageOne({ background: false });
    })();
  }, [isAuthReady, canEditProfile, activeTab]);

  const handleRetrySaved = () => {
    fetchSavedPageOne({ background: false });
  };

  const handleStoryUnsave = () => {
    fetchSavedPageOne({ background: true });
  };

  const handleAvatarUpdated = (updatedUser: User) => {
    setDisplayedTraveller(prev => ({
      ...prev,
      avatarUrl: updatedUser.avatarUrl ?? null,
    }));
    setUser(updatedUser);
  };

  const handleProfileUpdated = (updatedUser: User) => {
    setDisplayedTraveller(prev => ({
      ...prev,
      name: updatedUser.name,
      description: updatedUser.description ?? '',
    }));
    setUser(updatedUser);
  };

  const travellers = [displayedTraveller];

  const loadTravellerStories = async (
    page: number,
    limit: number
  ): Promise<FetchResult | null> => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${travellerId}`,
        { params: { page, perPage: limit } }
      );

      const storiesData = res.data.data.stories;

      return {
        data: storiesData.data.map(mapStory),
        hasNextPage: storiesData.hasNextPage,
      };
    } catch (error) {
      console.error('Failed to load traveller stories:', error);
      return null;
    }
  };

  const loadSavedStories = async (
    page: number,
    limit: number
  ): Promise<FetchResult | null> => {
    try {
      const res = await apiClient.get('/users/me/saved', {
        params: { page, perPage: limit },
      });

      const payload = res.data?.data;

      return {
        data: (payload?.data ?? []).map(mapStory),
        hasNextPage: !!payload?.hasNextPage,
      };
    } catch (error) {
      console.error('Failed to load saved stories:', error);
      return null;
    }
  };

  const savedEmptyBlock = (
    <div className={css.savedEmptyBlock}>
      <p className={css.savedEmptyText}>{SAVED_EMPTY_TEXT}</p>
    </div>
  );

  return (
    <>
      <TravellerInfo
        traveller={{
          name: displayedTraveller.name,
          photo: displayedTraveller.avatarUrl ?? '/images/avatar.webp.webp',
          info: displayedTraveller.description,
        }}
        travellerId={travellerId}
        canEditProfile={canEditProfile}
        onAvatarUpdated={handleAvatarUpdated}
        onProfileUpdated={handleProfileUpdated}
      />

      <div className={css.container}>
        {canEditProfile ? (
          <>
            <div
              className={css.tablist}
              role="tablist"
              aria-label="Історії профілю"
            >
              {PROFILE_TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  id={`traveller-tab-${tab.id}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`traveller-panel-${tab.id}`}
                  className={`${css.tab} ${
                    activeTab === tab.id ? css.tabActive : ''
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              id="traveller-panel-saved"
              role="tabpanel"
              aria-labelledby="traveller-tab-saved"
              hidden={activeTab !== 'saved'}
            >
              {(savedStatus === 'idle' || savedStatus === 'loading') && (
                <p className={css.savedStatusText}>
                  Завантаження збережених історій...
                </p>
              )}

              {(savedStatus === 'error' ||
                (savedStatus === 'success' && resyncStatus === 'error')) && (
                <div className={css.savedErrorBlock}>
                  <p className={css.savedStatusText}>
                    Не вдалося завантажити збережені історії
                  </p>
                  <button
                    type="button"
                    className={css.savedRetryButton}
                    onClick={handleRetrySaved}
                  >
                    Спробувати ще
                  </button>
                </div>
              )}

              {savedStatus === 'success' && resyncStatus === 'idle' && (
                <TravellersStories
                  key={`saved-${savedResyncKey}`}
                  initialStories={savedStories}
                  initialHasMore={savedHasMore}
                  travellers={travellers}
                  fetchNextPage={loadSavedStories}
                  onStoryUnsave={handleStoryUnsave}
                  emptyState={savedEmptyBlock}
                />
              )}
            </div>

            <div
              id="traveller-panel-my"
              role="tabpanel"
              aria-labelledby="traveller-tab-my"
              hidden={activeTab !== 'my'}
            >
              {initialStories.length > 0 ? (
                <TravellersStories
                  initialStories={initialStories}
                  initialHasMore={initialHasNextPage}
                  travellers={travellers}
                  fetchNextPage={loadTravellerStories}
                />
              ) : (
                <MessageNoStories
                  text="У вас ще немає опублікованих історій"
                  buttonText="Назад до історій"
                  route="/stories"
                />
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className={css.title}>Історії Мандрівника</h2>

            {initialStories.length > 0 ? (
              <TravellersStories
                initialStories={initialStories}
                initialHasMore={initialHasNextPage}
                travellers={travellers}
                fetchNextPage={loadTravellerStories}
              />
            ) : (
              <MessageNoStories
                text="Цей користувач ще не публікував історій"
                buttonText="Назад до історій"
                route="/stories"
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
