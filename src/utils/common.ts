export function toFullKeyAlias(userId: string, keyAlias: string): string {
  return `${userId}:${keyAlias}`;
}

export function toShortKeyAlias(userId: string, keyAlias: string): string {
  if (keyAlias.startsWith(`${userId}:`)) {
    return keyAlias.slice(userId.length + 1);
  } else {
    return keyAlias;
  }
}
