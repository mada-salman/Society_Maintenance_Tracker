const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Email setup (Ethereal fake SMTP for testing)
async function sendEmailNotification(to, subject, text) {
  try {
    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    await transporter.sendMail({
      from: '"Maintenance Admin" <admin@society.com>',
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Get all notices
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: [
        { isImportant: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    res.json(notices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Create notice
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, content, isImportant } = req.body;

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        isImportant: isImportant || false,
      }
    });

    if (isImportant) {
      // Send email to all residents
      const residents = await prisma.user.findMany({ where: { role: 'RESIDENT' } });
      const emails = residents.map(r => r.email).join(',');
      if (emails) {
        sendEmailNotification(emails, `IMPORTANT NOTICE: ${title}`, content);
      }
    }

    res.status(201).json(notice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
