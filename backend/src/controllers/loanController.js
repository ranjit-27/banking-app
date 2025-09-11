import {Account} from "../models/Account.js"; 
import Loan from "../models/Loan.js"
import Repayment from "../models/Repayment.js";
import User from "../models/User.js"; 
import { generateRepaymentSchedule } from "../utils/loanUtils.js"
import mongoose from 'mongoose'; 

export const applyForLoan = async (req, res) => {
  try {
    console.log(req.user.userId)
    const { loanType, amount, tenureMonths, interestRate } = req.body;
    const loan = await Loan.create({
      userId: req.user.userId, 
      loanType,
      amount,
      tenureMonths,
      interestRate,
    });
    res.status(201).json(loan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.userId });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
 

export const getLoanDetails = async (req, res) => {
  try {
    
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!loan) {
      return res.status(404).json({ message: "Loan not found or you do not have access." });
    }
    res.json(loan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
 

export const updateLoanStatus = async (req, res) => {

  const session = await mongoose.startSession();
  session.startTransaction();
 
  try {
    const { status } = req.body;
    const loan = await Loan.findById(req.params.id).session(session);
    if (!loan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Loan not found." });
    }

    const previousStatus = loan.status;
    loan.status = status;

    if (previousStatus === 'pending' && status === 'approved') {
      const repayments = generateRepaymentSchedule(loan);
      await Repayment.insertMany(repayments, { session });
    }
 
    await loan.save({ session });
    await session.commitTransaction();
    session.endSession();
 
    res.json(loan);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: error.message });
  }
};

export const getRepaymentSchedule = async (req, res) => {
  try {

    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!loan) {
      return res.status(404).json({ message: "Loan not found or you do not have access." });
    }
    const repayments = await Repayment.find({ loanId: req.params.id });
    res.json(repayments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
 

export const payLoanInstallment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
 
  try {
    const { paymentAmount } = req.body;
    const loanId = req.params.id;

    console.log("Looking for loan with ID:", loanId, "and userId:", req.user.userId);
    const loan = await Loan.findOne({ _id: loanId, userId: req.user.userId }).session(session);
    if (!loan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Loan not found or you do not have access." });
    }
 
    const repayment = await Repayment.findOne({ loanId: loan._id, paid: false }).sort({ dueDate: 1 }).session(session);
    if (!repayment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "No outstanding payments for this loan." });
    }

    const account = await Account.findOne({ userId: req.user.userId }).session(session);
    if (!account || account.balance < repayment.amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Insufficient balance to make this payment." });
    }
    account.balance -= repayment.amount;
    repayment.paid = true;
    repayment.paidDate = new Date();
 
    await account.save({ session });
    await repayment.save({ session });

    await session.commitTransaction();
    session.endSession();
 
    res.status(200).json({
      message: "Payment successful.",
      account,
      repayment,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: "Failed to process payment: " + error.message });
  }
};