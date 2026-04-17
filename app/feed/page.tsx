import { redirect } from 'next/navigation';

// MVP: Feed는 People로 통합. 기존 /feed URL 직접 접속 시 /people로 리다이렉트.
// Feed 코드는 git history에서 복원 가능.
export default function FeedPage() {
  redirect('/people');
}
