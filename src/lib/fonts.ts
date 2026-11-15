/** 시안 글꼴 (07): Pretendard — 필요한 글자 범위만 나눠 받는 웹폰트 스타일시트 */
export const PRETENDARD_CSS =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';

/**
 * 위 파일의 무결성 값(sha384). 다른 회사 서버(jsDelivr)에서 받는 파일이라, 내용이 바뀌면 브라우저가 불러오지 않게 한다.
 * 글꼴 버전을 올리면 이 값도 다시 계산한다: curl -s <주소> | openssl dgst -sha384 -binary | openssl base64 -A
 */
export const PRETENDARD_CSS_INTEGRITY = 'sha384-GIdEBaqGN9mNkDkMkzMHW8EKUqtpPIe/sLj1X7DIrnc9uPtLROJgmuDlh+3rBw0j';
