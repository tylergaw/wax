// A naive pluralize function (good enough for this project)
export function pluralize(str: string, count: number = 1): string {
  const isPlural = count === 0 || count > 1;
  return `${str}${isPlural ? "s" : ""}`;
}
