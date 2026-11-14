// 서비스 대표 주소 — QR · 공유 미리보기에 쓴다.
// NEXT_PUBLIC_SITE_URL을 비워 두면(로컬 개발) 지금 접속한 주소를 쓴다. 배포 환경에는 https://huddling.link 를 넣는다
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

/** QR 스캔에서 우리 서비스 주소로 인정하는 호스트 (예전 임시 주소 포함) */
export const KNOWN_HOSTS = ['huddling.link', 'www.huddling.link', 'huddling-14team.vercel.app'];
