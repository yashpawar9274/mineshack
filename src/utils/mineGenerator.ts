import CryptoJS from "crypto-js";

export const generateMines = (
  clientSeed: string,
  serverSeed: string,
  nonce: number,
  minesCount: number
): boolean[] => {
  // Create combined seed
  const combinedSeed = `${serverSeed}:${clientSeed}:${nonce}`;
  
  // Generate hash using SHA-256
  const hash = CryptoJS.SHA256(combinedSeed).toString();
  
  // Convert hash to positions
  const grid = Array(25).fill(false);
  const minePositions = new Set<number>();
  
  let index = 0;
  while (minePositions.size < minesCount && index < hash.length - 1) {
    // Take 2 characters at a time from hash
    const hexPair = hash.substring(index, index + 2);
    const value = parseInt(hexPair, 16);
    
    // Map to grid position (0-24)
    const position = value % 25;
    
    minePositions.add(position);
    index += 2;
  }
  
  // If we don't have enough mines, use additional hashing
  while (minePositions.size < minesCount) {
    const additionalHash = CryptoJS.SHA256(hash + minePositions.size).toString();
    const value = parseInt(additionalHash.substring(0, 2), 16);
    const position = value % 25;
    minePositions.add(position);
  }
  
  // Set mine positions
  minePositions.forEach(pos => {
    grid[pos] = true;
  });
  
  return grid;
};
