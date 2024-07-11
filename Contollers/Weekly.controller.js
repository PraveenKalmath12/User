import WeeklyTopper from '../Models/Weekly.model.js';


export const getAllWeeklyToppers = async (req, res) => {
    try {
        const allWeeklyToppers = await WeeklyTopper.find()
            .sort({ weekEndDate: -1 });

        res.status(200).json(allWeeklyToppers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch all weekly toppers' });
    }
};


