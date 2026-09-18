const CONTACT_PATH = '/api/contact';
const MAX_BODY_BYTES = 16_384;
const TURNSTILE_ACTION = 'contact';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const contactTypes = {
  'gop-y-noi-dung': 'Góp ý nội dung',
  'bao-loi-cap-nhat': 'Báo lỗi hoặc thông tin cần cập nhật',
  'hop-tac': 'Đề nghị hợp tác',
  khac: 'Nội dung khác',
} as const;

type ContactType = keyof typeof contactTypes;

interface ContactPayload {
  name: string;
  email: string;
  type: ContactType;
  message: string;
  website: string;
  turnstileToken: string;
}

interface TurnstileResult {
  success?: boolean;
  hostname?: string;
  action?: string;
}

function json(data: Record<string, unknown>, status = 200, headers?: HeadersInit): Response {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

function normalizedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isContactType(value: string): value is ContactType {
  return Object.hasOwn(contactTypes, value);
}

function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
}

function parsePayload(value: unknown): ContactPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const input = value as Record<string, unknown>;
  const name = normalizedString(input.name);
  const email = normalizedString(input.email).toLowerCase();
  const type = normalizedString(input.type);
  const message = normalizedString(input.message);
  const website = normalizedString(input.website);
  const turnstileToken = normalizedString(input.turnstileToken);

  if (
    name.length < 2 ||
    name.length > 80 ||
    !isValidEmail(email) ||
    !isContactType(type) ||
    message.length < 20 ||
    message.length > 5_000 ||
    website.length > 0 ||
    turnstileToken.length < 1 ||
    turnstileToken.length > 2_048
  ) {
    return null;
  }

  return { name, email, type, message, website, turnstileToken };
}

function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return false;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get('Content-Length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new RangeError('Request body is too large');
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    throw new RangeError('Request body is too large');
  }

  return JSON.parse(rawBody) as unknown;
}

async function verifyTurnstile(payload: ContactPayload, request: Request, env: Env): Promise<boolean> {
  const body = new FormData();
  body.set('secret', env.TURNSTILE_SECRET);
  body.set('response', payload.turnstileToken);

  const remoteIp = request.headers.get('CF-Connecting-IP');
  if (remoteIp) body.set('remoteip', remoteIp);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body,
      signal: controller.signal,
    });
    if (!response.ok) return false;

    const result = await response.json<TurnstileResult>();
    const requestHostname = new URL(request.url).hostname.toLowerCase();
    const allowedHostnames = new Set(
      env.TURNSTILE_HOSTNAMES.split(',').map((hostname) => hostname.trim().toLowerCase()).filter(Boolean),
    );
    const resultHostname = result.hostname?.toLowerCase();

    return (
      result.success === true &&
      result.action === TURNSTILE_ACTION &&
      resultHostname === requestHostname &&
      allowedHostnames.has(resultHostname)
    );
  } catch (error) {
    console.warn('Turnstile verification failed', {
      reason: error instanceof Error ? error.name : 'UnknownError',
    });
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/gu, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character] ?? character;
  });
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return json(
      { ok: false, message: 'Phương thức không được hỗ trợ.' },
      405,
      { Allow: 'POST' },
    );
  }

  if (!hasSameOrigin(request)) {
    return json({ ok: false, message: 'Yêu cầu không hợp lệ.' }, 403);
  }

  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    return json({ ok: false, message: 'Định dạng dữ liệu không được hỗ trợ.' }, 415);
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    const status = error instanceof RangeError ? 413 : 400;
    return json({ ok: false, message: 'Dữ liệu gửi lên không hợp lệ.' }, status);
  }

  const payload = parsePayload(body);
  if (!payload) {
    return json({ ok: false, message: 'Vui lòng kiểm tra lại các trường trong biểu mẫu.' }, 400);
  }

  if (!(await verifyTurnstile(payload, request, env))) {
    return json({ ok: false, message: 'Không thể xác minh bạn là người dùng thật. Vui lòng thử lại.' }, 403);
  }

  const typeLabel = contactTypes[payload.type];
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeType = escapeHtml(typeLabel);
  const safeMessage = escapeHtml(payload.message).replace(/\r?\n/gu, '<br />');

  try {
    await env.EMAIL.send({
      to: env.CONTACT_RECIPIENT,
      from: { email: env.CONTACT_SENDER, name: 'Cẩm nang sinh viên' },
      replyTo: { email: payload.email, name: payload.name },
      subject: `[Liên hệ] ${typeLabel}`,
      text: [
        `Họ tên: ${payload.name}`,
        `Email: ${payload.email}`,
        `Loại liên hệ: ${typeLabel}`,
        '',
        payload.message,
      ].join('\n'),
      html: `<h2>Liên hệ mới từ website</h2><p><strong>Họ tên:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Loại liên hệ:</strong> ${safeType}</p><hr /><p>${safeMessage}</p>`,
    });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'unknown';
    console.error('Contact email delivery failed', { code });
    return json({ ok: false, message: 'Chưa thể gửi liên hệ lúc này. Vui lòng thử lại sau.' }, 502);
  }

  return json({ ok: true, message: 'Đã gửi liên hệ. Cảm ơn bạn đã góp ý!' });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === CONTACT_PATH) return handleContact(request, env);
    if (url.pathname.startsWith('/api/')) {
      return json({ ok: false, message: 'Không tìm thấy API.' }, 404);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
