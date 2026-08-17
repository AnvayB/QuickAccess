const CUISINE_FLAGS: Record<string, string> = {
  American: '🇺🇸',
  Arabian: '🇸🇦',
  Chinese: '🇨🇳',
  French: '🇫🇷',
  German: '🇩🇪',
  Indian: '🇮🇳',
  Italian: '🇮🇹',
  Japanese: '🇯🇵',
  Korean: '🇰🇷',
  Malaysian: '🇲🇾',
  Mediterranean: '🇬🇷',
  Mexican: '🇲🇽',
  Portugese: '🇵🇹',
  Scandanavian: '🇸🇪',
  Taiwanese: '🇹🇼',
  Thai: '🇹🇭',
  Turkish: '🇹🇷',
  Vietnamese: '🇻🇳',
}

export function cuisineFlagFor(cuisine: string): string | undefined {
  return CUISINE_FLAGS[cuisine]
}
