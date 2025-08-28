const express = require('express');
const mailService = require('../services/mailService');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateTestInvitation = (req, res, next) => {
  const { candidates, testLink, testDuration, totalQuestions } = req.body;

  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({
      error: 'Candidates array is required and must not be empty'
    });
  }

  if (!testLink || typeof testLink !== 'string') {
    return res.status(400).json({
      error: 'Test link is required and must be a string'
    });
  }

  if (!testDuration || typeof testDuration !== 'number') {
    return res.status(400).json({
      error: 'Test duration is required and must be a number'
    });
  }

  if (!totalQuestions || typeof totalQuestions !== 'number') {
    return res.status(400).json({
      error: 'Total questions is required and must be a number'
    });
  }

  // Validate each candidate
  for (const candidate of candidates) {
    if (!candidate.email || typeof candidate.email !== 'string') {
      return res.status(400).json({
        error: 'Each candidate must have a valid email address'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(candidate.email)) {
      return res.status(400).json({
        error: `Invalid email format: ${candidate.email}`
      });
    }
  }

  next();
};

// Send test invitation to multiple candidates
router.post('/send-test-invitation', validateTestInvitation, async (req, res) => {
  try {
    const { candidates, testLink, testDuration, totalQuestions } = req.body;

    logger.info(`Sending test invitations to ${candidates.length} candidates`);

    const testData = {
      testLink,
      testDuration,
      totalQuestions
    };

    const results = await mailService.sendBulkTestInvitations(candidates, testData);

    const successCount = results.filter(result => result.success).length;
    const failureCount = results.filter(result => !result.success).length;

    const responseData = {
      message: `Email sending completed`,
      summary: {
        total: candidates.length,
        successful: successCount,
        failed: failureCount
      },
      results: results
    };

    if (failureCount > 0) {
      logger.warn(`${failureCount} emails failed to send out of ${candidates.length}`);
      return res.status(207).json(responseData); // 207 Multi-Status
    }

    logger.info(`All ${successCount} emails sent successfully`);
    res.status(200).json(responseData);

  } catch (error) {
    logger.error('Error in send-test-invitation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to send test invitations'
    });
  }
});

// Send test invitation to a single candidate
router.post('/send-single-invitation', async (req, res) => {
  try {
    const { candidate, testLink, testDuration, totalQuestions } = req.body;

    if (!candidate || !candidate.email) {
      return res.status(400).json({
        error: 'Candidate with email is required'
      });
    }

    if (!testLink || !testDuration || !totalQuestions) {
      return res.status(400).json({
        error: 'Test link, duration, and total questions are required'
      });
    }

    const testData = {
      testLink,
      testDuration,
      totalQuestions
    };

    const result = await mailService.sendTestInvitation(candidate, testData);

    if (result.success) {
      logger.info(`Single email sent successfully to ${candidate.email}`);
      res.status(200).json({
        message: 'Test invitation sent successfully',
        result: result
      });
    } else {
      logger.error(`Failed to send single email to ${candidate.email}`);
      res.status(500).json({
        error: 'Failed to send test invitation',
        result: result
      });
    }

  } catch (error) {
    logger.error('Error in send-single-invitation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to send test invitation'
    });
  }
});

// Health check for mail service
router.get('/mail-health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Mail Service',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/send-test-invitation',
      'POST /api/send-single-invitation',
      'GET /api/mail-health'
    ]
  });
});

module.exports = router;