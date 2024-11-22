const Example = require('../models/exampleModel');

// Get all examples
const getExamples = async (req, res) => {
    try {
        const examples = await Example.find();
        res.json(examples);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a new example
const createExample = async (req, res) => {
    const example = new Example({
        name: req.body.name,
        age: req.body.age,
    });

    try {
        const newExample = await example.save();
        res.status(201).json(newExample);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = {
    getExamples,
    createExample,
};
