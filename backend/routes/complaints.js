const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

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

    let info = await transporter.sendMail({
      from: '"Maintenance Admin" <admin@society.com>',
      to,
      subject,
      text,
    });
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// 1. Resident: Create a complaint
router.post('/', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const { category, description } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const complaint = await prisma.complaint.create({
      data: {
        residentId: req.user.id,
        category,
        description,
        photoUrl,
      },
    });

    res.status(201).json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Resident/Admin: Get complaints
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, category } = req.query;
    
    // Build filter
    let filter = {};
    if (req.user.role === 'RESIDENT') {
      filter.residentId = req.user.id;
    }
    if (status) filter.status = status;
    if (category) filter.category = category;

    const complaints = await prisma.complaint.findMany({
      where: filter,
      include: {
        resident: { select: { name: true, email: true } },
        history: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(complaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Admin: Update complaint status & priority
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, note } = req.body;

    const complaint = await prisma.complaint.findUnique({
      where: { id: Number(id) },
      include: { resident: true }
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const updateData = {};
    if (priority) updateData.priority = priority;
    if (status) updateData.status = status;

    const updatedComplaint = await prisma.complaint.update({
      where: { id: Number(id) },
      data: updateData
    });

    // If status changed, record history and send email
    if (status && status !== complaint.status) {
      await prisma.complaintHistory.create({
        data: {
          complaintId: updatedComplaint.id,
          changedBy: req.user.id,
          oldStatus: complaint.status,
          newStatus: status,
          note: note || '',
        }
      });

      // Send email
      sendEmailNotification(
        complaint.resident.email,
        `Complaint #${complaint.id} Status Updated`,
        `Your complaint status has been changed to ${status}. Note: ${note || 'None'}`
      );
    }

    res.json(updatedComplaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
