import { GoogleAdsApi, enums, services } from 'google-ads-api';

const client = new GoogleAdsApi({
  client_id: process.env.GADS_CLIENT_ID!,
  client_secret: process.env.GADS_CLIENT_SECRET!,
  developer_token: process.env.GADS_DEV_TOKEN!,
});

const customer = client.Customer({
  customer_id: process.env.GADS_CUSTOMER_ID!,
  refresh_token: process.env.GADS_REFRESH_TOKEN!,
});

export async function fetchKeywordMetrics(keyword: string) {
  try {
    const request = new services.GenerateKeywordIdeasRequest({
      customer_id: process.env.GADS_CUSTOMER_ID!,
      language: '1000', // English
      geo_target_constants: ['2840'], // United States
      keyword_seed: {
        keywords: [keyword],
      },
      include_adult_keywords: false,
      keyword_plan_network: enums.KeywordPlanNetwork.GOOGLE_SEARCH,
      page_token: '',
      page_size: 10,
      keyword_annotation: [],
    });

    const response = await customer.keywordPlanIdeas.generateKeywordIdeas(request);

    const topResult = response.results?.[0];
    const metrics = topResult?.keyword_idea_metrics;

    return {
      keyword: topResult?.text,
      avgMonthlySearches: metrics?.avg_monthly_searches ?? 0,
      competitionIndex: metrics?.competition ?? 0,
      cpcLow: (metrics?.low_top_of_page_bid_micros ?? 0) / 1_000_000,
      cpcHigh: (metrics?.high_top_of_page_bid_micros ?? 0) / 1_000_000,
    };
  } catch (error: any) {
    console.error('Google Ads API Error:', error.message);
    return null;
  }
}
