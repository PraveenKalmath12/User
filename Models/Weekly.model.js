import mongoose from "mongoose";
const { Schema, model } = mongoose;

const weeklyTopperSchema = new Schema({
    year: Number,
    weekStartDate: Date,
    weekEndDate: Date,
    topUsers: [{
        clientId: { type: Schema.Types.ObjectId, ref: 'User' },
        points: {
            type: Number,
            default: 0
        }
    }]
});

const WeeklyTopper = model('WeeklyTopper', weeklyTopperSchema);

export default WeeklyTopper;
