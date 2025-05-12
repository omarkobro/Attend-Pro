export const getWeekNumber = (date, semesterConfig) => {
  const start = new Date(semesterConfig.startDate);
  const end = new Date(date);
  
  const diffInDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  let weekNumber = Math.floor(diffInDays / 7) + 1;

  // Handle skipped weeks (e.g., midterms or finals)
  const skippedWeeks = semesterConfig.offWeeks.filter(offWeek => offWeek < weekNumber).length;
  weekNumber -= skippedWeeks;

  // Ensure weekNumber doesn't fall below 1
  if (weekNumber < 1) {
    weekNumber = 1;
  }

  // Handle if the date is after the semester's end date
  if (end > new Date(semesterConfig.endDate)) {
    weekNumber = semesterConfig.totalWeeks; // Use the last week number if the date is after the semester ends
  }

  return weekNumber;
};
