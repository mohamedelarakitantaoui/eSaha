// Fix for 'API' is defined but never used

// Original import
import API, { Specialist } from '../services/api';

// Solution 1: Use ESLint disable comment
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import API, { Specialist } from '../services/api';

// Solution 2: Remove API from the import if you're not using it
import { Specialist } from '../services/api';

// Solution 3: Use API somewhere in the code
// In the fetchSpecialists function, replace this:
/*
const alAkhawaynSpecialists: Specialist[] = [
  // Hardcoded data
];
setSpecialists(alAkhawaynSpecialists);
*/

// With this:
try {
  const data = await API.specialists.getAllSpecialists(accessToken);
  setSpecialists(data);
} catch (error) {
  console.error('Error fetching specialists:', error);
  // Fallback to hardcoded data if API fails
  const alAkhawaynSpecialists: Specialist[] = [
    // Hardcoded data
  ];
  setSpecialists(alAkhawaynSpecialists);
}
