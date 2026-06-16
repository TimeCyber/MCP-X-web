/**
 * 基于 IndexedDB 的媒体缓存工具
 * 将画布上的图片/视频 URL 转为 base64 存储，刷新后无需重新请求网络
 */

const DB_NAME = 'mcpx_media_cache';
const DB_VERSION = 1;
const STORE_NAME = 'media';
// 缓存有效期：7天
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

let _db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (_db) { resolve(_db); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };
    req.onsuccess = (e) => { _db = (e.target as IDBOpenDBRequest).result; resolve(_db!); };
    req.onerror = () => reject(req.error);
  });

const idbGet = async (url: string): Promise<{ url: string; dataUrl: string; cachedAt: number } | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(url);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const idbPut = async (url: string, dataUrl: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put({ url, dataUrl, cachedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

/**
 * 将 http/https URL 的媒体资源缓存到 IndexedDB，返回 base64 data URL。
 * - 已是 base64 / data: 开头：直接返回
 * - 已有有效缓存：直接返回缓存
 * - 否则：fetch → 转 base64 → 存 IndexedDB → 返回
 */
export const cacheMediaUrl = async (url: string): Promise<string> => {
  if (!url) return url;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  try {
    const cached = await idbGet(url);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.dataUrl;
    }

    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
    const blob = await response.blob();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    await idbPut(url, dataUrl);
    return dataUrl;
  } catch (err) {
    console.warn('[mediaCache] 缓存失败，使用原始 URL:', url, err);
    return url;
  }
};

/**
 * 读取缓存（不触发网络请求）。
 * 有缓存返回 base64，否则返回原始 URL。
 */
export const getCachedMediaUrl = async (url: string): Promise<string> => {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
  try {
    const cached = await idbGet(url);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.dataUrl;
    }
  } catch { /* ignore */ }
  return url;
};

/**
 * 批量预缓存 URL 列表（后台静默执行，不阻塞主流程）
 */
export const prefetchMediaUrls = (urls: string[]): void => {
  const httpUrls = urls.filter(u => u && u.startsWith('http'));
  if (httpUrls.length === 0) return;
  // 串行缓存，避免并发过多
  (async () => {
    for (const url of httpUrls) {
      try { await cacheMediaUrl(url); } catch { /* ignore */ }
    }
  })();
};

/**
 * 清理过期缓存（可在应用启动时调用一次）
 */
/** 已成功解码的 Image（按原始 href 去重） */
const loadedImageCache = new Map<string, HTMLImageElement>();
/** 进行中的加载（同一 URL 只发起一次请求） */
const inFlightImageLoads = new Map<string, Promise<HTMLImageElement | null>>();

const IMAGE_LOAD_TIMEOUT_MS = 20000;

// 限制同时进行的网络图片加载数量，避免一次性发起大量请求把浏览器连接池打满，
// 导致前几张加载成功后剩余图片全部卡住不再加载。
const MAX_CONCURRENT_NETWORK_LOADS = 4;
let activeNetworkLoads = 0;
const networkLoadQueue: Array<() => void> = [];

const acquireNetworkSlot = (): Promise<void> =>
  new Promise((resolve) => {
    if (activeNetworkLoads < MAX_CONCURRENT_NETWORK_LOADS) {
      activeNetworkLoads++;
      resolve();
    } else {
      networkLoadQueue.push(resolve);
    }
  });

const releaseNetworkSlot = (): void => {
  const next = networkLoadQueue.shift();
  if (next) {
    next();
  } else {
    activeNetworkLoads = Math.max(0, activeNetworkLoads - 1);
  }
};

const decodeImageFromSrc = (src: string, useCrossOrigin = true): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    if (useCrossOrigin) img.crossOrigin = 'anonymous';
    const timer = window.setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      img.src = '';
      resolve(null);
    }, IMAGE_LOAD_TIMEOUT_MS);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });

/**
 * 加载图片：IndexedDB 缓存优先 → 网络拉取并写入缓存 → 回退原始 URL。
 * 同一 URL 并发只加载一次，避免重复请求。
 */
export const loadMediaImage = async (url: string): Promise<HTMLImageElement | null> => {
  const key = (url || '').trim();
  if (!key) return null;

  const cachedImg = loadedImageCache.get(key);
  if (cachedImg) return cachedImg;

  const inFlight = inFlightImageLoads.get(key);
  if (inFlight) return inFlight;

  const task = (async (): Promise<HTMLImageElement | null> => {
    if (key.startsWith('data:') || key.startsWith('blob:')) {
      const img = await decodeImageFromSrc(key);
      if (img) loadedImageCache.set(key, img);
      return img;
    }

    // 命中 IndexedDB 缓存（base64）时无需走网络，直接解码，不占用并发名额
    try {
      const cachedDataUrl = await getCachedMediaUrl(key);
      if (cachedDataUrl !== key) {
        const cachedImg = await decodeImageFromSrc(cachedDataUrl);
        if (cachedImg) {
          loadedImageCache.set(key, cachedImg);
          loadedImageCache.set(cachedDataUrl, cachedImg);
          return cachedImg;
        }
      }
    } catch { /* 忽略缓存读取异常，继续走网络 */ }

    // 网络加载统一限制并发，避免一次性发起过多请求导致后续图片卡住
    await acquireNetworkSlot();
    try {
      const dataUrl = await cacheMediaUrl(key);
      let img = await decodeImageFromSrc(dataUrl);
      if (img) {
        loadedImageCache.set(key, img);
        if (dataUrl !== key) loadedImageCache.set(dataUrl, img);
        return img;
      }

      // 带跨域属性解码失败时，回退到不带 crossOrigin 再试一次，
      // 保证不支持 CORS 的图片服务器也能正常显示。
      img = await decodeImageFromSrc(key, false);
      if (img) loadedImageCache.set(key, img);
      return img;
    } catch (err) {
      console.warn('[mediaCache] loadMediaImage failed:', key, err);
      const img = await decodeImageFromSrc(key, false);
      if (img) loadedImageCache.set(key, img);
      return img;
    } finally {
      releaseNetworkSlot();
    }
  })();

  inFlightImageLoads.set(key, task);
  try {
    return await task;
  } finally {
    inFlightImageLoads.delete(key);
  }
};

export const cleanExpiredCache = async (): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (!cursor) return;
      if (Date.now() - cursor.value.cachedAt > CACHE_TTL_MS) {
        cursor.delete();
      }
      cursor.continue();
    };
  } catch { /* ignore */ }
};
