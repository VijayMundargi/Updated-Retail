
'use server';

import type { Product } from './types';
import { APP_TITLE } from './constants';

/**
 * Simulates sending a low stock email notification.
 * In a real application, this function would use an email sending service/library.
 * @param adminEmail The email address of the admin to notify.
 * @param product The product that is low in stock.
 * @param storeName The name of the store, defaults to APP_TITLE.
 */
export async function sendLowStockEmailNotification(
  adminEmail: string,
  product: Pick<Product, 'name' | 'stock' | 'id'>,
  storeName: string = APP_TITLE
): Promise<void> {
  if (!adminEmail) {
    console.warn(
      `Low Stock Notification: Admin email not configured. Skipping email for product: ${product.name} (ID: ${product.id}, Stock: ${product.stock}).`
    );
    return;
  }

  const subject = `Low Stock Alert: ${product.name} at ${storeName}`;
  const body = `
    <p>Hello Admin,</p>
    <p>This is an automated alert to inform you that the stock for the product "<strong>${product.name}</strong>" (ID: ${product.id}) is running low.</p>
    <p>Current Stock: <strong>${product.stock}</strong></p>
    <p>Please take necessary action to restock this item.</p>
    <p>Thank you,</p>
    <p>Your ${storeName} System</p>
  `;

  // Simulate email sending by logging to console
  console.log("--- SIMULATING LOW STOCK EMAIL SEND ---");
  console.log(`To: ${adminEmail}`);
  console.log(`Subject: ${subject}`);
  // Basic console-friendly version of the body:
  const textBody = body
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n')
    .replace(/<strong>/g, '')
    .replace(/<\/strong>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  console.log(`Body:\n${textBody}`);
  console.log("--- END SIMULATING LOW STOCK EMAIL SEND ---");

  // In a real implementation, you would integrate an email library here:
  // e.g., using Nodemailer, SendGrid, AWS SES, etc.
  // try {
  //   // const transporter = nodemailer.createTransport({ /* your_smtp_config */ });
  //   // await transporter.sendMail({
  //   //   from: `"${storeName} Alerts" <no-reply@yourdomain.com>`,
  //   //   to: adminEmail,
  //   //   subject: subject,
  //   //   html: body,
  //   // });
  //   // console.log(`Low stock email notification for ${product.name} 'sent' to ${adminEmail}.`);
  // } catch (error) {
  //   console.error(`Failed to send low stock email for ${product.name} to ${adminEmail}:`, error);
  // }
}
