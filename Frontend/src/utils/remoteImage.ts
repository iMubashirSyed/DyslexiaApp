import {Image, ImageURISource} from 'react-native';

/** Prefer HTTP disk cache so history thumbs reopen faster than a cold fetch. */
export function remoteImageSource(uri: string | null | undefined): ImageURISource | undefined {
  if (!uri) {
    return undefined;
  }
  return {
    uri,
    cache: 'force-cache',
  };
}

/** Warm the native image cache for a list of media URLs. */
export async function prefetchRemoteImages(
  urls: Array<string | null | undefined>,
): Promise<void> {
  const unique = [...new Set(urls.filter((u): u is string => Boolean(u)))];
  if (unique.length === 0) {
    return;
  }
  await Promise.all(unique.map(uri => Image.prefetch(uri).catch(() => undefined)));
}
