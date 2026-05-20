const calculatePoints = ({ isCorrect, attemptNumber, hintOpened, theoryOpened, videoWatched, timeTakenSeconds, isBossStep, isClone }) => {
  if (!isCorrect) return 0;
  let points = 0;
  if (isBossStep) {
    points = attemptNumber === 1 ? 25 : 10;
  } else if (isClone) {
    points = 7;
  } else if (attemptNumber === 1 && !hintOpened && !theoryOpened && !videoWatched) {
    points = 10;
  } else if (hintOpened || theoryOpened) {
    points = 5;
  } else if (videoWatched) {
    points = 3;
  } else {
    points = 5;
  }
  if (timeTakenSeconds < 30 && attemptNumber === 1) {
    points += 5;
  }
  return points;
};

module.exports = { calculatePoints };