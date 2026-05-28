export interface City {
  name: string
  state?: string
  country: string
  lat: number
  lon: number
  tz: string
}

export const CITIES: City[] = [
  // India
  { name: 'Mumbai',          state: 'Maharashtra',       country: 'India', lat: 19.0760,  lon: 72.8777,  tz: '+05:30' },
  { name: 'Delhi',           state: 'Delhi',             country: 'India', lat: 28.6139,  lon: 77.2090,  tz: '+05:30' },
  { name: 'Kolkata',         state: 'West Bengal',       country: 'India', lat: 22.5726,  lon: 88.3639,  tz: '+05:30' },
  { name: 'Chennai',         state: 'Tamil Nadu',        country: 'India', lat: 13.0827,  lon: 80.2707,  tz: '+05:30' },
  { name: 'Bangalore',       state: 'Karnataka',         country: 'India', lat: 12.9716,  lon: 77.5946,  tz: '+05:30' },
  { name: 'Hyderabad',       state: 'Telangana',         country: 'India', lat: 17.3850,  lon: 78.4867,  tz: '+05:30' },
  { name: 'Pune',            state: 'Maharashtra',       country: 'India', lat: 18.5204,  lon: 73.8567,  tz: '+05:30' },
  { name: 'Ahmedabad',       state: 'Gujarat',           country: 'India', lat: 23.0225,  lon: 72.5714,  tz: '+05:30' },
  { name: 'Jaipur',          state: 'Rajasthan',         country: 'India', lat: 26.9124,  lon: 75.7873,  tz: '+05:30' },
  { name: 'Lucknow',         state: 'Uttar Pradesh',     country: 'India', lat: 26.8467,  lon: 80.9462,  tz: '+05:30' },
  { name: 'Varanasi',        state: 'Uttar Pradesh',     country: 'India', lat: 25.3176,  lon: 82.9739,  tz: '+05:30' },
  { name: 'Chandigarh',      state: 'Punjab/Haryana',    country: 'India', lat: 30.7333,  lon: 76.7794,  tz: '+05:30' },
  { name: 'Nagpur',          state: 'Maharashtra',       country: 'India', lat: 21.1458,  lon: 79.0882,  tz: '+05:30' },
  { name: 'Kochi',           state: 'Kerala',            country: 'India', lat:  9.9312,  lon: 76.2673,  tz: '+05:30' },
  { name: 'Bhopal',          state: 'Madhya Pradesh',    country: 'India', lat: 23.2599,  lon: 77.4126,  tz: '+05:30' },
  { name: 'Patna',           state: 'Bihar',             country: 'India', lat: 25.5941,  lon: 85.1376,  tz: '+05:30' },
  { name: 'Indore',          state: 'Madhya Pradesh',    country: 'India', lat: 22.7196,  lon: 75.8577,  tz: '+05:30' },
  { name: 'Dehradun',        state: 'Uttarakhand',       country: 'India', lat: 30.3165,  lon: 78.0322,  tz: '+05:30' },
  { name: 'Amritsar',        state: 'Punjab',            country: 'India', lat: 31.6340,  lon: 74.8723,  tz: '+05:30' },
  { name: 'Surat',           state: 'Gujarat',           country: 'India', lat: 21.1702,  lon: 72.8311,  tz: '+05:30' },
  { name: 'Visakhapatnam',   state: 'Andhra Pradesh',    country: 'India', lat: 17.6868,  lon: 83.2185,  tz: '+05:30' },
  { name: 'Vadodara',        state: 'Gujarat',           country: 'India', lat: 22.3072,  lon: 73.1812,  tz: '+05:30' },
  { name: 'Agra',            state: 'Uttar Pradesh',     country: 'India', lat: 27.1767,  lon: 78.0081,  tz: '+05:30' },
  { name: 'Meerut',          state: 'Uttar Pradesh',     country: 'India', lat: 28.9845,  lon: 77.7064,  tz: '+05:30' },
  { name: 'Jodhpur',         state: 'Rajasthan',         country: 'India', lat: 26.2389,  lon: 73.0243,  tz: '+05:30' },
  { name: 'Udaipur',         state: 'Rajasthan',         country: 'India', lat: 24.5854,  lon: 73.7125,  tz: '+05:30' },
  { name: 'Mysuru',          state: 'Karnataka',         country: 'India', lat: 12.2958,  lon: 76.6394,  tz: '+05:30' },
  { name: 'Nashik',          state: 'Maharashtra',       country: 'India', lat: 19.9975,  lon: 73.7898,  tz: '+05:30' },
  { name: 'Coimbatore',      state: 'Tamil Nadu',        country: 'India', lat: 11.0168,  lon: 76.9558,  tz: '+05:30' },
  { name: 'Thiruvananthapuram', state: 'Kerala',         country: 'India', lat:  8.5241,  lon: 76.9366,  tz: '+05:30' },
  { name: 'Shimla',          state: 'Himachal Pradesh',  country: 'India', lat: 31.1048,  lon: 77.1734,  tz: '+05:30' },
  { name: 'Srinagar',        state: 'J&K',               country: 'India', lat: 34.0837,  lon: 74.7973,  tz: '+05:30' },
  { name: 'Jammu',           state: 'J&K',               country: 'India', lat: 32.7266,  lon: 74.8570,  tz: '+05:30' },
  { name: 'Bhubaneswar',     state: 'Odisha',            country: 'India', lat: 20.2961,  lon: 85.8245,  tz: '+05:30' },
  { name: 'Ranchi',          state: 'Jharkhand',         country: 'India', lat: 23.3441,  lon: 85.3096,  tz: '+05:30' },
  { name: 'Guwahati',        state: 'Assam',             country: 'India', lat: 26.1445,  lon: 91.7362,  tz: '+05:30' },
  { name: 'Tirupati',        state: 'Andhra Pradesh',    country: 'India', lat: 13.6288,  lon: 79.4192,  tz: '+05:30' },
  { name: 'Haridwar',        state: 'Uttarakhand',       country: 'India', lat: 29.9457,  lon: 78.1642,  tz: '+05:30' },
  { name: 'Rishikesh',       state: 'Uttarakhand',       country: 'India', lat: 30.0869,  lon: 78.2676,  tz: '+05:30' },
  { name: 'Puri',            state: 'Odisha',            country: 'India', lat: 19.8134,  lon: 85.8315,  tz: '+05:30' },
  { name: 'Mathura',         state: 'Uttar Pradesh',     country: 'India', lat: 27.4924,  lon: 77.6737,  tz: '+05:30' },
  { name: 'Madurai',         state: 'Tamil Nadu',        country: 'India', lat:  9.9252,  lon: 78.1198,  tz: '+05:30' },
  { name: 'Raipur',          state: 'Chhattisgarh',      country: 'India', lat: 21.2514,  lon: 81.6296,  tz: '+05:30' },
  { name: 'Vijayawada',      state: 'Andhra Pradesh',    country: 'India', lat: 16.5062,  lon: 80.6480,  tz: '+05:30' },
  { name: 'Ludhiana',        state: 'Punjab',            country: 'India', lat: 30.9010,  lon: 75.8573,  tz: '+05:30' },
  { name: 'Goa (Panaji)',    state: 'Goa',               country: 'India', lat: 15.4909,  lon: 73.8278,  tz: '+05:30' },
  { name: 'Rajkot',          state: 'Gujarat',           country: 'India', lat: 22.3039,  lon: 70.8022,  tz: '+05:30' },
  // Nepal — Koshi Province (14 districts)
  { name: 'Taplejung',        state: 'Koshi',             country: 'Nepal', lat: 27.3536,  lon: 87.6697,  tz: '+05:45' },
  { name: 'Phidim (Panchthar)', state: 'Koshi',           country: 'Nepal', lat: 27.1511,  lon: 87.7550,  tz: '+05:45' },
  { name: 'Ilam',             state: 'Koshi',             country: 'Nepal', lat: 26.9086,  lon: 87.9246,  tz: '+05:45' },
  { name: 'Bhadrapur (Jhapa)', state: 'Koshi',            country: 'Nepal', lat: 26.5247,  lon: 88.0872,  tz: '+05:45' },
  { name: 'Damak',            state: 'Koshi',             country: 'Nepal', lat: 26.6625,  lon: 87.6993,  tz: '+05:45' },
  { name: 'Mechinagar',       state: 'Koshi',             country: 'Nepal', lat: 26.6033,  lon: 88.1252,  tz: '+05:45' },
  { name: 'Biratnagar',       state: 'Koshi',             country: 'Nepal', lat: 26.4525,  lon: 87.2718,  tz: '+05:45' },
  { name: 'Itahari',          state: 'Koshi',             country: 'Nepal', lat: 26.6647,  lon: 87.2736,  tz: '+05:45' },
  { name: 'Dharan',           state: 'Koshi',             country: 'Nepal', lat: 26.8120,  lon: 87.2836,  tz: '+05:45' },
  { name: 'Inaruwa (Sunsari)', state: 'Koshi',            country: 'Nepal', lat: 26.6191,  lon: 87.1510,  tz: '+05:45' },
  { name: 'Dhankuta',         state: 'Koshi',             country: 'Nepal', lat: 26.9835,  lon: 87.3421,  tz: '+05:45' },
  { name: 'Myanglung (Terhathum)', state: 'Koshi',        country: 'Nepal', lat: 27.1154,  lon: 87.5490,  tz: '+05:45' },
  { name: 'Khandbari (Sankhuwasabha)', state: 'Koshi',    country: 'Nepal', lat: 27.3631,  lon: 87.2134,  tz: '+05:45' },
  { name: 'Bhojpur',          state: 'Koshi',             country: 'Nepal', lat: 27.1765,  lon: 87.0523,  tz: '+05:45' },
  { name: 'Solududhkunda (Solukhumbu)', state: 'Koshi',   country: 'Nepal', lat: 27.7226,  lon: 86.7225,  tz: '+05:45' },
  { name: 'Namche Bazaar',    state: 'Koshi',             country: 'Nepal', lat: 27.8038,  lon: 86.7136,  tz: '+05:45' },
  { name: 'Okhaldhunga',      state: 'Koshi',             country: 'Nepal', lat: 27.3082,  lon: 86.5015,  tz: '+05:45' },
  { name: 'Diktel (Khotang)', state: 'Koshi',             country: 'Nepal', lat: 27.2258,  lon: 86.8012,  tz: '+05:45' },
  { name: 'Gaighat (Udayapur)', state: 'Koshi',           country: 'Nepal', lat: 26.7552,  lon: 86.5245,  tz: '+05:45' },
  // Nepal — Madhesh Province (8 districts)
  { name: 'Rajbiraj (Saptari)', state: 'Madhesh',         country: 'Nepal', lat: 26.5439,  lon: 86.7363,  tz: '+05:45' },
  { name: 'Siraha',            state: 'Madhesh',           country: 'Nepal', lat: 26.6551,  lon: 86.2100,  tz: '+05:45' },
  { name: 'Janakpur',          state: 'Madhesh',           country: 'Nepal', lat: 26.7281,  lon: 85.9373,  tz: '+05:45' },
  { name: 'Jaleshwar (Mahottari)', state: 'Madhesh',       country: 'Nepal', lat: 26.6449,  lon: 85.7991,  tz: '+05:45' },
  { name: 'Malangwa (Sarlahi)', state: 'Madhesh',          country: 'Nepal', lat: 27.0149,  lon: 85.5613,  tz: '+05:45' },
  { name: 'Gaur (Rautahat)',   state: 'Madhesh',           country: 'Nepal', lat: 26.7699,  lon: 85.2857,  tz: '+05:45' },
  { name: 'Kalaiya (Bara)',    state: 'Madhesh',           country: 'Nepal', lat: 27.0280,  lon: 84.8830,  tz: '+05:45' },
  { name: 'Birgunj',          state: 'Madhesh',            country: 'Nepal', lat: 27.0104,  lon: 84.8778,  tz: '+05:45' },
  // Nepal — Bagmati Province (13 districts)
  { name: 'Kathmandu',        state: 'Bagmati',            country: 'Nepal', lat: 27.7172,  lon: 85.3240,  tz: '+05:45' },
  { name: 'Lalitpur',         state: 'Bagmati',            country: 'Nepal', lat: 27.6644,  lon: 85.3188,  tz: '+05:45' },
  { name: 'Bhaktapur',        state: 'Bagmati',            country: 'Nepal', lat: 27.6710,  lon: 85.4298,  tz: '+05:45' },
  { name: 'Kirtipur',         state: 'Bagmati',            country: 'Nepal', lat: 27.6750,  lon: 85.2781,  tz: '+05:45' },
  { name: 'Banepa',           state: 'Bagmati',            country: 'Nepal', lat: 27.6312,  lon: 85.5244,  tz: '+05:45' },
  { name: 'Dhulikhel (Kavrepalanchok)', state: 'Bagmati', country: 'Nepal', lat: 27.6244,  lon: 85.5483,  tz: '+05:45' },
  { name: 'Nagarkot',         state: 'Bagmati',            country: 'Nepal', lat: 27.7155,  lon: 85.5169,  tz: '+05:45' },
  { name: 'Sindhulimadi (Sindhuli)', state: 'Bagmati',     country: 'Nepal', lat: 27.2548,  lon: 85.9688,  tz: '+05:45' },
  { name: 'Manthali (Ramechhap)', state: 'Bagmati',        country: 'Nepal', lat: 27.4004,  lon: 86.0938,  tz: '+05:45' },
  { name: 'Charikot (Dolakha)', state: 'Bagmati',          country: 'Nepal', lat: 27.6635,  lon: 86.0476,  tz: '+05:45' },
  { name: 'Chautara (Sindhupalchok)', state: 'Bagmati',    country: 'Nepal', lat: 27.8688,  lon: 85.6977,  tz: '+05:45' },
  { name: 'Bidur (Nuwakot)',  state: 'Bagmati',            country: 'Nepal', lat: 27.9113,  lon: 85.1690,  tz: '+05:45' },
  { name: 'Dhunche (Rasuwa)', state: 'Bagmati',            country: 'Nepal', lat: 28.1081,  lon: 85.3078,  tz: '+05:45' },
  { name: 'Dhading Besi',     state: 'Bagmati',            country: 'Nepal', lat: 27.8626,  lon: 84.9081,  tz: '+05:45' },
  { name: 'Hetauda',          state: 'Bagmati',            country: 'Nepal', lat: 27.4167,  lon: 85.0333,  tz: '+05:45' },
  { name: 'Bharatpur (Chitwan)', state: 'Bagmati',         country: 'Nepal', lat: 27.6817,  lon: 84.4297,  tz: '+05:45' },
  // Nepal — Gandaki Province (11 districts)
  { name: 'Pokhara',          state: 'Gandaki',            country: 'Nepal', lat: 28.2096,  lon: 83.9856,  tz: '+05:45' },
  { name: 'Gorkha',           state: 'Gandaki',            country: 'Nepal', lat: 28.0021,  lon: 84.6277,  tz: '+05:45' },
  { name: 'Besisahar (Lamjung)', state: 'Gandaki',         country: 'Nepal', lat: 28.2403,  lon: 84.3812,  tz: '+05:45' },
  { name: 'Damauli (Tanahu)', state: 'Gandaki',            country: 'Nepal', lat: 27.9649,  lon: 84.3396,  tz: '+05:45' },
  { name: 'Syangja',          state: 'Gandaki',            country: 'Nepal', lat: 28.0822,  lon: 83.8852,  tz: '+05:45' },
  { name: 'Baglung',          state: 'Gandaki',            country: 'Nepal', lat: 28.2688,  lon: 83.5897,  tz: '+05:45' },
  { name: 'Kushma (Parbat)',  state: 'Gandaki',            country: 'Nepal', lat: 28.2236,  lon: 83.7162,  tz: '+05:45' },
  { name: 'Beni (Myagdi)',    state: 'Gandaki',            country: 'Nepal', lat: 28.3553,  lon: 83.5780,  tz: '+05:45' },
  { name: 'Jomsom (Mustang)', state: 'Gandaki',            country: 'Nepal', lat: 28.7806,  lon: 83.7278,  tz: '+05:45' },
  { name: 'Chame (Manang)',   state: 'Gandaki',            country: 'Nepal', lat: 28.6631,  lon: 84.2231,  tz: '+05:45' },
  { name: 'Kawasoti (Nawalpur)', state: 'Gandaki',         country: 'Nepal', lat: 27.6600,  lon: 84.1230,  tz: '+05:45' },
  // Nepal — Lumbini Province (12 districts)
  { name: 'Butwal',           state: 'Lumbini',            country: 'Nepal', lat: 27.7006,  lon: 83.4483,  tz: '+05:45' },
  { name: 'Lumbini',          state: 'Lumbini',            country: 'Nepal', lat: 27.4833,  lon: 83.2667,  tz: '+05:45' },
  { name: 'Tansen (Palpa)',   state: 'Lumbini',            country: 'Nepal', lat: 27.8649,  lon: 83.5417,  tz: '+05:45' },
  { name: 'Taulihawa (Kapilvastu)', state: 'Lumbini',      country: 'Nepal', lat: 27.5500,  lon: 83.0500,  tz: '+05:45' },
  { name: 'Sandhikharka (Arghakhanchi)', state: 'Lumbini', country: 'Nepal', lat: 27.9596,  lon: 83.1762,  tz: '+05:45' },
  { name: 'Tamghas (Gulmi)',  state: 'Lumbini',            country: 'Nepal', lat: 28.0696,  lon: 83.3100,  tz: '+05:45' },
  { name: 'Ramgram (Nawalparasi W)', state: 'Lumbini',     country: 'Nepal', lat: 27.5673,  lon: 83.6286,  tz: '+05:45' },
  { name: 'Ghorahi (Dang)',   state: 'Lumbini',            country: 'Nepal', lat: 28.0287,  lon: 82.4928,  tz: '+05:45' },
  { name: 'Tulsipur',         state: 'Lumbini',            country: 'Nepal', lat: 28.1290,  lon: 82.2960,  tz: '+05:45' },
  { name: 'Pyuthan',          state: 'Lumbini',            country: 'Nepal', lat: 28.1113,  lon: 82.8606,  tz: '+05:45' },
  { name: 'Liwang (Rolpa)',   state: 'Lumbini',            country: 'Nepal', lat: 28.3168,  lon: 82.6456,  tz: '+05:45' },
  { name: 'Rukumkot (Rukum E)', state: 'Lumbini',          country: 'Nepal', lat: 28.5640,  lon: 82.7110,  tz: '+05:45' },
  { name: 'Nepalgunj',        state: 'Lumbini',            country: 'Nepal', lat: 28.0500,  lon: 81.6167,  tz: '+05:45' },
  { name: 'Gulariya (Bardiya)', state: 'Lumbini',          country: 'Nepal', lat: 28.1994,  lon: 81.2869,  tz: '+05:45' },
  // Nepal — Karnali Province (10 districts)
  { name: 'Birendranagar (Surkhet)', state: 'Karnali',     country: 'Nepal', lat: 28.5961,  lon: 81.6177,  tz: '+05:45' },
  { name: 'Salyan',           state: 'Karnali',            country: 'Nepal', lat: 28.3712,  lon: 82.1682,  tz: '+05:45' },
  { name: 'Musikot (Rukum W)', state: 'Karnali',           country: 'Nepal', lat: 28.6238,  lon: 82.3487,  tz: '+05:45' },
  { name: 'Khalanga (Jajarkot)', state: 'Karnali',         country: 'Nepal', lat: 28.7034,  lon: 82.1963,  tz: '+05:45' },
  { name: 'Narayan (Dailekh)', state: 'Karnali',           country: 'Nepal', lat: 28.8490,  lon: 81.7117,  tz: '+05:45' },
  { name: 'Manma (Kalikot)',  state: 'Karnali',            country: 'Nepal', lat: 29.2153,  lon: 81.6491,  tz: '+05:45' },
  { name: 'Jumla',            state: 'Karnali',            country: 'Nepal', lat: 29.2752,  lon: 82.1837,  tz: '+05:45' },
  { name: 'Dunai (Dolpa)',    state: 'Karnali',            country: 'Nepal', lat: 29.0353,  lon: 82.8948,  tz: '+05:45' },
  { name: 'Gamgadhi (Mugu)', state: 'Karnali',             country: 'Nepal', lat: 29.5213,  lon: 82.1974,  tz: '+05:45' },
  { name: 'Simikot (Humla)', state: 'Karnali',             country: 'Nepal', lat: 29.9683,  lon: 81.8192,  tz: '+05:45' },
  // Nepal — Sudurpashchim Province (9 districts)
  { name: 'Dhangadhi (Kailali)', state: 'Sudurpashchim',   country: 'Nepal', lat: 28.7000,  lon: 80.5833,  tz: '+05:45' },
  { name: 'Mahendranagar (Kanchanpur)', state: 'Sudurpashchim', country: 'Nepal', lat: 28.9700, lon: 80.1836, tz: '+05:45' },
  { name: 'Dipayal Silgadhi (Doti)', state: 'Sudurpashchim', country: 'Nepal', lat: 29.2625, lon: 80.9677, tz: '+05:45' },
  { name: 'Mangalsen (Achham)', state: 'Sudurpashchim',    country: 'Nepal', lat: 29.1150,  lon: 81.1862,  tz: '+05:45' },
  { name: 'Dadeldhura',       state: 'Sudurpashchim',      country: 'Nepal', lat: 29.3024,  lon: 80.5791,  tz: '+05:45' },
  { name: 'Dasharathchand (Baitadi)', state: 'Sudurpashchim', country: 'Nepal', lat: 29.5423, lon: 80.5513, tz: '+05:45' },
  { name: 'Darchula',         state: 'Sudurpashchim',      country: 'Nepal', lat: 29.8530,  lon: 80.5512,  tz: '+05:45' },
  { name: 'Chainpur (Bajhang)', state: 'Sudurpashchim',    country: 'Nepal', lat: 29.5569,  lon: 81.1900,  tz: '+05:45' },
  { name: 'Martadi (Bajura)', state: 'Sudurpashchim',      country: 'Nepal', lat: 29.5497,  lon: 81.2021,  tz: '+05:45' },
  // USA
  { name: 'New York',        state: 'New York',          country: 'USA',   lat: 40.7128,  lon: -74.0060, tz: '-05:00' },
  { name: 'Los Angeles',     state: 'California',        country: 'USA',   lat: 34.0522,  lon: -118.2437,tz: '-08:00' },
  { name: 'Chicago',         state: 'Illinois',          country: 'USA',   lat: 41.8781,  lon: -87.6298, tz: '-06:00' },
  { name: 'Houston',         state: 'Texas',             country: 'USA',   lat: 29.7604,  lon: -95.3698, tz: '-06:00' },
  { name: 'San Francisco',   state: 'California',        country: 'USA',   lat: 37.7749,  lon: -122.4194,tz: '-08:00' },
  { name: 'Seattle',         state: 'Washington',        country: 'USA',   lat: 47.6062,  lon: -122.3321,tz: '-08:00' },
  { name: 'Boston',          state: 'Massachusetts',     country: 'USA',   lat: 42.3601,  lon: -71.0589, tz: '-05:00' },
  // UK
  { name: 'London',          country: 'UK',              lat: 51.5074,  lon: -0.1278,  tz: '+00:00' },
  { name: 'Birmingham',      country: 'UK',              lat: 52.4862,  lon: -1.8904,  tz: '+00:00' },
  { name: 'Manchester',      country: 'UK',              lat: 53.4808,  lon: -2.2426,  tz: '+00:00' },
  // UAE
  { name: 'Dubai',           country: 'UAE',             lat: 25.2048,  lon: 55.2708,  tz: '+04:00' },
  { name: 'Abu Dhabi',       country: 'UAE',             lat: 24.4539,  lon: 54.3773,  tz: '+04:00' },
  // Australia
  { name: 'Sydney',          state: 'NSW',               country: 'Australia', lat: -33.8688, lon: 151.2093, tz: '+10:00' },
  { name: 'Melbourne',       state: 'Victoria',          country: 'Australia', lat: -37.8136, lon: 144.9631, tz: '+10:00' },
  // Canada
  { name: 'Toronto',         state: 'Ontario',           country: 'Canada',    lat: 43.6532, lon: -79.3832,  tz: '-05:00' },
  { name: 'Vancouver',       state: 'BC',                country: 'Canada',    lat: 49.2827, lon: -123.1207, tz: '-08:00' },
  // Singapore
  { name: 'Singapore',       country: 'Singapore',       lat:  1.3521,  lon: 103.8198, tz: '+08:00' },
  // Germany
  { name: 'Berlin',          country: 'Germany',         lat: 52.5200,  lon: 13.4050,  tz: '+01:00' },
  // Sri Lanka
  { name: 'Colombo',         country: 'Sri Lanka',       lat:  6.9271,  lon: 79.8612,  tz: '+05:30' },
  // Pakistan
  { name: 'Karachi',         country: 'Pakistan',        lat: 24.8607,  lon: 67.0011,  tz: '+05:00' },
  { name: 'Lahore',          country: 'Pakistan',        lat: 31.5497,  lon: 74.3436,  tz: '+05:00' },
  // Bangladesh
  { name: 'Dhaka',           country: 'Bangladesh',      lat: 23.8103,  lon: 90.4125,  tz: '+06:00' },
  // Japan
  { name: 'Tokyo',           country: 'Japan',           lat: 35.6762,  lon: 139.6503, tz: '+09:00' },
]

export function searchCities(query: string, limit = 8): City[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return CITIES.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.country.toLowerCase().includes(q) ||
    (c.state ?? '').toLowerCase().includes(q)
  ).slice(0, limit)
}
