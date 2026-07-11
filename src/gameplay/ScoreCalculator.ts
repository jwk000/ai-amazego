export const calculateStars = (elapsedSeconds: number, water: number, parTimeSeconds: number): 1 | 2 | 3 => {
  if (water === 3 && elapsedSeconds <= parTimeSeconds * 1.15) return 3;
  if (water >= 2 || elapsedSeconds <= parTimeSeconds * 1.65) return 2;
  return 1;
};
