// Replace the useEffect for fetching specialist details in SpecialistDetail.tsx with this updated version:

// Fetch specialist details
useEffect(() => {
  const fetchSpecialistDetails = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);

      // Use the API to get specialist details
      const data = await API.specialists.getSpecialistById(
        accessToken,
        specialistId
      );
      setSpecialist(data);

      // If we found a specialist, fetch their available dates
      if (data) {
        fetchAvailableDates(data.id);
      }
    } catch (err) {
      console.error('Failed to fetch specialist details:', err);
      setError('Failed to load specialist details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  fetchSpecialistDetails();
}, [accessToken, specialistId, fetchAvailableDates]);
