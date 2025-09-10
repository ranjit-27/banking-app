import {Account} from "../models/Account.js"
import User from "../models/User.js"
import {v4 as uuidv4} from "uuid"
import mongoose from "mongoose"

import Joi from "joi"
 
const accountCreationSchema= Joi.object({
    type:Joi.string().valid("savings","current").required(),
})

const transctionSchema=Joi.object({
    amount:Joi.number().positive().required(),
})

export const createAccount = async(req,res)=>{
    try{
        const {error} = accountCreationSchema.validate(req.body)
        if(error){
            return res.status(400).json({error:error.details[0].message})
        }
        const user=await User.findById(req.user.userId)
        if(!user){
            return res.status(404).json({error:"Authentication user not found"})
        }

        const newAccount = new Account({
            ...req.body,
            userId:req.user.userId,
            accountNumber:uuidv4()
        })
        
        await newAccount.save()
        res.status(201).json(newAccount)
    }catch(err){
        res.status(500).json({error:"Failed to create to create account"+err.message})
    }
}

export const getAccounts=async(req,res)=>{
    try{
        const accounts=await Account.find({userId:req.user.userId})
        res.status(200).json(accounts)
    }catch(err){
        res.status(500).json({error:"failed to fetch accounts"+err.message})
    }
}




export const deposit=async(req,res)=>{
    try{
        const {error}=transctionSchema.validate(req.body)
        if(error){
            return res.status(400).json({error:"Account Not Found" })
        }
        console.log(`req.body = ${JSON.stringify(req.body)} req.params.id ${req.params.id}`);
        
        const account=await Account.findById(req.params.id)
        console.log(`req.body = ${JSON.stringify(account)} req.params.id ${req.params.id}`);
        
        if(!account){
            res.status(404).json({error:"Account Not Found"})
        }
        if (account.userId.toString() !== req.user.userId) {
         return res.status(403).json({ error: "Forbidden: You do not own this account." });
        }
        account.balance+=req.body.amount
        account.transactions.push({
            txnID:uuidv4(),
            type:"deposit",
            amount:req.body.amount
        })
        await account.save()
        res.status(200).json({message:"Deposited Succesfully"})
    }catch(err){
        res.status(500).json({error:"Failed to proceess" + err.message})
    }
}


export const withdraw = async (req, res) => {
  try {
    const { amount } = req.body;
 
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number." });
    }
 
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ error: "Account not found." });
    }
 
    if (account.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Forbidden: You do not own this account." });
    }
 
    if (account.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance." });
    }
 
    account.balance -= amount;
    account.transactions.push({
      txnID: uuidv4(),
      type: "withdraw",
      amount: amount,
    });
    await account.save();
 
    res.status(200).json({ message: "Withdrawal successful.", account });
  } catch (err) {
    res.status(500).json({ error: "Failed to process withdrawal: " + err.message });
  }
};


export const transfer = async (req, res) => {
  
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
  
    const { fromAccountId, toAccountId, amount } = req.body;
    // Validation and other checks remain the same
    if (typeof amount !== "number" || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Amount must be a positive number." });
    }
 
    if (fromAccountId === toAccountId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Cannot transfer to the same account." });
    }
 
    const fromAccount = await Account.findById(fromAccountId).session(session);
    const toAccount = await Account.findById(toAccountId).session(session);
 
    if (!fromAccount || !toAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "One or both accounts not found." });
    }
 
    if (fromAccount.userId.toString() !== req.user.userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ error: "Forbidden: You do not own the source account." });
    }
 
    if (fromAccount.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Insufficient balance for transfer." });
    }
 
    // Update balances and transactions in memory
    fromAccount.balance -= amount;
    toAccount.balance += amount;
 
    fromAccount.transactions.push({
      txnID: uuidv4(),
      type: "transfer",
      amount: -amount,
    });
    toAccount.transactions.push({
      txnID: uuidv4(),
      type: "transfer",
      amount: amount,
    });
 
    // Save the documents, passing the session to make the operations transactional
    const savedFromAccount = await fromAccount.save({ session });
    const savedToAccount = await toAccount.save({ session });
 
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
 
    res.status(200).json({
      message: "Transfer successful.",
      fromAccount: savedFromAccount,
      toAccount: savedToAccount,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: "Failed to process transfer: " + err.message });
  }
};