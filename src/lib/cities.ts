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
  // Nepal
  { name: 'Kathmandu',       state: 'Bagmati',           country: 'Nepal', lat: 27.7172,  lon: 85.3240,  tz: '+05:45' },
  { name: 'Pokhara',         state: 'Gandaki',           country: 'Nepal', lat: 28.2096,  lon: 83.9856,  tz: '+05:45' },
  { name: 'Biratnagar',      state: 'Koshi',             country: 'Nepal', lat: 26.4525,  lon: 87.2718,  tz: '+05:45' },
  { name: 'Birgunj',         state: 'Madhesh',           country: 'Nepal', lat: 27.0104,  lon: 84.8778,  tz: '+05:45' },
  { name: 'Lalitpur',        state: 'Bagmati',           country: 'Nepal', lat: 27.6644,  lon: 85.3188,  tz: '+05:45' },
  { name: 'Bhaktapur',       state: 'Bagmati',           country: 'Nepal', lat: 27.6710,  lon: 85.4298,  tz: '+05:45' },
  { name: 'Dharan',          state: 'Koshi',             country: 'Nepal', lat: 26.8120,  lon: 87.2836,  tz: '+05:45' },
  { name: 'Butwal',          state: 'Lumbini',           country: 'Nepal', lat: 27.7006,  lon: 83.4483,  tz: '+05:45' },
  { name: 'Nepalgunj',       state: 'Lumbini',           country: 'Nepal', lat: 28.0500,  lon: 81.6167,  tz: '+05:45' },
  { name: 'Hetauda',         state: 'Bagmati',           country: 'Nepal', lat: 27.4167,  lon: 85.0333,  tz: '+05:45' },
  { name: 'Itahari',         state: 'Koshi',             country: 'Nepal', lat: 26.6647,  lon: 87.2736,  tz: '+05:45' },
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
