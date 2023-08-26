export function turncate(str: string) {
  if (str.length < 8) {
    throw new Error('Given string less than 8 characters');
  }

  return str.substring(7);
}
