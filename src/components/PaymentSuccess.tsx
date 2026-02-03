import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';

export const PaymentSuccess = ({ onGoHome, onViewOrder }: { onGoHome: () => void, onViewOrder: () => void }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-green-600" />
        </motion.div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 mb-8">
          Thank you for your purchase. Your transaction has been completed successfully.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
          <div className="flex justify-between mb-2">
            <span className="text-gray-500 text-sm">Transaction ID</span>
            <span className="font-mono text-gray-900 text-sm">TXN-8859201</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-500 text-sm">Date</span>
            <span className="text-gray-900 text-sm">Feb 3, 2026</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Amount</span>
            <span className="font-semibold text-gray-900 text-sm">$120.00</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={onViewOrder}
            className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            View Order Details
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button 
            onClick={onGoHome}
            className="w-full bg-white text-gray-700 border border-gray-200 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Return to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};
