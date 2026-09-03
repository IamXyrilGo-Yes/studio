"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PaymentHistoryItem } from "@/lib/types"

const formSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be positive."),
  notes: z.string().optional(),
})

interface PaymentLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amount: number, notes?: string, id?: string) => void;
  maxAmount: number;
  editingPayment?: PaymentHistoryItem | null;
}

export function PaymentLogModal({ open, onOpenChange, onConfirm, maxAmount, editingPayment }: PaymentLogModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      notes: "",
    },
  })

  React.useEffect(() => {
    if (editingPayment) {
      form.reset({
        amount: editingPayment.amount.toString(),
        notes: editingPayment.notes || "",
      })
    } else {
      form.reset({
        amount: "",
        notes: "",
      })
    }
  }, [editingPayment, open, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    onConfirm(Number(values.amount), values.notes, editingPayment?.id)
    form.reset()
    onOpenChange(false)
  }

  const displayMax = editingPayment ? maxAmount + editingPayment.amount : maxAmount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{editingPayment ? "Edit Payment" : "Custom Payment"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-bold">₱{maxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Allowable:</span>
                <span className="font-bold text-primary">₱{displayMax.toFixed(2)}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₱)*</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="any" 
                      placeholder={`0.00`} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Payment reference, mode of payment, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90">
              {editingPayment ? "Update Payment" : "Confirm Payment"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
