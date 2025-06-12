import { GoogleAdsApi } from 'google-ads-api';

export const googleAdsClient = new GoogleAdsApi({
  client_id: process.env.GADS_CLIENT_ID!,
  client_secret: process.env.GADS_CLIENT_SECRET!,
  developer_token: process.env.GADS_DEV_TOKEN!,
});

export const customer = googleAdsClient.Customer({
  customer_id: process.env.GADS_CUSTOMER_ID!,
  refresh_token: process.env.GADS_REFRESH_TOKEN!,
});
