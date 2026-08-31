const { Class, Section, Subject, ClassSubject, Teacher, User, Timetable } = require('../models');

// ==========================================
// CLASSES CRUD
// ==========================================
const getClasses = async (req, res, next) => {
  try {
    const classes = await Class.findAll({
      order: [['name', 'ASC']],
      include: [
        {
          model: Section,
          as: 'sections',
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
    if (!name || !academicYearId) {
      return res.status(400).json({ success: false, message: 'Class name and academic year are required' });
    }

    const newClass = await Class.create({ name, academicYearId });
    return res.status(201).json({ success: true, message: 'Class created successfully', class: newClass });
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const { name, academicYearId } = req.body;
    const targetClass = await Class.findByPk(req.params.id);
    if (!targetClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (name) targetClass.name = name;
    if (academicYearId) targetClass.academicYearId = academicYearId;
    await targetClass.save();

    return res.json({ success: true, message: 'Class updated successfully', class: targetClass });
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const targetClass = await Class.findByPk(req.params.id);
    if (!targetClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    await targetClass.destroy(); // Hard delete allowed for config metadata if no foreign key violations
    return res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SECTIONS CRUD
// ==========================================
const getSections = async (req, res, next) => {
  try {
    const { classId } = req.query;
    const where = classId ? { classId } : {};

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
    if (!classId || !name) {
      return res.status(400).json({ success: false, message: 'Class ID and Section name are required' });
    }

    const section = await Section.create({ classId, name, classTeacherId: classTeacherId || null });
    return res.status(201).json({ success: true, message: 'Section created successfully', section });
  } catch (error) {
    next(error);
  }
};

const updateSection = async (req, res, next) => {
  try {
    const { classId, name, classTeacherId } = req.body;
    const section = await Section.findByPk(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    if (classId) section.classId = classId;
    if (name) section.name = name;
    if (classTeacherId !== undefined) section.classTeacherId = classTeacherId || null;
    await section.save();

    return res.json({ success: true, message: 'Section updated successfully', section });
  } catch (error) {
    next(error);
  }
};

const deleteSection = async (req, res, next) => {
  try {
    const section = await Section.findByPk(req.params.id);
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
// SUBJECTS CRUD
// ==========================================
const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.findAll({ order: [['name', 'ASC']] });
    return res.json({ success: true, subjects });
  } catch (error) {
    next(error);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Subject name and unique code are required' });
    }

    const exists = await Subject.findOne({ where: { code } });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Subject code already exists' });
    }

    const subject = await Subject.create({ name, code });
    return res.status(201).json({ success: true, message: 'Subject created successfully', subject });
  } catch (error) {
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (name) subject.name = name;
    if (code && code !== subject.code) {
      const codeExists = await Subject.findOne({ where: { code } });
      if (codeExists) {
        return res.status(400).json({ success: false, message: 'Subject code already in use' });
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
    const subject = await Subject.findByPk(req.params.id);
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
// CLASS-SUBJECT MAPPINGS
// ==========================================
const getClassSubjects = async (req, res, next) => {
  try {
    const { classId } = req.query;
    const where = classId ? { classId } : {};

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
    if (!classId || !subjectId || !teacherId) {
      return res.status(400).json({ success: false, message: 'Class ID, Subject ID and Teacher ID are required' });
    }

    const mapping = await ClassSubject.create({ classId, subjectId, teacherId });
    return res.status(201).json({ success: true, message: 'Class-Subject mapping created successfully', mapping });
  } catch (error) {
    next(error);
  }
};

const deleteClassSubject = async (req, res, next) => {
  try {
    const { classId, subjectId, teacherId } = req.body;
    if (!classId || !subjectId || !teacherId) {
      return res.status(400).json({ success: false, message: 'Class ID, Subject ID and Teacher ID are required' });
    }

    const mapping = await ClassSubject.findOne({ where: { classId, subjectId, teacherId } });
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
// TIMETABLE CRUD
// ==========================================
const getTimetables = async (req, res, next) => {
  try {
    const { classId, teacherId } = req.query;
    const where = {};
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
    if (!classId || !subjectId || !teacherId || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'All scheduler details are required' });
    }

    const timetable = await Timetable.create({
      classId,
      subjectId,
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      roomNumber: roomNumber || null
    });

    return res.status(201).json({ success: true, message: 'Timetable entry scheduled successfully', timetable });
  } catch (error) {
    next(error);
  }
};

const deleteTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findByPk(req.params.id);
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
