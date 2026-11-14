import { generateText, Output } from 'ai';
import { z } from 'zod';
import { allowAttempt, readJson, requesterAddress } from '@/lib/account-http';
import { handle, HttpError, ok } from '@/lib/http';

// 명함 사진에서 이름 · 직무 · 근무 지역 후보를 읽는다 (등록 화면의 '명함으로 등록').
// 사진은 읽기에만 쓰고 저장하지 않는다. 결과는 본인이 확인 · 수정한 뒤에만 저장된다.
// Vercel AI Gateway — 배포 환경에서는 OIDC로 자동 인증, 로컬은 `vercel env pull`의 VERCEL_OIDC_TOKEN
export const maxDuration = 30;

const MODEL = 'anthropic/claude-haiku-5.5';
const MAX_BYTES = 1_500_000;
const DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;
const ROLES = ['디자이너', '기획자', '마케터', '개발자'] as const;
const REGIONS = ['강남', '판교', '서초', '여의도', '성수', '기타'] as const;

const schema = z.object({
  isBusinessCard: z.boolean().describe('사진이 명함이면 true'),
  displayName: z.string().describe('사람 이름(한글 이름이 있으면 한글). 모르면 빈 문자열'),
  jobTitle: z.string().describe('명함에 적힌 직함·직무 원문. 모르면 빈 문자열'),
  role: z.enum([...ROLES, '']).describe('직함을 보고 가장 가까운 직무. 애매하면 빈 문자열'),
  region: z.enum([...REGIONS, '']).describe('회사 주소가 이 지역에 있으면 그 값, 다른 지역이면 기타, 주소가 없으면 빈 문자열'),
});

export function POST(request: Request) {
  return handle(async () => {
    // 등록 화면에서 '명함으로 등록'을 꺼 둔 동안에는 주소로 직접 불러도 동작하지 않는다 (요금이 드는 기능)
    if (process.env.OCR_ENABLED !== '1') throw new HttpError(404, '지금은 명함 읽기를 쓸 수 없어요. 직접 입력해 주세요.');
    const input = await readJson(request);
    const match = typeof input?.image === 'string' ? DATA_URL.exec(input.image) : null;
    if (!match) throw new HttpError(400, '명함 사진을 확인해 주세요.');
    const data = match[1];
    if (Math.floor((data.length * 3) / 4) > MAX_BYTES) throw new HttpError(413, '사진이 너무 커요. 다시 찍어 주세요.');
    if (!(await allowAttempt(`ocr:${requesterAddress(request)}`, 30))) {
      throw new HttpError(429, '요청이 많아요. 잠시 후 다시 시도해 주세요.');
    }

    let output: z.infer<typeof schema>;
    try {
      const result = await generateText({
        model: MODEL,
        output: Output.object({ schema }),
        maxOutputTokens: 400,
        abortSignal: AbortSignal.timeout(20_000),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'file', mediaType: 'image/jpeg', data },
              {
                type: 'text',
                text:
                  '한국 명함 사진입니다. 적힌 내용만 읽고 추측하지 마세요.\n' +
                  `- 직무는 ${ROLES.join(', ')} 중 하나로 고르세요. 디자인/UX/UI→디자이너, PM/PO/기획/서비스기획→기획자, 마케팅/그로스/브랜드→마케터, 개발/엔지니어/Engineer/Developer→개발자. 해당 없으면 빈 문자열.\n` +
                  `- 근무 지역은 회사 주소로 판단해 ${REGIONS.join(', ')} 중 하나(강남구 역삼·삼성·논현 등→강남, 성남 분당 판교→판교, 서초구→서초, 영등포 여의도→여의도, 성동구 성수→성수, 그 밖의 주소→기타).`,
              },
            ],
          },
        ],
      });
      output = result.output;
    } catch (error) {
      console.error('[ocr]', error instanceof Error ? error.message : error);
      throw new HttpError(503, '명함을 읽지 못했어요. 직접 입력해 주세요.');
    }
    if (!output.isBusinessCard) throw new HttpError(422, '명함이 잘 보이지 않아요. 밝은 곳에서 다시 찍어 주세요.');
    return ok({
      displayName: output.displayName.trim().slice(0, 40),
      jobTitle: output.jobTitle.trim().slice(0, 60),
      role: output.role || undefined,
      region: output.region || undefined,
    });
  });
}
