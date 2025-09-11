import express from "express";

import {
  applyForLoan,
  getMyLoans,
  getLoanDetails,
  updateLoanStatus,
  getRepaymentSchedule,
  payLoanInstallment
} 
from "../controllers/loanController.js";
import { authMiddleWare } from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleWare.js"
 
const router = express.Router();
router.post("/apply", authMiddleWare, applyForLoan);
router.get("/myloans",authMiddleWare, getMyLoans); 
router.get("/:id", authMiddleWare, getLoanDetails);
router.patch("/:id/status", authMiddleWare, adminMiddleware, updateLoanStatus);
router.get("/:id/repayments", authMiddleWare, getRepaymentSchedule);
router.post("/:id/pay",authMiddleWare, payLoanInstallment);
 
export default router;
 