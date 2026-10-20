/**
 * FourWard Date Formatting Utility
 * Strictly enforces design rule: Never show ISO dates!
 * Format: "Today · 3:30 pm", "Tomorrow · 9:00 am", or "Mon 19 Oct · 3:30 pm".
 */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatHumanDateTime(dateInput?: string | Date | null, timeInput?: string): string {
  if (!dateInput) return '';

  let d: Date;
  if (typeof dateInput === 'string') {
    // If it's already a human string like "Today" or "Mon 19 Oct"
    if (dateInput.startsWith('Today') || dateInput.startsWith('Tomorrow')) {
      return timeInput ? `${dateInput} · ${timeInput}` : dateInput;
    }
    // Attempt parsing ISO or date
    d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return dateInput;
    }
  } else {
    d = dateInput;
  }

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear();

  let timeFormatted = timeInput;
  if (!timeFormatted) {
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    timeFormatted = `${hours}:${minutesStr} ${ampm}`;
  }

  if (isToday) {
    return timeFormatted ? `Today · ${timeFormatted}` : 'Today';
  }

  if (isTomorrow) {
    return timeFormatted ? `Tomorrow · ${timeFormatted}` : 'Tomorrow';
  }

  const dayName = DAYS[d.getDay()];
  const dayNum = d.getDate();
  const monthName = MONTHS[d.getMonth()];

  return timeFormatted
    ? `${dayName} ${dayNum} ${monthName} · ${timeFormatted}`
    : `${dayName} ${dayNum} ${monthName}`;
}
