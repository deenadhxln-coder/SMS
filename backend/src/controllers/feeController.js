const { FeeStructure, Invoice, Payment, Student, User, sequelize } = require('../models');
const { logAudit } = require('../services/auditService');
const { invalidateDashboardCache } = require('../utils/cacheHelper');
const { sendToUser } = require('../services/notificationService');

// @desc    Create fee structure for a class
// @route   POST /api/fees/structures
// @access  Private (Admin)
const createFeeStructure = async (req, res, next) => {
  try {
    const { classId, title, amount, academicYearId } = req.body;

    if (!classId || !title || !amount || !academicYearId) {
      return res.status(400).json({ success: false, message: 'All fee structure fields are required' });
    }

    const structure = await FeeStructure.create({
      classId,
      title,
      amount: parseFloat(amount),
      academicYearId,
    });

    await logAudit(req.user.id, 'CREATE_FEE_STRUCTURE', 'FeeStructure', structure.id);

    return res.status(201).json({ success: true, message: 'Fee structure created successfully', structure });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all fee structures
// @route   GET /api/fees/structures
// @access  Private (Admin/Teacher)
const getFeeStructures = async (req, res, next) => {
  try {
    const structures = await FeeStructure.findAll({
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, structures });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoices (scoped by student/parent if needed)
// @route   GET /api/fees/invoices
// @access  Private
const getInvoices = async (req, res, next) => {
  try {
    const { studentId } = req.query;
    const whereClause = {};

    const role = req.user.role.name;
    if (role === 'Student') {
      const student = await Student.findOne({ where: { userId: req.user.id } });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }
      whereClause.studentId = student.id;
    } else if (role === 'Parent') {
      if (studentId) {
        const isChild = await Student.findOne({ where: { id: studentId, parentId: req.user.id } });
        if (!isChild) {
          return res.status(403).json({ success: false, message: 'Unauthorized child access' });
        }
        whereClause.studentId = studentId;
      } else {
        // Fetch all children's invoices
        const children = await Student.findAll({ where: { parentId: req.user.id } });
        const childIds = children.map(c => c.id);
        whereClause.studentId = childIds;
      }
    } else {
      // Admin/Teacher
      if (studentId) whereClause.studentId = studentId;
    }

    const invoices = await Invoice.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'admissionNo'],
          include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amountPaid', 'paymentMethod', 'transactionRef', 'paidAt'],
        },
      ],
    });

    return res.json({ success: true, invoices });
  } catch (error) {
    next(error);
  }
};

// @desc    Record transaction payment against invoice
// @route   POST /api/fees/invoices/:id/payments
// @access  Private (Admin/Parent)
const recordPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const invoiceId = req.params.id;
    const { amountPaid, paymentMethod } = req.body;
    const paymentVal = parseFloat(amountPaid);

    if (!paymentMethod || isNaN(paymentVal) || paymentVal <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid payment method and positive amount' });
    }

    // Fetch Invoice
    const invoice = await Invoice.findByPk(invoiceId, {
      transaction,
      include: [{ model: Student, as: 'student', attributes: ['id', 'userId', 'parentId'] }],
    });

    if (!invoice) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const totalAmount = parseFloat(invoice.totalAmount);
    const paidAmount = parseFloat(invoice.paidAmount);
    const newPaidAmount = paidAmount + paymentVal;

    // Business Rule: Total paid amount cannot exceed total invoice amount
    if (newPaidAmount > totalAmount) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Overpayment Error: Payment amount (${paymentVal}) plus existing paid amount (${paidAmount}) exceeds the invoice total (${totalAmount}).`,
      });
    }

    const newDueAmount = totalAmount - newPaidAmount;

    // Determine Status
    let status = 'PARTIAL';
    if (newDueAmount === 0) {
      status = 'PAID';
    } else if (newPaidAmount === 0) {
      status = 'UNPAID';
    }

    // Generate Transaction Reference
    const transactionRef = `TXN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create Payment Log
    const payment = await Payment.create({
      invoiceId,
      amountPaid: paymentVal,
      paymentMethod,
      transactionRef,
      paidAt: new Date(),
    }, { transaction });

    // Update Invoice Dues and Status
    invoice.paidAmount = newPaidAmount;
    invoice.dueAmount = newDueAmount;
    invoice.status = status;
    await invoice.save({ transaction });

    await transaction.commit();

    // Audit trace & invalidate cache
    await logAudit(req.user.id, 'RECORD_PAYMENT', 'Invoice', invoiceId);
    await invalidateDashboardCache(req.user.tenantId);

    // Emit live Socket.IO receipt notification
    const notificationData = {
      message: `A payment of $${paymentVal} was successfully recorded for Invoice #${invoice.id.slice(0, 8)}.`,
      invoiceId: invoice.id,
      amountPaid: paymentVal,
      dueAmount: newDueAmount,
      status,
      transactionRef,
    };
    // Send to student and parent socket rooms
    sendToUser(invoice.student.userId, 'FEE_PAYMENT_RECEIPT', notificationData);
    if (invoice.student.parentId) {
      sendToUser(invoice.student.parentId, 'FEE_PAYMENT_RECEIPT', notificationData);
    }

    return res.json({
      success: true,
      message: 'Payment recorded successfully',
      payment,
      invoice: {
        id: invoice.id,
        totalAmount,
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        status,
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  createFeeStructure,
  getFeeStructures,
  getInvoices,
  recordPayment,
};
