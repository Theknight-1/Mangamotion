export function verifyEmailTemplate(url: string) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f7f7f7;padding:32px;">
      <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #eee;">

        <h2 style="margin:0;color:#3a7033;">
          Welcome to MotionRecap 👋
        </h2>

        <p style="margin:20px 0;color:#555;line-height:1.6;">
          Please verify your email address to complete your registration.
        </p>

        <div style="text-align:center;margin:32px 0;">
          <a
            href="${url}"
            style="
              display:inline-block;
              background:#c9a84c;
              color:#0c170c;
              text-decoration:none;
              padding:14px 28px;
              border-radius:8px;
              font-weight:600;
            "
          >
            Verify Email
          </a>
        </div>

        <p style="font-size:14px;color:#777;">
          Or copy this link into your browser:
        </p>

        <p style="font-size:13px;color:#3a7033;word-break:break-all;">
          ${url}
        </p>

      </div>
    </div>
  `;
}
