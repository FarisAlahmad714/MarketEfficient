// lib/sandbox-funding-fees.js
// Funding Fee Calculation System for Leveraged Sandbox Trading Positions

const connectDB = require('./database');
const SandboxTrade = require('../models/SandboxTrade');
const SandboxPortfolio = require('../models/SandboxPortfolio');

class SandboxFundingFeeManager {
  constructor() {
    this.fundingRate = 0.0001; // 0.01% per 8 hours (0.0375% daily for leveraged positions)
    this.fundingInterval = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  }

  async processFundingFees() {
    try {
      await connectDB();
      
      const now = new Date();
      
      // Get all leveraged positions open for more than 8 hours
      const eightHoursAgo = new Date(now.getTime() - this.fundingInterval);
      
      const leveragedTrades = await SandboxTrade.find({
        status: 'open',
        leverage: { $gt: 1 },
        $or: [
          { lastFundingTime: { $exists: false } },
          { lastFundingTime: { $lt: eightHoursAgo } }
        ]
      });

      if (leveragedTrades.length === 0) {
        return { processed: 0, totalFees: 0 };
      }

      let totalFeesProcessed = 0;
      let tradesProcessed = 0;

      for (const trade of leveragedTrades) {
        try {
          const fundingFee = await this.calculateAndApplyFundingFee(trade);
          if (fundingFee > 0) {
            totalFeesProcessed += fundingFee;
            tradesProcessed++;
          }
        } catch (error) {
        }
      }

      
      return { 
        processed: tradesProcessed, 
        totalFees: totalFeesProcessed 
      };

    } catch (error) {
      throw error;
    }
  }

  async calculateAndApplyFundingFee(trade) {
    try {
      const now = new Date();
      const positionAge = now - trade.entryTime;
      
      // Only apply funding fees to positions older than 8 hours
      if (positionAge < this.fundingInterval) {
        return 0;
      }

      // Calculate how many 8-hour periods have passed since last funding or entry
      const lastFundingTime = trade.lastFundingTime || trade.entryTime;
      const timeSinceLastFunding = now - lastFundingTime;
      const periodsToCharge = Math.floor(timeSinceLastFunding / this.fundingInterval);
      
      if (periodsToCharge === 0) {
        return 0;
      }

      // Calculate funding fee based on position value
      const positionValue = trade.entryPrice * trade.quantity * trade.leverage;
      const fundingFeePerPeriod = positionValue * this.fundingRate;
      const totalFundingFee = fundingFeePerPeriod * periodsToCharge;

      // Update the trade with funding fee
      const updatedTrade = await SandboxTrade.findByIdAndUpdate(
        trade._id,
        {
          $inc: {
            'fees.funding': totalFundingFee,
            'fees.total': totalFundingFee
          },
          $set: {
            lastFundingTime: now
          }
        },
        { new: true }
      );

      if (!updatedTrade) {
        throw new Error('Failed to update trade with funding fee');
      }

      // Deduct funding fee from portfolio balance
      const portfolio = await SandboxPortfolio.findOne({ userId: trade.userId });
      if (portfolio) {
        portfolio.balance -= totalFundingFee;
        await portfolio.save();
      }

      
      return totalFundingFee;

    } catch (error) {
      throw error;
    }
  }

  getFundingRate() {
    return this.fundingRate;
  }

  getFundingInterval() {
    return this.fundingInterval;
  }

  // Calculate estimated funding fee for a position
  estimateFundingFee(positionValue, leverage, hours = 8) {
    if (leverage <= 1) return 0;
    
    const periods = hours / 8;
    return positionValue * this.fundingRate * periods;
  }

  // Get next funding time for a trade
  getNextFundingTime(trade) {
    const lastFundingTime = trade.lastFundingTime || trade.entryTime;
    return new Date(lastFundingTime.getTime() + this.fundingInterval);
  }
}

// Create singleton instance
const fundingFeeManager = new SandboxFundingFeeManager();

module.exports = fundingFeeManager;
module.exports.SandboxFundingFeeManager = SandboxFundingFeeManager;