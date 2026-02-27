// Mock train data (Replace with real API later)
const MOCK_TRAINS = [
  { number: "12301", name: "Howrah - New Delhi Rajdhani Express" },
  { number: "12302", name: "New Delhi - Howrah Rajdhani Express" },
  { number: "12951", name: "Mumbai Central - New Delhi Rajdhani Express" },
  { number: "12952", name: "New Delhi - Mumbai Central Rajdhani Express" },
  { number: "12009", name: "Mumbai Central - Ahmedabad Shatabdi Express" },
  { number: "12010", name: "Ahmedabad - Mumbai Central Shatabdi Express" },
  { number: "12259", name: "Sealdah - New Delhi Duronto Express" },
  { number: "12260", name: "New Delhi - Sealdah Duronto Express" },
  { number: "12283", name: "New Delhi - Ernakulam Duronto Express" },
  { number: "12284", name: "Ernakulam - New Delhi Duronto Express" },
  { number: "12622", name: "Chennai Central - New Delhi Tamil Nadu Express" },
  { number: "12621", name: "New Delhi - Chennai Central Tamil Nadu Express" },
  { number: "22691", name: "Rajendranagar - Bandra Terminus Superfast Express" },
  { number: "22692", name: "Bandra Terminus - Rajendranagar Superfast Express" },
  { number: "12295", name: "Sanghamitra Express" },
  { number: "12296", name: "Sanghamitra Express" },
  { number: "12801", name: "Purushottam Express" },
  { number: "12802", name: "Purushottam Express" },
  { number: "12615", name: "Grand Trunk Express" },
  { number: "12616", name: "Grand Trunk Express" },
  { number: "12431", name: "Rajdhani Express" },
  { number: "12432", name: "Rajdhani Express" },
  { number: "12723", name: "Telangana Express" },
  { number: "12724", name: "Telangana Express" },
  { number: "12049", name: "Gatimaan Express" },
  { number: "12050", name: "Gatimaan Express" },
  { number: "12301", name: "Kolkata Rajdhani" },
  { number: "12302", name: "Kolkata Rajdhani" },
  { number: "22691", name: "KSR Bengaluru Rajdhani" },
  { number: "22692", name: "KSR Bengaluru Rajdhani" },
  { number: "12433", name: "Hazrat Nizamuddin - Rajendranagar Rajdhani" },
  { number: "12434", name: "Rajendranagar - Hazrat Nizamuddin Rajdhani" },
];

// Search trains by number or name
export const searchTrains = (query) => {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase();
  return MOCK_TRAINS.filter(
    (train) =>
      train.number.includes(searchTerm) ||
      train.name.toLowerCase().includes(searchTerm)
  ).slice(0, 10); // Return max 10 results
};

// Get train by number
export const getTrainByNumber = (trainNumber) => {
  return MOCK_TRAINS.find((train) => train.number === trainNumber);
};

// Validate PNR format (10 digits)
export const validatePNR = (pnr) => {
  const pnrRegex = /^\d{10}$/;
  return pnrRegex.test(pnr);
};

// Mock PNR verification (Replace with real API)
export const verifyPNR = async (pnr) => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!validatePNR(pnr)) {
    throw new Error("Invalid PNR format. PNR must be 10 digits.");
  }

  // Mock response
  const randomTrain = MOCK_TRAINS[Math.floor(Math.random() * MOCK_TRAINS.length)];
  
  return {
    pnr,
    valid: true,
    train: {
      number: randomTrain.number,
      name: randomTrain.name,
    },
    passenger: {
      name: "John Doe", // Mock data
      coach: "S4",
      seat: "42",
      status: "Confirmed",
    },
  };
};

// Real API integration functions (Uncomment when you have API key)

/*
// Using RapidAPI - Railway API
export const searchTrainsFromAPI = async (query) => {
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY_HERE',
      'X-RapidAPI-Host': 'indian-railway-api.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(
      `https://indian-railway-api.p.rapidapi.com/trains/search?query=${query}`,
      options
    );
    const data = await response.json();
    return data.trains || [];
  } catch (error) {
    console.error('Error fetching trains:', error);
    return [];
  }
};

export const verifyPNRFromAPI = async (pnr) => {
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY_HERE',
      'X-RapidAPI-Host': 'indian-railway-api.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(
      `https://indian-railway-api.p.rapidapi.com/pnr/${pnr}`,
      options
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying PNR:', error);
    throw new Error('Failed to verify PNR');
  }
};
*/