import fetch from "node-fetch";

export async function handler() {
  const API_KEY = process.env.SELLAUTH_API_KEY;

  try {
    const res = await fetch("https://api.sellauth.com/v1/products", {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch products" }),
    };
  }
}
