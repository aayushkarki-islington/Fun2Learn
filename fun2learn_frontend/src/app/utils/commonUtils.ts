/**
 * Truncate any given string to any number of characters then return elipsis if limit exceeded
 * @param str - The required string to be checked
 * @param maxLength - The maximum length to be display
 * @returns The full string if within limit or truncated string with trailing ellipsis (...)
 */
export const truncate = (str: string, maxLength: number) : string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}