export function turncate(str: string) {
  if (str.length < 8) {
    throw new Error('Given string less than 8 characters');
  }

  const start = 7;
  const end = str.length - 7;

  return str.substring(start, end + 1);
}

export function rmKey(didUrl: string) {
  const end = didUrl.length - 7;

  return didUrl.substring(0, end + 1);
}
