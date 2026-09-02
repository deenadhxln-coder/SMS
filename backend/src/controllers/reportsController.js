const { Attendance, Student, Class, Exam, ExamSubject, Mark, Invoice, FeeStructure, Subject, User, sequelize } = require('../models');

const getReportData = async (req, res, next) => {
  const { type } = req.params;
  const { classId, examId, startDate, endDate } = req.query;
  const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);

  if (!tenantId) {
    return res.status(400).json({ success: false, message: 'Tenant context required' });
  }

  try {
    if (type === 'attendance') {
      const where = { tenantId };
      if (classId) where.classId = classId;
      if (startDate && endDate) {
        where.date = { [sequelize.Sequelize.Op.between]: [startDate, endDate] };
      }

      // Group attendance count by class and status
      const stats = await Attendance.findAll({
        where,
        attributes: [
          'classId',
          'status',
          [sequelize.fn('COUNT', sequelize.col('Attendance.id')), 'count']
        ],
        group: ['classId', 'status'],
        include: [{ model: Class, as: 'class', attributes: ['name'] }]
      });

      return res.json({ success: true, stats });
    }

    if (type === 'exams') {
      if (!examId) {
        return res.status(400).json({ success: false, message: 'examId query parameter is required for exam reports' });
      }

      const exam = await Exam.findOne({ where: { id: examId, tenantId } });
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      const marks = await Mark.findAll({
        where: { tenantId },
        include: [
          {
            model: ExamSubject,
            as: 'examSubject',
            where: { examId },
            include: [
              { model: Subject, as: 'subject', attributes: ['name', 'code'] },
              { model: Class, as: 'class', attributes: ['name'] }
            ]
          },
          {
            model: Student,
            as: 'student',
            attributes: ['admissionNo'],
            include: [{ model: User, as: 'user', attributes: ['name'] }]
          }
        ]
      });

      // Aggregate: Class average marks
      const classAverages = await Mark.findAll({
        where: { tenantId },
        include: [
          {
            model: ExamSubject,
            as: 'examSubject',
            where: { examId },
            attributes: []
          }
        ],
        attributes: [
          [sequelize.col('examSubject.class_id'), 'classId'],
          [sequelize.fn('AVG', sequelize.col('marks_obtained')), 'avgMarks'],
          [sequelize.fn('MAX', sequelize.col('marks_obtained')), 'maxMarks']
        ],
        group: [sequelize.col('examSubject.class_id')],
        raw: true
      });

      return res.json({ success: true, exam, marks, classAverages });
    }

    if (type === 'fees') {
      // Group paid vs pending amounts by Class
      const classFees = await Invoice.findAll({
        where: { tenantId },
        include: [
          {
            model: Student,
            as: 'student',
            attributes: ['classId'],
            include: [{ model: Class, as: 'class', attributes: ['name'] }]
          }
        ],
        attributes: [
          [sequelize.col('student.class_id'), 'classId'],
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalInvoiced'],
          [sequelize.fn('SUM', sequelize.col('paid_amount')), 'totalPaid'],
          [sequelize.fn('SUM', sequelize.col('due_amount')), 'totalDue']
        ],
        group: [sequelize.col('student.class_id')],
        raw: true
      });

      return res.json({ success: true, classFees });
    }

    return res.status(400).json({ success: false, message: `Report type [${type}] is not supported` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportData,
};
