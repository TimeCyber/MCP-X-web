import { useEffect, useRef } from 'react';

const AD_CLIENT = 'ca-pub-8710877676213538';

/** 确保 AdSense 脚本只加载一次 */
function loadAdSenseScript() {
  if (document.getElementById('google-adsense-script')) return;
  const script = document.createElement('script');
  script.id = 'google-adsense-script';
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

/**
 * Google AdSense 信息流广告组件（fluid 格式）。
 * 只在使用该组件的页面加载脚本并展示广告。
 *
 * 用法：
 * ```tsx
 * <GoogleAd />
 * ```
 */
export function GoogleAd({ className = '' }: { className?: string }) {
  const pushed = useRef(false);

  useEffect(() => {
    loadAdSenseScript();

    if (pushed.current) return;

    const push = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        pushed.current = true;
      } catch (e) {
        console.warn('AdSense push failed:', e);
      }
    };

    const existing = document.getElementById('google-adsense-script') as HTMLScriptElement | null;
    if (existing?.dataset.loaded) {
      push();
    } else if (existing) {
      existing.addEventListener('load', () => {
        existing.dataset.loaded = '1';
        push();
      });
    }
  }, []);

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-format="fluid"
        data-ad-layout-key="-6t+ed+2i-1n-4w"
        data-ad-client={AD_CLIENT}
        data-ad-slot="5565319078"
      />
    </div>
  );
}

/**
 * Google AdSense 底部 Banner 广告组件（auto 格式，全宽响应式）。
 *
 * 用法：
 * ```tsx
 * <GoogleAdBanner />
 * ```
 */
export function GoogleAdBanner({ className = '' }: { className?: string }) {
  const pushed = useRef(false);

  useEffect(() => {
    loadAdSenseScript();

    if (pushed.current) return;

    const push = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        pushed.current = true;
      } catch (e) {
        console.warn('AdSense push failed:', e);
      }
    };

    const existing = document.getElementById('google-adsense-script') as HTMLScriptElement | null;
    if (existing?.dataset.loaded) {
      push();
    } else if (existing) {
      existing.addEventListener('load', () => {
        existing.dataset.loaded = '1';
        push();
      });
    }
  }, []);

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot="5525219802"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
