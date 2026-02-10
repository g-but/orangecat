/**
 * Task Email Templates
 *
 * Email templates for task-related notifications.
 * Ready for future email service connection.
 *
 * Each template returns:
 * - subject: Email subject line
 * - html: HTML email body
 * - text: Plain text email body (for email clients that don't support HTML)
 *
 * Created: 2026-02-05
 */

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Email template when someone flags a task as needing attention
 */
export function taskAttentionNotification(
  taskTitle: string,
  flaggedBy: string,
  message: string | null,
  taskUrl: string
): EmailContent {
  const subject = `Task needs attention: ${taskTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .task-title { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px; }
    .message-box { background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 16px 0; }
    .button { display: inline-block; background: #0ABAB5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Task needs attention</h1>
    </div>
    <div class="content">
      <p class="task-title">${taskTitle}</p>
      <p><strong>${flaggedBy}</strong> has flagged this task as urgent.</p>
      ${message ? `<div class="message-box"><p>${message}</p></div>` : ''}
      <p style="margin-top: 24px;">
        <a href="${taskUrl}" class="button">View task</a>
      </p>
    </div>
    <div class="footer">
      <p>This email was sent automatically by OrangeCat.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Task needs attention: ${taskTitle}

${flaggedBy} has flagged this task as urgent.
${message ? `\nMessage: ${message}\n` : ''}
View task: ${taskUrl}

--
This email was sent automatically by OrangeCat.
  `.trim();

  return { subject, html, text };
}

/**
 * Email template for a direct task request to a specific user
 */
export function taskRequestNotification(
  taskTitle: string,
  requestedBy: string,
  message: string | null,
  taskUrl: string
): EmailContent {
  const subject = `Task request: ${taskTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .task-title { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px; }
    .message-box { background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0; }
    .button { display: inline-block; background: #0ABAB5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Task request</h1>
    </div>
    <div class="content">
      <p class="task-title">${taskTitle}</p>
      <p><strong>${requestedBy}</strong> is asking you to complete this task.</p>
      ${message ? `<div class="message-box"><p>${message}</p></div>` : ''}
      <p style="margin-top: 24px;">
        <a href="${taskUrl}" class="button">View task</a>
      </p>
    </div>
    <div class="footer">
      <p>This email was sent automatically by OrangeCat.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Task request: ${taskTitle}

${requestedBy} is asking you to complete this task.
${message ? `\nMessage: ${message}\n` : ''}
View task: ${taskUrl}

--
This email was sent automatically by OrangeCat.
  `.trim();

  return { subject, html, text };
}

/**
 * Email template for a broadcast task request to all team members
 */
export function taskBroadcastRequestNotification(
  taskTitle: string,
  requestedBy: string,
  message: string | null,
  taskUrl: string
): EmailContent {
  const subject = `Team task request: ${taskTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .task-title { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px; }
    .message-box { background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin: 16px 0; }
    .broadcast-badge { display: inline-block; background: #f3e8ff; color: #7c3aed; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
    .button { display: inline-block; background: #0ABAB5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📢 Team task request</h1>
    </div>
    <div class="content">
      <span class="broadcast-badge">To all team members</span>
      <p class="task-title">${taskTitle}</p>
      <p><strong>${requestedBy}</strong> is asking the team to complete this task.</p>
      ${message ? `<div class="message-box"><p>${message}</p></div>` : ''}
      <p style="margin-top: 24px;">
        <a href="${taskUrl}" class="button">View task</a>
      </p>
    </div>
    <div class="footer">
      <p>This email was sent automatically by OrangeCat.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Team task request: ${taskTitle}

To all team members

${requestedBy} is asking the team to complete this task.
${message ? `\nMessage: ${message}\n` : ''}
View task: ${taskUrl}

--
This email was sent automatically by OrangeCat.
  `.trim();

  return { subject, html, text };
}

/**
 * Email template when a new task is created
 */
export function newTaskNotification(
  taskTitle: string,
  createdBy: string,
  category: string,
  taskUrl: string
): EmailContent {
  const subject = `New task: ${taskTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .task-title { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px; }
    .category-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; }
    .button { display: inline-block; background: #0ABAB5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ New task</h1>
    </div>
    <div class="content">
      <p class="task-title">${taskTitle}</p>
      <p><strong>${createdBy}</strong> has created a new task.</p>
      <p><span class="category-badge">${category}</span></p>
      <p style="margin-top: 24px;">
        <a href="${taskUrl}" class="button">View task</a>
      </p>
    </div>
    <div class="footer">
      <p>This email was sent automatically by OrangeCat.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
New task: ${taskTitle}

${createdBy} has created a new task.
Category: ${category}

View task: ${taskUrl}

--
This email was sent automatically by OrangeCat.
  `.trim();

  return { subject, html, text };
}

/**
 * Email template when a task is completed
 */
export function taskCompletedNotification(
  taskTitle: string,
  completedBy: string,
  notes: string | null,
  taskUrl: string
): EmailContent {
  const subject = `Task completed: ${taskTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .task-title { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px; }
    .message-box { background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 16px 0; }
    .button { display: inline-block; background: #0ABAB5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Task completed</h1>
    </div>
    <div class="content">
      <p class="task-title">${taskTitle}</p>
      <p><strong>${completedBy}</strong> has completed this task.</p>
      ${notes ? `<div class="message-box"><p><strong>Notes:</strong> ${notes}</p></div>` : ''}
      <p style="margin-top: 24px;">
        <a href="${taskUrl}" class="button">View details</a>
      </p>
    </div>
    <div class="footer">
      <p>This email was sent automatically by OrangeCat.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Task completed: ${taskTitle}

${completedBy} has completed this task.
${notes ? `\nNotes: ${notes}\n` : ''}
View details: ${taskUrl}

--
This email was sent automatically by OrangeCat.
  `.trim();

  return { subject, html, text };
}
