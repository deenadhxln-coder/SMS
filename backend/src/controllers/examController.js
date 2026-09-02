const { Exam, ExamSubject, Mark, Student, User, Subject, Class, sequelize } = require('../models');
const { logAudit } = require('../services/auditService');
const tenantStorage = require('../utils/tenantContext');

// Helper to calculate Grade
const calculateGrade = (obtained, max) => {
  const pct = (obtained / max) * 100;
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
};

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private (Admin)
const createExam = async (req, res, next) => {
  try {
    const { name, academicYearId, startDate, endDate } = req.body;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null) || tenantStorage.getStore();

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    if (!name || !academicYearId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'All exam fields are required' });
    }

    const exam = await Exam.create({
      name,
      academicYearId,
      startDate,
      endDate,
      status: 'DRAFT',
      tenantId,
    });

    await logAudit(req.user.id, 'CREATE_EXAM', 'Exam', exam.id, tenantId);

    return res.status(201).json({ success: true, message: 'Exam created in DRAFT status', exam });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
const getExams = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null) || tenantStorage.getStore();
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const exams = await Exam.findAll({
      where: { tenantId },
      order: [['startDate', 'DESC']],
      include: [
        {
          model: ExamSubject,
          as: 'examSubjects',
          include: [
            { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
            { model: Class, as: 'class', attributes: ['id', 'name'] },
          ],
        },
      ],
    });
    return res.json({ success: true, exams });
  } catch (error) {
    next(error);
  }
};

// @desc    Add subject schedule to an exam
// @route   POST /api/exams/:id/schedule
// @access  Private (Admin)
const addExamSchedule = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const { subjectId, classId, examDate, maxMarks } = req.body;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null) || tenantStorage.getStore();

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    if (!subjectId || !classId || !examDate || !maxMarks) {
      return res.status(400).json({ success: false, message: 'All schedule details are required' });
    }

    const exam = await Exam.findOne({ where: { id: examId, tenantId } });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const schedule = await ExamSubject.create({
      examId,
      subjectId,
      classId,
      examDate,
      maxMarks: parseFloat(maxMarks),
      tenantId,
    });

    await logAudit(req.user.id, 'ADD_EXAM_SCHEDULE', 'ExamSubject', schedule.id, tenantId);

    return res.status(201).json({ success: true, message: 'Subject added to exam schedule', schedule });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit student marks (bulk/single)
// @route   POST /api/exams/:examId/marks
// @access  Private (Admin/Teacher)
const submitMarks = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { examSubjectId, markings } = req.body; // markings: [{ studentId, marksObtained }]
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null) || tenantStorage.getStore();

    if (!tenantId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    if (!examSubjectId || !markings || !Array.isArray(markings)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Please provide examSubjectId and markings array' });
    }

    // Fetch the ExamSubject within tenant to get max_marks limit
    const examSubject = await ExamSubject.findOne({ where: { id: examSubjectId, tenantId }, transaction });
    if (!examSubject) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Exam subject schedule not found' });
    }

    const savedMarks = [];
    const maxMarks = examSubject.maxMarks;

    for (const item of markings) {
      const { studentId, marksObtained } = item;
      const score = parseFloat(marksObtained);

      // Business Rule: Reject if marksObtained > maxMarks
      if (score > maxMarks || score < 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error: Obtained marks (${score}) cannot exceed maximum marks (${maxMarks}) or be less than 0. Student ID: ${studentId}`,
        });
      }

      const grade = calculateGrade(score, maxMarks);

      // Check if student exists within tenant
      const student = await Student.findOne({ where: { id: studentId, tenantId }, transaction });
      if (!student) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: `Student profile not found for ID: ${studentId}` });
      }

      // Check if mark already exists for (examSubjectId, studentId, tenantId)
      const existingMark = await Mark.findOne({
        where: { examSubjectId, studentId, tenantId },
        transaction,
      });

      if (existingMark) {
        existingMark.marksObtained = score;
        existingMark.maxMarks = maxMarks;
        existingMark.grade = grade;
        await existingMark.save({ transaction });
        savedMarks.push(existingMark);
      } else {
        const mark = await Mark.create({
          examSubjectId,
          studentId,
          marksObtained: score,
          maxMarks,
          grade,
          tenantId,
        }, { transaction });
        savedMarks.push(mark);
      }
    }

    await transaction.commit();

    await logAudit(req.user.id, 'SUBMIT_MARKS', 'ExamSubject', examSubjectId, tenantId);

    return res.json({
      success: true,
      message: 'Marks and grades submitted successfully',
      marks: savedMarks,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// @desc    Get student report card
// @route   GET /api/exams/report-card/:studentId
// @access  Private (Admin/Teacher/Student/Parent)
const getReportCard = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null) || tenantStorage.getStore();

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    // Verify student belongs to this tenant first (prevent IDOR)
    const targetStudent = await Student.findOne({ where: { id: studentId, tenantId } });
    if (!targetStudent) {
      return res.status(404).json({ success: false, message: 'Student not found in this school tenant' });
    }

    // RBAC verification for Student and Parent
    const role = req.user.role.name;
    if (role === 'Student') {
      if (targetStudent.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to report card' });
      }
    } else if (role === 'Parent') {
      if (targetStudent.parentId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to child report card' });
      }
    }

    // Fetch marks with associated ExamSubject info scoped to tenant
    const marks = await Mark.findAll({
      where: { studentId, tenantId },
      include: [
        {
          model: ExamSubject,
          as: 'examSubject',
          include: [
            { model: Exam, as: 'exam', attributes: ['name', 'academicYearId'] },
            { model: Subject, as: 'subject', attributes: ['name', 'code'] },
          ],
        },
      ],
    });

    return res.json({ success: true, marks });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExam,
  getExams,
  addExamSchedule,
  submitMarks,
  getReportCard,
};
