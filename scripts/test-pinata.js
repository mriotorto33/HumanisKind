const axios = require('axios');
require('dotenv').config();

async function testPinata() {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;

  console.log("Testing Pinata with Key:", pinataApiKey?.slice(0, 5) + "...");

  try {
    const res = await axios.get("https://api.pinata.cloud/data/testAuthentication", {
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretKey,
      }
    });
    console.log("Pinata Auth SUCCESS:", res.data);
  } catch (error) {
    console.error("Pinata Auth FAILED:", error.response?.data || error.message);
  }
}

testPinata();
