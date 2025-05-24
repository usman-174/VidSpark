let usedQuota = 0;

export const checkQuota = (cost: number) => {
  if (usedQuota + cost > 10000) throw new Error('YouTube API quota exceeded');
};

export const consumeQuota = (cost: number) => {
  usedQuota += cost;
};
