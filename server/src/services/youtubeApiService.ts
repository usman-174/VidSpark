import { checkQuota, consumeQuota } from '../utils/quotaManager';
import { initializeDependencies } from '../utils/dependencies';
import { loadKeysFromDB, getNextApiKey } from '../scripts/YTscraper';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const fetchSearchResults = async (query: string) => {
  try {
    const { axios } = await initializeDependencies();
    
    checkQuota(100);
    await loadKeysFromDB(); // load from DB first
    const apiKey = getNextApiKey(); // rotate and get a valid key

    const { data } = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: 5,
        key: apiKey, // ⬅️ dynamically passed here
      }
    });

    consumeQuota(100);

    return data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
    }));
  } catch (error: any) {
    console.error('YouTube API error:', error.response?.data || error.message);
    throw error;
  }
};
