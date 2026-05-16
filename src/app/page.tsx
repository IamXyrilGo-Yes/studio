"use client"

import * as React from "react"
import { Search, Plus, Trash2, ArrowLeft, Download, Info, Sparkles, ChevronRight, CheckCircle2, Circle } from "lucide-react"
import { db } from "@/lib/db"
import { Client, PaymentEntry } from "@/lib/types"
import { Currency } from "@/components/ui/currency"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AddClientModal } from "@/components/add-client-modal"
import { PaymentLogModal } from "@/components/payment-log-modal"
import { AIAdvisorModal } from "@/components/ai-advisor-modal"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from 'uuid'

export default function PisoMateApp() {
  const [clients, setClients] = React.useState<Client[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false)
  const [isAIModalOpen, setIsAIModalOpen] = React.useState(false)
  const [activePayment, setActivePayment] = React.useState<PaymentEntry | null>(null)
  const { toast } = useToast()

  React.useEffect(() => {
    setClients(db.getData().clients)
  }, [])

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalOutstanding = clients.reduce((acc, c) => acc + c.outstandingBalance, 0)
  const totalClients = clients.length

  const handleAddClient = (newClient: Client) => {
    db.addClient(newClient)
    setClients([newClient, ...clients])
    toast({ title: "Client added successfully" })
  }

  const handleDeleteClient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this client? All data will be lost.")) {
      db.deleteClient(id)
      setClients(clients.filter(c => c.id !== id))
      toast({ title: "Client deleted" })
    }
  }

  const handlePaymentClick = (client: Client, payment: PaymentEntry) => {
    if (payment.status === 'paid') {
      if (confirm("Undo this payment?")) {
        const updatedPayments = client.payments.map(p => 
          p.id === payment.id ? { ...p, status: 'due' as const, paidAt: undefined } : p
        )
        const updatedClient = {
          ...client,
          payments: updatedPayments,
          totalPaid: client.totalPaid - payment.amount,
          outstandingBalance: client.outstandingBalance + payment.amount,
        }
        updateClientState(updatedClient)
        toast({ title: "Payment undone" })
      }
      return
    }
    setSelectedClient(client)
    setActivePayment(payment)
    setIsPaymentModalOpen(true)
  }

  const handleConfirmPayment = (amount: number, date: string) => {
    if (!selectedClient || !activePayment) return

    // Ensure balance doesn't go below zero
    const finalAmount = Math.min(amount, selectedClient.outstandingBalance)
    
    const updatedPayments = selectedClient.payments.map(p => 
      p.id === activePayment.id ? { ...p, amount: finalAmount, status: 'paid' as const, paidAt: date } : p
    )

    const updatedClient = {
      ...selectedClient,
      payments: updatedPayments,
      totalPaid: selectedClient.totalPaid + finalAmount,
      outstandingBalance: Math.max(0, selectedClient.outstandingBalance - finalAmount),
    }

    updateClientState(updatedClient)
    toast({ title: "Payment recorded" })
  }

  const handleAddCustomPayment = () => {
    if (!selectedClient) return
    const customPayment: PaymentEntry = {
      id: uuidv4(),
      amount: 0,
      status: 'due',
    }
    setActivePayment(customPayment)
    setIsPaymentModalOpen(true)
  }

  const updateClientState = (updatedClient: Client) => {
    db.updateClient(updatedClient)
    const newClients = clients.map(c => c.id === updatedClient.id ? updatedClient : c)
    setClients(newClients)
    setSelectedClient(updatedClient)
  }

  return (
    <div className="mobile-container pb-24">
      <Toaster />
      
      {/* Dashboard View */}
      {!selectedClient && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <header className="p-6 bg-primary text-primary-foreground sticky top-0 z-10 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight">PisoMate</h1>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary-foreground hover:bg-white/20"
                onClick={() => db.exportData()}
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/10 border-none text-primary-foreground">
                <CardContent className="p-4">
                  <p className="text-xs font-medium opacity-70 mb-1">Outstanding</p>
                  <p className="text-xl font-bold"><Currency amount={totalOutstanding} /></p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-none text-primary-foreground">
                <CardContent className="p-4">
                  <p className="text-xs font-medium opacity-70 mb-1">Total Clients</p>
                  <p className="text-xl font-bold">{totalClients}</p>
                </CardContent>
              </Card>
            </div>
          </header>

          <main className="p-6">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-10 h-12 bg-white" 
                placeholder="Search clients..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Client List</h2>
              {filteredClients.length > 0 ? (
                filteredClients.map(client => (
                  <Card 
                    key={client.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer border-none bg-white"
                    onClick={() => setSelectedClient(client)}
                  >
                    <CardContent className="p-5 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{client.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          Bal: <Currency amount={client.outstandingBalance} className="text-foreground" />
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                          onClick={(e) => handleDeleteClient(client.id, e)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No clients found.</p>
                </div>
              )}
            </div>
          </main>

          <Button 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 p-0"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-8 w-8" />
          </Button>
        </div>
      )}

      {/* Client Detail View */}
      {selectedClient && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300 bg-background min-h-screen">
          <header className="p-6 bg-white border-b sticky top-0 z-10">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)}>
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <h1 className="text-xl font-bold truncate">{selectedClient.name}</h1>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-muted rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Loan</p>
                <Currency amount={selectedClient.loanAmount} className="text-sm" />
              </div>
              <div className="text-center p-2 bg-primary/10 rounded-lg">
                <p className="text-[10px] text-primary uppercase mb-1">Balance</p>
                <Currency amount={selectedClient.outstandingBalance} className="text-sm text-primary" />
              </div>
              <div className="text-center p-2 bg-accent/10 rounded-lg">
                <p className="text-[10px] text-accent-foreground uppercase mb-1">Paid</p>
                <Currency amount={selectedClient.totalPaid} className="text-sm text-accent-foreground" />
              </div>
            </div>

            <Button 
              className="w-full mt-4 bg-primary text-white flex gap-2"
              onClick={() => setIsAIModalOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
              Collection Advice
            </Button>
          </header>

          <main className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Payment Schedule</h2>
              <Button variant="outline" size="sm" onClick={handleAddCustomPayment}>
                <Plus className="h-4 w-4 mr-1" /> Custom
              </Button>
            </div>

            <div className="space-y-3 pb-10">
              {selectedClient.payments.map((payment, index) => (
                <Card 
                  key={payment.id} 
                  className={`border-none ${payment.status === 'paid' ? 'bg-white opacity-60' : 'bg-white'}`}
                  onClick={() => handlePaymentClick(selectedClient, payment)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {payment.status === 'paid' ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-semibold text-lg"><Currency amount={payment.amount} /></p>
                        <p className="text-xs text-muted-foreground">
                          {payment.status === 'paid' ? `Paid: ${payment.paidAt}` : `Installment #${index + 1}`}
                        </p>
                      </div>
                    </div>
                    {payment.status === 'due' && (
                      <Badge variant="outline" className="text-accent border-accent">Log</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedClient.notes && (
              <div className="mt-8 p-4 bg-white rounded-lg">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-2 text-muted-foreground">
                  <Info className="h-4 w-4" /> Notes
                </h3>
                <p className="text-sm italic">{selectedClient.notes}</p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Modals */}
      <AddClientModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        onAdd={handleAddClient} 
      />

      <PaymentLogModal 
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        payment={activePayment}
        onConfirm={handleConfirmPayment}
      />

      <AIAdvisorModal 
        open={isAIModalOpen}
        onOpenChange={setIsAIModalOpen}
        client={selectedClient}
      />
    </div>
  )
}