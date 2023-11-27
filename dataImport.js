import express from "express";
import asyncHandler from "express-async-handler";
import Account from "./models/accountModel.js";
import { accounts } from "./data/accounts.js";


const ImportData=express.Router();

ImportData.post("/accounts",asyncHandler(async(req,res)=>{
        try{
                await Account.remove({});
                const importAccounts=await Account.insertMany(accounts);

                res.send(importAccounts)
        }
        catch(error){
                console.log(error);
        }
}))

export default ImportData;