/**
 * Timezone detection utility for automatic user timezone detection
 */

export const getTimezone = () => {
  try {
    // Get user's timezone using browser API
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone || 'UTC';
  } catch (error) {
    console.warn('Failed to detect timezone:', error);
    return 'UTC';
  }
};

export const getTimezoneOffset = () => {
  try {
    // Get timezone offset in minutes
    const offset = new Date().getTimezoneOffset();
    return offset;
  } catch (error) {
    console.warn('Failed to get timezone offset:', error);
    return 0;
  }
};

export const formatTimezoneForDisplay = (timezone) => {
  try {
    // Convert timezone to readable format
    return timezone.replace(/_/g, ' ');
  } catch (error) {
    return timezone || 'UTC';
  }
};

export const isValidTimezone = (timezone) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
};