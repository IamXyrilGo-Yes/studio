"use client"

import * as React from "react"
import { Search, Plus, Trash2, ArrowLeft, ChevronRight, History, Calendar, PhilippinePeso, Clock } from "lucide-react"
import { db } from "@/lib/db"
import { Client, PaymentHistoryItem } from "@/lib/types"
import { Currency } from "@/components/ui/currency"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AddClientModal } from "@/components/add-client-modal"
import { PaymentLogModal } from "@/components/payment-log-modal"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from 'uuid'
import { format } from "date-fns"

export default function PisoMateApp() {
  const [clients, setClients] = React.useState<Client[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isCustomPaymentModalOpen, setIsCustomPaymentModalOpen] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    setClients(db.getData().clients)
  }, [])

  const filteredClients = clients
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aSettled = a.outstandingBalance <= 0
      const bSettled = b.outstandingBalance <= 0
      if (aSettled === bSettled) return 0
      return aSettled ? 1 : -1
    })

  const totalOutstanding = clients.reduce((acc, c) => acc + c.outstandingBalance, 0)
  const totalCollected = clients.reduce((acc, c) => acc + c.totalPaid, 0)
  const totalClients = clients.length
  const totalSettled = clients.filter(c => c.outstandingBalance <= 0).length

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

  const updateClientState = (updatedClient: Client) => {
    db.updateClient(updatedClient)
    const newClients = clients.map(c => c.id === updatedClient.id ? updatedClient : c)
    setClients(newClients)
    setSelectedClient(updatedClient)
  }

  const handleRegularPayment = () => {
    if (!selectedClient) return
    
    // Formula: Regular Payment = (Loan Amount * 1.1) / 22
    const regularAmount = selectedClient.initialBalance / 22
    const finalAmount = Math.min(regularAmount, selectedClient.outstandingBalance)
    
    const historyItem: PaymentHistoryItem = {
      id: uuidv4(),
      amount: finalAmount,
      type: 'regular',
      date: new Date().toISOString(),
    }

    const updatedClient: Client = {
      ...selectedClient,
      totalPaid: selectedClient.totalPaid + finalAmount,
      outstandingBalance: Math.max(0, selectedClient.outstandingBalance - finalAmount),
      history: [historyItem, ...selectedClient.history]
    }

    updateClientState(updatedClient)
    toast({ 
      title: "Regular Payment Recorded",
      description: `₱${finalAmount.toFixed(2)} deducted.` 
    })
  }

  const handleCustomPaymentConfirm = (amount: number, notes?: string) => {
    if (!selectedClient) return
    
    const finalAmount = Math.min(amount, selectedClient.outstandingBalance)
    
    const historyItem: PaymentHistoryItem = {
      id: uuidv4(),
      amount: finalAmount,
      type: 'custom',
      date: new Date().toISOString(),
      notes: notes
    }

    const updatedClient: Client = {
      ...selectedClient,
      totalPaid: selectedClient.totalPaid + finalAmount,
      outstandingBalance: Math.max(0, selectedClient.outstandingBalance - finalAmount),
      history: [historyItem, ...selectedClient.history]
    }

    updateClientState(updatedClient)
    toast({ 
      title: "Custom Payment Recorded",
      description: `₱${finalAmount.toFixed(2)} deducted.` 
    })
  }

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedClient) return

    if (confirm("Remove this payment record? Balance will be restored.")) {
      const itemToDelete = selectedClient.history.find(h => h.id === id)
      if (!itemToDelete) return

      const updatedHistory = selectedClient.history.filter(h => h.id !== id)
      const updatedClient: Client = {
        ...selectedClient,
        totalPaid: selectedClient.totalPaid - itemToDelete.amount,
        outstandingBalance: selectedClient.outstandingBalance + itemToDelete.amount,
        history: updatedHistory
      }

      updateClientState(updatedClient)
      toast({ title: "Payment record deleted" })
    }
  }

  return (
    <div className="mobile-container pb-24">
      <Toaster />
      
      {/* Dashboard View */}
      {!selectedClient && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <header className="p-6 bg-primary text-primary-foreground sticky top-0 z-10 shadow-md">
            <h1 className="text-2xl font-bold tracking-tight mb-6">PisoMate</h1>
            
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-white/10 border-none text-primary-foreground">
                <CardContent className="p-3">
                  <p className="text-[10px] font-medium opacity-70 mb-1">Total Collected</p>
                  <p className="text-lg font-bold"><Currency amount={totalCollected} /></p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-none text-primary-foreground">
                <CardContent className="p-3">
                  <p className="text-[10px] font-medium opacity-70 mb-1">Outstanding</p>
                  <p className="text-lg font-bold"><Currency amount={totalOutstanding} /></p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-none text-primary-foreground">
                <CardContent className="p-3">
                  <p className="text-[10px] font-medium opacity-70 mb-1">Clients</p>
                  <p className="text-lg font-bold">{totalClients}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-none text-primary-foreground">
                <CardContent className="p-3">
                  <p className="text-[10px] font-medium opacity-70 mb-1">Settled</p>
                  <p className="text-lg font-bold">{totalSettled}</p>
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
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client List</h2>
              {filteredClients.length > 0 ? (
                filteredClients.map(client => {
                  const isSettled = client.outstandingBalance <= 0
                  return (
                    <Card 
                      key={client.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer border-none bg-white overflow-hidden"
                      onClick={() => setSelectedClient(client)}
                    >
                      <CardContent className="p-0">
                        <div className="p-5 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg">{client.name}</h3>
                              <Badge variant={isSettled ? "default" : "outline"} className={isSettled ? "bg-green-500 hover:bg-green-500" : "text-orange-500 border-orange-500"}>
                                {isSettled ? "Settled" : "Ongoing"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
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
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
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
          <header className="p-6 bg-white border-b sticky top-0 z-20">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)}>
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold truncate">{selectedClient.name}</h1>
                <Badge variant={selectedClient.outstandingBalance <= 0 ? "default" : "outline"} className={`w-fit mt-1 ${selectedClient.outstandingBalance <= 0 ? "bg-green-500" : "text-orange-500 border-orange-500"}`}>
                  {selectedClient.outstandingBalance <= 0 ? "Settled" : "Ongoing"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Loan Amount</p>
                <Currency amount={selectedClient.loanAmount} className="text-sm font-bold" />
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Initial (w/ Int)</p>
                <Currency amount={selectedClient.initialBalance} className="text-sm font-bold" />
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-[10px] text-primary uppercase mb-1">Current Balance</p>
                <Currency amount={selectedClient.outstandingBalance} className="text-sm font-bold text-primary" />
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <p className="text-[10px] text-accent-foreground uppercase mb-1">Total Paid</p>
                <Currency amount={selectedClient.totalPaid} className="text-sm font-bold text-accent-foreground" />
              </div>
            </div>

            {selectedClient.outstandingBalance > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="h-12 text-sm font-bold" 
                  onClick={handleRegularPayment}
                >
                  Regular (₱{(selectedClient.initialBalance / 22).toFixed(0)})
                </Button>
                <Button 
                  variant="outline"
                  className="h-12 text-sm font-bold border-primary text-primary" 
                  onClick={() => setIsCustomPaymentModalOpen(true)}
                >
                  Custom
                </Button>
              </div>
            )}
          </header>

          <main className="p-6 pb-24">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-bold">Payment History</h2>
            </div>

            <div className="space-y-3">
              {selectedClient.history.length > 0 ? (
                selectedClient.history.map((item) => (
                  <Card key={item.id} className="border-none shadow-sm bg-white">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Currency amount={item.amount} className="text-lg font-bold" />
                            <Badge variant="secondary" className="text-[10px] uppercase h-4 px-1">
                              {item.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(item.date), 'MMM dd, yyyy')}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(item.date), 'hh:mm a')}</span>
                          </div>
                          {item.notes && <p className="text-xs italic mt-2 text-muted-foreground border-l-2 pl-2">"{item.notes}"</p>}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-white/50 rounded-lg border-2 border-dashed">
                  <p className="text-sm">No payments recorded yet.</p>
                </div>
              )}
            </div>

            {selectedClient.notes && (
              <div className="mt-8 p-4 bg-white rounded-lg shadow-sm border border-muted">
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Loan Notes</h3>
                <p className="text-sm italic text-foreground">{selectedClient.notes}</p>
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

      {selectedClient && (
        <PaymentLogModal 
          open={isCustomPaymentModalOpen}
          onOpenChange={setIsCustomPaymentModalOpen}
          onConfirm={handleCustomPaymentConfirm}
          maxAmount={selectedClient.outstandingBalance}
        />
      )}
    </div>
  )
}
