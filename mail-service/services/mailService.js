const fs = require('fs');
const path = require('path');
const { createTransporter } = require('../config/email.config');
const logger = require('../utils/logger');

class MailService {
  constructor() {
    this.transporter = createTransporter();
    this.templateCache = new Map();
  }

  // Load and cache email template
  loadTemplate(templateName) {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    try {
      const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
      const template = fs.readFileSync(templatePath, 'utf8');
      this.templateCache.set(templateName, template);
      return template;
    } catch (error) {
      logger.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  // Replace placeholders in template
  replaceTemplatePlaceholders(template, data) {
    let result = template;
    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, data[key] || '');
    });
    return result;
  }

  // Format duration helper
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  }

  // Send test invitation email
  async sendTestInvitation(candidate, testData) {
    try {
      const template = this.loadTemplate('testInvitation');

      const emailData = {
        candidateName: candidate.name || 'Candidate',
        companyName: process.env.COMPANY_NAME || 'Our Company',
        testLink: testData.testLink,
        testDuration: this.formatDuration(testData.testDuration),
        totalQuestions: testData.totalQuestions,
        companyWebsite: process.env.COMPANY_WEBSITE || '#',
        currentYear: new Date().getFullYear()
      };

      const htmlContent = this.replaceTemplatePlaceholders(template, emailData);

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'HR Team',
          address: process.env.EMAIL_FROM
        },
        to: candidate.email,
        subject: `Test Invitation - ${process.env.COMPANY_NAME || 'Our Company'}`,
        html: htmlContent,
        text: `
Hi ${candidate.name || 'Candidate'},

You have been invited to take a technical assessment test.

Test Details:
- Duration: ${this.formatDuration(testData.testDuration)}
- Number of Questions: ${testData.totalQuestions}
- Test Link: ${testData.testLink}

Please complete the test at your earliest convenience.

Best regards,
${process.env.COMPANY_NAME || 'Our Company'} HR Team
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${candidate.email}`, { messageId: result.messageId });

      return {
        success: true,
        messageId: result.messageId,
        email: candidate.email
      };
    } catch (error) {
      logger.error(`Failed to send email to ${candidate.email}:`, error);
      return {
        success: false,
        error: error.message,
        email: candidate.email
      };
    }
  }

  // Send bulk test invitations
  async sendBulkTestInvitations(candidates, testData) {
    const results = [];
    const batchSize = 5; // Send emails in batches to avoid rate limiting

    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);
      const batchPromises = batch.map(candidate =>
        this.sendTestInvitation(candidate, testData)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason.message,
            email: batch[index].email
          });
        }
      });

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < candidates.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

module.exports = new MailService();