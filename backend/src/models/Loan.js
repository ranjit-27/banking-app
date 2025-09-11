import mongoose from "mongoose";
 
const loanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  loanType: {
    type: String,
    enum: ["personal", "home", "education"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  tenureMonths: {
    type: Number,
    required: true,
  },
  interestRate: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "active", "closed"],
    default: "pending",
  },
}, { timestamps: true });
 
export default mongoose.model("Loan", loanSchema);