import express from "express";
import {
  createAccount,
  getAccounts,
  deposit,
  withdraw,
  transfer,
} from "../controllers/accountController.js";
import { authMiddleWare } from "../middleware/auth.js";


const router = express.Router();

router.post("/",authMiddleWare, createAccount);
router.get("/", authMiddleWare, getAccounts);
router.post("/:id/deposit", authMiddleWare, deposit);
router.post("/:id/withdraw", authMiddleWare, withdraw);
router.post("/transfer", authMiddleWare, transfer);

export default router;