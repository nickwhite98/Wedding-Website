import { Resend } from 'resend';

interface GuestConfirmationParams {
  to: string;
  invitationId: number;
  editToken: string;
  attendingNames: string[];
  notAttendingNames: string[];
  deadlineDisplay: string;
}

interface AdminNotificationParams {
  invitationId: number;
  submitterEmail: string;
  attendingNames: string[];
  notAttendingNames: string[];
  plusOneName?: string;
  stayingAtHotel?: boolean | null;
  usingShuttle?: boolean | null;
  isEdit: boolean;
}

const SENDER_NAME = 'Kathryn & Nicholas';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlList(names: string[]): string {
  return names.map(escapeHtml).join('<br>');
}

function textList(names: string[]): string {
  return names.map((n) => `  - ${n}`).join('\n');
}

class EmailService {
  private resend: Resend | null = null;
  private cachedKey: string | null = null;

  private get client(): Resend | null {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key || key.toLowerCase().startsWith('placeholder')) return null;
    if (this.cachedKey !== key) {
      this.resend = new Resend(key);
      this.cachedKey = key;
    }
    return this.resend;
  }

  private from(): string {
    const address = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    return `${SENDER_NAME} <${address}>`;
  }

  private replyTo(): string | undefined {
    return process.env.RSVP_NOTIFICATION_EMAIL || undefined;
  }

  private notificationCc(): string[] {
    return (process.env.RSVP_NOTIFICATION_CC ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private editUrl(token: string): string {
    const base = process.env.APP_URL || 'http://localhost:5173';
    return `${base}/rsvp/edit?token=${encodeURIComponent(token)}`;
  }

  async sendGuestConfirmation(params: GuestConfirmationParams): Promise<void> {
    const editLink = this.editUrl(params.editToken);
    const hasAnyAttending = params.attendingNames.length > 0;
    const headline = hasAnyAttending
      ? "We can't wait to celebrate with you!"
      : 'Thank you for your RSVP!';

    const text = [
      headline,
      '',
      "We've received your response. Here's what you submitted:",
      '',
      params.attendingNames.length ? `Attending:\n${textList(params.attendingNames)}` : '',
      params.notAttendingNames.length
        ? `Unable to attend:\n${textList(params.notAttendingNames)}`
        : '',
      '',
      `If anything changes, you can update your RSVP any time before ${params.deadlineDisplay}.`,
      '',
      'Edit your RSVP:',
      editLink,
      '',
      'IMPORTANT: please save this email or bookmark the link above. You will need it if you want to update your RSVP later.',
      '',
      'Kathryn & Nicholas',
    ]
      .filter((line) => line !== null && line !== undefined)
      .join('\n');

    const attendingHtml = params.attendingNames.length
      ? `<p style="margin: 0 0 12px;"><strong>Attending:</strong><br>${htmlList(params.attendingNames)}</p>`
      : '';
    const notAttendingHtml = params.notAttendingNames.length
      ? `<p style="margin: 0 0 12px;"><strong>Unable to attend:</strong><br>${htmlList(params.notAttendingNames)}</p>`
      : '';

    const html = `<!doctype html>
<html>
<body style="font-family: Georgia, 'Times New Roman', serif; color: #222; line-height: 1.5; max-width: 560px; margin: 0; padding: 16px;">
<p style="margin: 0 0 16px;">${escapeHtml(headline)}</p>
<p style="margin: 0 0 16px;">We've received your response. Here's what you submitted:</p>
${attendingHtml}
${notAttendingHtml}
<p style="margin: 16px 0;">If anything changes, you can update your RSVP any time before <strong>${escapeHtml(params.deadlineDisplay)}</strong>:</p>
<p style="margin: 16px 0;"><a href="${editLink}">${editLink}</a></p>
<p style="margin: 16px 0; color: #555;"><strong>Please save this email</strong> or bookmark the link above. You will need it if you want to update your RSVP later.</p>
<p style="margin: 24px 0 0; color: #555;">Kathryn &amp; Nicholas</p>
</body>
</html>`;

    if (!this.client) {
      console.log('[email] Resend not configured. Guest confirmation would send to:', params.to);
      console.log('[email] Edit link:', editLink);
      return;
    }

    const result = await this.client.emails.send({
      from: this.from(),
      to: params.to,
      replyTo: this.replyTo(),
      subject: "Kathryn and Nick's Wedding - RSVP Confirmation",
      text,
      html,
    });

    if (result.error) {
      console.error('[email] Resend error sending guest confirmation:', result.error);
      throw new Error(`Failed to send confirmation: ${result.error.message}`);
    }
  }

  async sendAdminNotification(params: AdminNotificationParams): Promise<void> {
    const adminEmail = process.env.RSVP_NOTIFICATION_EMAIL;
    if (!adminEmail) {
      console.log('[email] RSVP_NOTIFICATION_EMAIL not set, skipping admin notification');
      return;
    }
    const cc = this.notificationCc();

    const verb = params.isEdit ? 'updated their' : 'submitted an';
    const attendingCount = params.attendingNames.length;
    const notAttendingCount = params.notAttendingNames.length;
    const hotelAnswer =
      params.stayingAtHotel == null ? 'No answer' : params.stayingAtHotel ? 'Yes' : 'No';
    const shuttleAnswer =
      params.usingShuttle == null ? 'No answer' : params.usingShuttle ? 'Yes' : 'No';

    const text = [
      `Invitation #${params.invitationId} ${verb} RSVP.`,
      '',
      `Submitter: ${params.submitterEmail}`,
      `Counts: ${attendingCount} attending, ${notAttendingCount} not attending`,
      '',
      params.attendingNames.length ? `Attending:\n${textList(params.attendingNames)}` : '',
      params.notAttendingNames.length
        ? `Not attending:\n${textList(params.notAttendingNames)}`
        : '',
      params.plusOneName ? `Plus-one: ${params.plusOneName}` : '',
      `Staying at the hotel: ${hotelAnswer}`,
      params.stayingAtHotel ? `Using taxi shuttle: ${shuttleAnswer}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const htmlLines = [
      `<p>Invitation #${params.invitationId} ${verb} RSVP.</p>`,
      `<p><strong>Submitter:</strong> ${escapeHtml(params.submitterEmail)}</p>`,
      `<p><strong>Counts:</strong> ${attendingCount} attending, ${notAttendingCount} not attending</p>`,
      params.attendingNames.length
        ? `<p><strong>Attending:</strong><br>${htmlList(params.attendingNames)}</p>`
        : '',
      params.notAttendingNames.length
        ? `<p><strong>Not attending:</strong><br>${htmlList(params.notAttendingNames)}</p>`
        : '',
      params.plusOneName
        ? `<p><strong>Plus-one:</strong> ${escapeHtml(params.plusOneName)}</p>`
        : '',
      `<p><strong>Staying at the hotel:</strong> ${hotelAnswer}</p>`,
      params.stayingAtHotel
        ? `<p><strong>Using taxi shuttle:</strong> ${shuttleAnswer}</p>`
        : '',
    ];

    if (!this.client) {
      console.log('[email] Resend not configured. Admin notification would send to:', adminEmail);
      if (cc.length) console.log('[email] CC:', cc.join(', '));
      console.log('[email] Content:', text);
      return;
    }

    const result = await this.client.emails.send({
      from: this.from(),
      to: adminEmail,
      cc: cc.length ? cc : undefined,
      replyTo: this.replyTo(),
      subject: `RSVP ${params.isEdit ? 'updated' : 'received'} for invitation #${params.invitationId}`,
      text,
      html: `<div style="font-family: sans-serif; max-width: 600px;">${htmlLines.join('')}</div>`,
    });

    if (result.error) {
      console.error('[email] Resend error sending admin notification:', result.error);
      throw new Error(`Failed to send admin notification: ${result.error.message}`);
    }
  }
}

export default new EmailService();
