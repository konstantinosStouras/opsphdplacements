// The static build replaces this marker with the published data content hash.
const revision = '';
export const dataUrl = url => url.startsWith('data/') && revision
  ? url + (url.includes('?') ? '&' : '?') + 'v=' + revision : url;
