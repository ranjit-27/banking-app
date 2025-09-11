import mongoose from "mongoose";

const repaymentSchema = new mongoose.Schema({

    loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Loan",
        required: true,
    },

    dueDate: {
        type: Date,
        required: true,
    },

    amount: {
        type: Number,
        required: true,
    },

    paid: {
        type: Boolean,
        default: false,
    },

    paidDate: {
        type: Date,
    },

}, { timestamps: true });

export default mongoose.model("Repayment", repaymentSchema);
