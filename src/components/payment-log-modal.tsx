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
import { PaymentEntry } from "@/lib/types"

const formSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be positive."),
  date: z.string().min(1, "Date is required."),
})

interface PaymentLogModalProps {
  payment: PaymentEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amount: number, date: string) => void;
}

export function PaymentLogModal({ payment, open, onOpenChange, onConfirm }: PaymentLogModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      date: new Date().toISOString().split('T')[0],
    },
  })

  React.useEffect(() => {
    if (payment) {
      form.setValue("amount", payment.amount.toString())
    }
  }, [payment, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    onConfirm(Number(values.amount), values.date)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Log Payment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (₱)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-12 text-lg font-semibold bg-accent hover:bg-accent/90">
              Confirm Payment
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}