import axios from 'axios';

export const validateEmailWithNeverBounce = async (email) => {
  const apiKey = process.env.NEVERBOUNCE_API;

  const response = await axios.get('https://api.neverbounce.com/v4/single/check', {
    params: {
      key: apiKey,
      email,
      address_info: 1,
      credits_info: 0,
    },
  });

  const { result, flags } = response.data;

  return {
    isValid: result === 'valid',
    isDisposable: flags.includes('disposable'),
    isRole: flags.includes('role_account'),
    fullResponse: response.data,
  };
};
export const validateWithZeroBounce = async (email) => {
  const apiKey = process.env.ZEROBOUNCE_API_KEY;
  if (!apiKey) throw new Error("ZeroBounce API key missing");

  const url = "https://api.zerobounce.net/v2/validate";

  try {
    const { data } = await axios.get(url, {
      params: {
        api_key: apiKey,
        email,
        ip_address: "", // Required, but can be blank
      },
    });

    return {
      isValid: data.status === "valid",
      isCatchAll: data.status === "catch-all",
      isDisposable: data.disposable === "true",
      isToxic: data.toxic === "true",
      isRole: data.role === "true",
      suggestion: data.did_you_mean || null,
      raw: data,
    };
  } catch (err) {
    console.error("ZeroBounce error:", err);
    throw new Error("Failed to validate email with ZeroBounce");
  }
};