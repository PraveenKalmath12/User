import MonthlyTopper from '../Models/Monthly.model.js';

export const getAllMonthlyToppers = async (req, res) => {
    try {
        const allMonthlyToppers = await MonthlyTopper.find().sort({ monthEndDate: -1 });
        res.status(200).json(allMonthlyToppers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch all monthly toppers' });
    }
};
