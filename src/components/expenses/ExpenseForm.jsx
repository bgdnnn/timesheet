import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { createExpense, updateExpense } from '@/api/expenses';
import { listAllReceipts, receiptFileUrl } from '@/api/receipts';

export default function ExpenseForm({ open, onOpenChange, expense, onSave }) {
  const [entryDate, setEntryDate] = useState(new Date());
  const [vendor, setVendor] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [receiptId, setReceiptId] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  useEffect(() => {
    if (expense) {
      setEntryDate(new Date(expense.entry_date));
      setVendor(expense.vendor || '');
      setExpenseType(expense.expense_type || '');
      setTotalAmount(expense.total_amount || '');
      setReceiptId(expense.receipt_id || null);
    } else {
      setEntryDate(new Date());
      setVendor('');
      setExpenseType('');
      setTotalAmount('');
      setReceiptId(null);
    }
    setIsPreviewVisible(true);
  }, [expense]);

  useEffect(() => {
    async function fetchReceipts() {
      try {
        const files = await listAllReceipts();
        setReceipts(files);
      } catch (error) {
        console.error('Failed to fetch receipt files:', error);
      }
    }
    fetchReceipts();
  }, []);

  useEffect(() => {
    if (receiptId) {
      receiptFileUrl(receiptId).then(url => setPreviewUrl(url));
    } else {
      setPreviewUrl(null);
    }
  }, [receiptId]);

  const handleReceiptChange = (value) => {
    setReceiptId(Number(value));
    setIsPreviewVisible(true);
  }

  const handleSubmit = async () => {
    const expenseData = {
      entry_date: entryDate.toISOString().split('T')[0],
      vendor,
      expense_type: expenseType,
      total_amount: totalAmount,
      receipt_id: receiptId,
    };

    console.log('Expense data being sent:', expenseData);

    try {
      if (expense) {
        await updateExpense(expense.id, expenseData);
      } else {
        await createExpense(expenseData);
      }
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <DatePicker id="date" selected={entryDate} onChange={(date) => setEntryDate(date)} className="w-full" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Input id="vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="expense-type">Type</Label>
            <Select onValueChange={setExpenseType} value={expenseType}>
              <SelectTrigger id="expense-type">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Hygiene">Hygiene</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="total">Total (£)</Label>
            <Input id="total" type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="receipt">Receipt</Label>
            <Select onValueChange={handleReceiptChange} value={receiptId?.toString() || ''}>
              <SelectTrigger id="receipt">
                <SelectValue placeholder="Select a receipt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No receipt</SelectItem>
                {receipts.map((receipt) => (
                  <SelectItem key={receipt.id} value={receipt.id.toString()}>{receipt.original_filename}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {previewUrl && isPreviewVisible && (
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="mt-2 w-full h-auto cursor-pointer"
                onClick={() => setIsPreviewVisible(false)}
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
