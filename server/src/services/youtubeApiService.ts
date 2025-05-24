import axios from 'axios';
import { checkQuota, consumeQuota } from '../utils/quotaManager';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const fetchSearchResults = async (query: string) => {
  checkQuota(100);
  const { data } = await axios.get(`${BASE_URL}/search`, {
    params: {
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: 5,
      key: YOUTUBE_API_KEY
    }
  });
  consumeQuota(100);
  return data.items.map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle
  }));
};