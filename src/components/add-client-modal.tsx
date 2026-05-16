"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, X } from "lucide-react"
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
import { Client, PaymentEntry } from "@/lib/types"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  loanAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number."),
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
      loanAmount: "",
      notes: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const loanAmount = Number(values.loanAmount)
    const paymentAmount = Math.floor(loanAmount / 10)
    
    const payments: PaymentEntry[] = Array.from({ length: 10 }).map((_, i) => ({
      id: uuidv4(),
      amount: i === 9 ? loanAmount - (paymentAmount * 9) : paymentAmount,
      status: 'due',
    }))

    const newClient: Client = {
      id: uuidv4(),
      name: values.name,
      loanAmount,
      outstandingBalance: loanAmount,
      totalPaid: 0,
      notes: values.notes,
      payments,
      createdAt: new Date().toISOString(),
    }

    onAdd(newClient)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Dela Cruz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="loanAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Amount (₱)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1000" {...field} />
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
                    <Textarea placeholder="Weekly payment preferred..." {...field} />
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