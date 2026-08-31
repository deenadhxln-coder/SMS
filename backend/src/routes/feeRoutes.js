const express = require('express');
const router = express.Router();
const { createFeeStructure, getFeeStructures, getInvoices, recordPayment } = require('../controllers/feeController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

router.use(protect);

router.post('/structures', authorize('Super Admin', 'School Admin'), createFeeStructure);
router.get('/structures', authorize('Super Admin', 'School Admin', 'Teacher'), getFeeStructures);
router.get('/invoices', getInvoices);
router.post('/invoices/:id/payments', authorize('Super Admin', 'School Admin', 'Parent'), recordPayment);

module.exports = router;
