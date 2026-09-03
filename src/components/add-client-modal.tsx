"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { v4 as uuidv4 } from 'uuid'

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
import { Client } from "@/lib/types"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  address: z.string().optional(),
  loanAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number."),
  interestRate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Rate must be 0 or more."),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (client: Client) => void;
}

export function AddClientModal({ open, onOpenChange, onAdd }: AddClientModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      loanAmount: "",
      interestRate: "10",
      dueDate: "",
      notes: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const loanAmount = Number(values.loanAmount)
    const rate = Number(values.interestRate)
    const initialBalance = loanAmount * (1 + rate / 100)

    const newClient: Client = {
      id: uuidv4(),
      name: values.name,
      phone: values.phone,
      email: values.email,
      address: values.address,
      loanAmount,
      interestRate: rate,
      initialBalance,
      outstandingBalance: initialBalance,
      totalPaid: 0,
      dueDate: values.dueDate || undefined,
      notes: values.notes,
      history: [],
      createdAt: new Date().toISOString(),
    }

    onAdd(newClient)
    form.reset()
    onOpenChange(false)
  }

  const loanAmount = Number(form.watch("loanAmount")) || 0
  const interestRate = Number(form.watch("interestRate")) || 0
  const totalRepayment = loanAmount * (1 + interestRate / 100)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client & Loan</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Dela Cruz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="0912 345 6789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="loanAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Amount (₱)*</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (%)*</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs font-semibold text-primary mb-1">Financial Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Repayment Amount:</span>
                <span className="font-bold text-primary">₱{totalRepayment.toFixed(2)}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Loan Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Weekly payment, motorcycle loan, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90">
              Create Loan
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
