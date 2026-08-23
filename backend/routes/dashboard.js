const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

// Admin: Get dashboard metrics
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalComplaints = await prisma.complaint.count();
    
    // Complaints by status
    const byStatus = await prisma.complaint.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    // Complaints by category
    const byCategory = await prisma.complaint.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    // Overdue complaints (e.g., OPEN for more than 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const overdueCount = await prisma.complaint.count({
      where: {
        status: 'OPEN',
        createdAt: { lt: threeDaysAgo }
      }
    });

    res.json({
      totalComplaints,
      byStatus,
      byCategory,
      overdueCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
