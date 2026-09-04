const { Class, Section, Subject, ClassSubject, Teacher, User, Timetable, AcademicYear } = require('../models');
const { invalidateDashboardCache } = require('../utils/cacheHelper');

// ==========================================
// 1-4. CLASSES CRUD
// ==========================================
const getClasses = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const { academicYearId } = req.query;
    const where = { tenantId };
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const classes = await Class.findAll({
      where,
      order: [['name', 'ASC']],
      include: [
        {
          model: Section,
          as: 'sections',
          where: { tenantId },
          required: false,
          attributes: ['id', 'name'],
        },
      ],
    });
    return res.json({ success: true, classes });
  } catch (error) {
    next(error);
  }
};

const createClass = async (req, res, next) => {
  try {
    const { name, academicYearId } = req.body;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    if (!name || !academicYearId) {
      return res.status(400).json({ success: false, message: 'Class name and academic year are required' });
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let resolvedAyId = academicYearId;
    let ay;
    if (typeof academicYearId === 'string' && UUID_REGEX.test(academicYearId)) {
      ay = await AcademicYear.findOne({ where: { id: academicYearId, tenantId } });
    } else {
      [ay] = await AcademicYear.findOrCreate({
        where: { tenantId, name: academicYearId },
        defaults: {
          startDate: '2026-06-01',
          endDate: '2027-05-31',
          isCurrent: true,
          status: 'ACTIVE',
        },
      });
      resolvedAyId = ay?.id;
    }

    if (!ay) {
      return res.status(400).json({ success: false, message: 'Referenced academic year does not exist in this school.' });
    }
    if (ay.status === 'ARCHIVED') {
      return res.status(400).json({ success: false, message: 'Cannot create class in an ARCHIVED academic year.' });
    }

    const newClass = await Class.create({ name, academicYearId: resolvedAyId, tenantId });
    await invalidateDashboardCache(tenantId);
    return res.status(201).json({ success: true, message: 'Class created successfully', class: newClass });
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const { name, academicYearId } = req.body;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const targetClass = await Class.findOne({ where: { id: req.params.id, tenantId } });
    if (!targetClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (academicYearId) {
      const ay = await AcademicYear.findOne({ where: { id: academicYearId, tenantId } });
      if (!ay) {
        return res.status(400).json({ success: false, message: 'Referenced academic year does not exist in this school.' });
      }
      if (ay.status === 'ARCHIVED') {
        return res.status(400).json({ success: false, message: 'Cannot assign class to an ARCHIVED academic year.' });
      }
      targetClass.academicYearId = academicYearId;
    }

    if (name) targetClass.name = name;
    await targetClass.save();
    await invalidateDashboardCache(tenantId);

    return res.json({ success: true, message: 'Class updated successfully', class: targetClass });
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const targetClass = await Class.findOne({ where: { id: req.params.id, tenantId } });
    if (!targetClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    await targetClass.destroy();
    await invalidateDashboardCache(tenantId);
    return res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5-8. SECTIONS CRUD
// ==========================================
const getSections = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const { classId } = req.query;
    const where = { tenantId };
    if (classId) where.classId = classId;

    const sections = await Section.findAll({
      where,
      order: [['name', 'ASC']],
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name'],
        },
        {
          model: Teacher,
          as: 'classTeacher',
          attributes: ['id', 'employeeNo'],
          include: [{ model: User, as: 'user', attributes: ['name'] }],
        },
      ],
    });
    return res.json({ success: true, sections });
  } catch (error) {
    next(error);
  }
};

const createSection = async (req, res, next) => {
  try {
    const { classId, name, classTeacherId } = req.body;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    if (!classId || !name) {
      return res.status(400).json({ success: false, message: 'Class ID and Section name are required' });
    }

    // Verify referenced class belongs to this school tenant
    const classExists = await Class.findOne({ where: { id: classId, tenantId } });
    if (!classExists) {
      return res.status(400).json({ success: false, message: 'Referenced class not found in this school' });
    }

    // Verify referenced teacher if provided
    if (classTeacherId) {
      const teacherExists = await Teacher.findOne({ where: { id: classTeacherId, tenantId } });
      if (!teacherExists) {
        return res.status(400).json({ success: false, message: 'Referenced teacher not found in this school' });
      }
    }

    const section = await Section.create({ classId, name, classTeacherId: classTeacherId || null, tenantId });
    return res.status(201).json({ success: true, message: 'Section created successfully', section });
  } catch (error) {
    next(error);
  }
};

const updateSection = async (req, res, next) => {
  try {
    const { classId, name, classTeacherId } = req.body;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const section = await Section.findOne({ where: { id: req.params.id, tenantId } });
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    if (classId) {
      const classExists = await Class.findOne({ where: { id: classId, tenantId } });
      if (!classExists) {
        return res.status(400).json({ success: false, message: 'Referenced class not found in this school' });
      }
      section.classId = classId;
    }

    if (classTeacherId !== undefined && classTeacherId !== null) {
      const teacherExists = await Teacher.findOne({ where: { id: classTeacherId, tenantId } });
      if (!teacherExists) {
        return res.status(400).json({ success: false, message: 'Referenced teacher not found in this school' });
      }
      section.classTeacherId = classTeacherId;
    } else if (classTeacherId === null) {
      section.classTeacherId = null;
    }

    if (name) section.name = name;
    await section.save();

    return res.json({ success: true, message: 'Section updated successfully', section });
  } catch (error) {
    next(error);
  }
};

const deleteSection = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const section = await Section.findOne({ where: { id: req.params.id, tenantId } });
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    await section.destroy();
    return res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 9-12. SUBJECTS CRUD
// ==========================================
const getSubjects = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const subjects = await Subject.findAll({ where: { tenantId }, order: [['name', 'ASC']] });
    return res.json({ success: true, subjects });
  } catch (error) {
    next(error);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Subject name and unique code are required' });
    }

    const exists = await Subject.findOne({ where: { code, tenantId } });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Subject code already exists in this school' });
    }

    const subject = await Subject.create({ name, code, tenantId });
    return res.status(201).json({ success: true, message: 'Subject created successfully', subject });
  } catch (error) {
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const subject = await Subject.findOne({ where: { id: req.params.id, tenantId } });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (name) subject.name = name;
    if (code && code !== subject.code) {
      const codeExists = await Subject.findOne({ where: { code, tenantId } });
      if (codeExists) {
        return res.status(400).json({ success: false, message: 'Subject code already in use in this school' });
      }
      subject.code = code;
    }
    await subject.save();

    return res.json({ success: true, message: 'Subject updated successfully', subject });
  } catch (error) {
    next(error);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const subject = await Subject.findOne({ where: { id: req.params.id, tenantId } });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    await subject.destroy();
    return res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 13-15. CLASS-SUBJECT MAPPINGS
// ==========================================
const getClassSubjects = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const { classId } = req.query;
    const where = { tenantId };
    if (classId) where.classId = classId;

    const mappings = await ClassSubject.findAll({
      where,
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
        {
          model: Teacher,
          as: 'teacher',
          attributes: ['id', 'employeeNo'],
          include: [{ model: User, as: 'user', attributes: ['name'] }],
        },
      ],
    });
    return res.json({ success: true, mappings });
  } catch (error) {
    next(error);
  }
};

const createClassSubject = async (req, res, next) => {
  try {
    const { classId, subjectId, teacherId } = req.body;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    if (!classId || !subjectId || !teacherId) {
      return res.status(400).json({ success: false, message: 'Class ID, Subject ID and Teacher ID are required' });
    }

    // Verify referenced resources belong to this school tenant
    const classExists = await Class.findOne({ where: { id: classId, tenantId } });
    if (!classExists) {
      return res.status(400).json({ success: false, message: 'Referenced class not found in this school' });
    }

    const subjectExists = await Subject.findOne({ where: { id: subjectId, tenantId } });
    if (!subjectExists) {
      return res.status(400).json({ success: false, message: 'Referenced subject not found in this school' });
    }

    const teacherExists = await Teacher.findOne({ where: { id: teacherId, tenantId } });
    if (!teacherExists) {
      return res.status(400).json({ success: false, message: 'Referenced teacher not found in this school' });
    }

    const existingMapping = await ClassSubject.findOne({
      where: { classId, subjectId, teacherId, tenantId },
    });
    if (existingMapping) {
      return res.status(400).json({ success: false, message: 'Class-Subject mapping already exists' });
    }

    const mapping = await ClassSubject.create({ classId, subjectId, teacherId, tenantId });
    return res.status(201).json({ success: true, message: 'Class-Subject mapping created successfully', mapping });
  } catch (error) {
    next(error);
  }
};

const deleteClassSubject = async (req, res, next) => {
  try {
    const { classId, subjectId, teacherId } = req.body;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    if (!classId || !subjectId || !teacherId) {
      return res.status(400).json({ success: false, message: 'Class ID, Subject ID and Teacher ID are required' });
    }

    const mapping = await ClassSubject.findOne({ where: { classId, subjectId, teacherId, tenantId } });
    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Mapping not found' });
    }

    await mapping.destroy();
    return res.json({ success: true, message: 'Class-Subject mapping deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 16-18. TIMETABLE CRUD
// ==========================================
const getTimetables = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const { classId, teacherId } = req.query;
    const where = { tenantId };
    if (classId) where.classId = classId;
    if (teacherId) where.teacherId = teacherId;

    const timetables = await Timetable.findAll({
      where,
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
      ],
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
        {
          model: Teacher,
          as: 'teacher',
          attributes: ['id', 'employeeNo'],
          include: [{ model: User, as: 'user', attributes: ['name'] }]
        }
      ]
    });
    return res.json({ success: true, timetables });
  } catch (error) {
    next(error);
  }
};

const createTimetable = async (req, res, next) => {
  try {
    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, roomNumber } = req.body;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    if (!classId || !subjectId || !teacherId || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'All scheduler details are required' });
    }

    // Verify foreign keys belong to this school tenant
    const classExists = await Class.findOne({ where: { id: classId, tenantId } });
    if (!classExists) {
      return res.status(400).json({ success: false, message: 'Referenced class not found in this school' });
    }

    const subjectExists = await Subject.findOne({ where: { id: subjectId, tenantId } });
    if (!subjectExists) {
      return res.status(400).json({ success: false, message: 'Referenced subject not found in this school' });
    }

    const teacherExists = await Teacher.findOne({ where: { id: teacherId, tenantId } });
    if (!teacherExists) {
      return res.status(400).json({ success: false, message: 'Referenced teacher not found in this school' });
    }

    const timetable = await Timetable.create({
      classId,
      subjectId,
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      roomNumber: roomNumber || null,
      tenantId,
    });

    return res.status(201).json({ success: true, message: 'Timetable entry scheduled successfully', timetable });
  } catch (error) {
    next(error);
  }
};

const deleteTimetable = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const timetable = await Timetable.findOne({ where: { id: req.params.id, tenantId } });
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable slot not found' });
    }
    await timetable.destroy();
    return res.json({ success: true, message: 'Timetable entry removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getClassSubjects,
  createClassSubject,
  deleteClassSubject,
  getTimetables,
  createTimetable,
  deleteTimetable,
};
