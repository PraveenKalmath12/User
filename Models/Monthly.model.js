import mongoose from "mongoose";
const { Schema, model } = mongoose;

const monthlyTopperSchema = new Schema({
    year: Number,
    monthStartDate: Date,
    monthEndDate: Date,
    topUsers: [{
        clientId: { type: Schema.Types.ObjectId, ref: 'User' },
        points: {
            type: Number,
            default: 0
        }
    }]
});

const MonthlyTopper = model('MonthlyTopper', monthlyTopperSchema);

export default MonthlyTopper;
