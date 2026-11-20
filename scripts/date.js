export default function parseLocalDateTime(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value);
  if (!match) return NaN;

  const [year, month, day, hour, minute] = match.slice(1).map((part) => Number(part || 0));
  const date = new Date(value.includes('T') ? value : `${value}T00:00`);
  if (year < 1 || date.getFullYear() !== year || date.getMonth() + 1 !== month
    || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute) {
    return NaN;
  }
  return date.getTime();
}
