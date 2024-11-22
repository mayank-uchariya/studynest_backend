const express = require('express');
const { getExamples, createExample } = require('../controllers/exampleController');
const router = express.Router();

router.get('/', getExamples);
router.post('/', createExample);

module.exports = router;
