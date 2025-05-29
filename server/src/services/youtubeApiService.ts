import { checkQuota, consumeQuota } from '../utils/quotaManager';
import { initializeDependencies } from '../utils/dependencies';
import { loadKeysFromDB, getNextApiKey } from '../scripts/YTscraper';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const fetchSearchResults = async (query: string, withSearchVolume = false) => {
  try {
    const { axios } = await initializeDependencies();

    checkQuota(100);
    await loadKeysFromDB();
    const apiKey = getNextApiKey();

    // Step 1: Initial video search
    const { data: searchData } = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: 5,
        key: apiKey,
      }
    });

    consumeQuota(100);

    const items = searchData.items || [];

    const uniqueChannels = new Map<string, string>(); // channelId => channelTitle

    const results = items.map((item: any) => {
      const channelId = item.snippet.channelId;
      const channelTitle = item.snippet.channelTitle;
      const videoId = item.id.videoId;
      uniqueChannels.set(channelId, channelTitle);

      return {
        videoId,
        title: item.snippet.title,
        channelId,
        channelTitle,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,  // Added video URL here
      };
    });

    const videoIds = items.map((item: any) => item.id.videoId).join(',');

    // Step 2: Fetch video statistics
    const { data: videoStatsData } = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'statistics',
        id: videoIds,
        key: apiKey,
      },
    });

    const videoStatsMap = new Map();
    for (const video of videoStatsData.items || []) {
      videoStatsMap.set(video.id, {
        viewCount: Number(video.statistics.viewCount) || 0,
      });
    }

    // Step 3: Batch fetch channel statistics
    const { data: channelStatsData } = await axios.get(`${BASE_URL}/channels`, {
      params: {
        part: 'statistics',
        id: Array.from(uniqueChannels.keys()).join(','),
        key: apiKey,
      }
    });

    const channelStatsMap = new Map();
    for (const channel of channelStatsData.items || []) {
      channelStatsMap.set(channel.id, {
        viewCount: Number(channel.statistics.viewCount) || 0,
        subscriberCount: Number(channel.statistics.subscriberCount) || 0,
        videoCount: Number(channel.statistics.videoCount) || 0,
      });
    }

    // Step 4: Optional — estimate search volume per channel
    const searchVolumeMap = new Map<string, number>();
    if (withSearchVolume) {
      for (const [channelId, channelTitle] of uniqueChannels.entries()) {
        const { data: channelSearchData } = await axios.get(`${BASE_URL}/search`, {
          params: {
            part: 'snippet',
            q: channelTitle,
            type: 'video',
            maxResults: 25,
            key: apiKey,
          }
        });

        searchVolumeMap.set(channelId, channelSearchData.items?.length || 0);
      }
    }

    // Step 5: Combine all results
    return results.map((video) => ({
      ...video,
      viewCount: videoStatsMap.get(video.videoId)?.viewCount || 0,
      channelStats: channelStatsMap.get(video.channelId) || {},
      estimatedSearchVolume: withSearchVolume ? searchVolumeMap.get(video.channelId) || 0 : undefined,
    }));
  } catch (error: any) {
    console.error('YouTube API error:', error.response?.data || error.message);
    throw error;
  }
};
