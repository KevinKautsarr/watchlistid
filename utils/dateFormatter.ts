export const formatHumanDate = (dateStr: string | null | undefined, locale: 'en' | 'id' = 'en'): string => {
  if (!dateStr) return '';
  try {
    // Replace '-' with '/' for broad compatibility on older platforms/safari
    // but keep 'T' intact if it is an ISO string.
    let sanitized = dateStr;
    if (dateStr.includes('-') && !dateStr.includes('T')) {
      sanitized = dateStr.replace(/-/g, '/');
    }
    const date = new Date(sanitized);
    if (isNaN(date.getTime())) {
      const backupDate = new Date(dateStr);
      if (isNaN(backupDate.getTime())) return dateStr;
      return formatParsedDate(backupDate, locale);
    }
    return formatParsedDate(date, locale);
  } catch (e) {
    return dateStr;
  }
};

/**
 * Compact relative time for feeds: "Just now", "5m", "2h", "3d". Anything older
 * than a week falls back to the absolute human date (e.g. "Jan 5, 2025").
 */
export const formatRelativeTime = (
  dateStr: string | null | undefined,
  locale: 'en' | 'id' = 'en',
  justNowLabel = 'Just now',
): string => {
  if (!dateStr) return '';
  const sanitized = dateStr.includes('-') && !dateStr.includes('T') ? dateStr.replace(/-/g, '/') : dateStr;
  const date = new Date(sanitized);
  if (isNaN(date.getTime())) return formatHumanDate(dateStr, locale);
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return justNowLabel;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return formatHumanDate(dateStr, locale);
};

const formatParsedDate = (date: Date, locale: 'en' | 'id'): string => {
  const day = date.getDate();
  const year = date.getFullYear();
  const monthIdx = date.getMonth();

  const monthsId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthsEn = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const month = locale === 'id' ? monthsId[monthIdx] : monthsEn[monthIdx];
  return locale === 'id' ? `${day} ${month} ${year}` : `${month} ${day}, ${year}`;
};
