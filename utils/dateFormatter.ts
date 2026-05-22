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
