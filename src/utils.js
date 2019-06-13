module.exports = {
  getWeekNumber,
  getYear
};

function getWeekNumber() {
  const now = Date.now();
  const date = new Date(+now);

  date.setHours(0, 0, 0);
  // eslint-disable-next-line no-mixed-operators
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));

  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);

  return weekNumber;
}

function getYear() {
  const year = new Date().getFullYear();

  return year;
}
