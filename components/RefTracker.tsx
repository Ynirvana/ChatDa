'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { track } from '@/lib/analytics';

/**
 * 랜딩 페이지 방문 시 `?ref=X` / utm_* 쿼리 파라미터를 포착한다.
 * - `ref` → `chatda_ref` 쿠키(30일) 저장 + GA4 `referral_visit` 이벤트
 * - `utm_source/medium/campaign` → GA4 자동 캡처(gtag linker)와 중복되지만
 *   커스텀 이벤트에도 같이 붙여서 Looker/Sheets 분석 편하게.
 *
 * V2(예정): 나중에 invite 쿠키 set할 때 이 `chatda_ref` 쿠키를 읽어서
 * `invite_tokens.referred_via_user_id`에 기록 → admin 대시보드에서
 * "이 가입은 Alex 링크에서 왔음" 표시.
 */
export function RefTracker() {
  const params = useSearchParams();

  useEffect(() => {
    const ref = params.get('ref');
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');

    if (!ref && !utmSource && !utmMedium && !utmCampaign) return;

    if (ref) {
      // 30일 쿠키. SameSite=Lax로 기본 보수 설정.
      document.cookie = `chatda_ref=${encodeURIComponent(ref)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }

    track('referral_visit', {
      ref_id: ref ?? undefined,
      utm_source: utmSource ?? undefined,
      utm_medium: utmMedium ?? undefined,
      utm_campaign: utmCampaign ?? undefined,
    });
  }, [params]);

  return null;
}
