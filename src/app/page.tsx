
"use client"

import * as React from "react"
import { 
  Search, Plus, Trash2, ArrowLeft, ChevronRight, History, Calendar, 
  PhilippinePeso, Clock, Filter, Settings, Download, Upload, 
  AlertTriangle, CheckCircle2, Info, Edit2, TrendingUp, DollarSign
} from "lucide-react"
import { db } from "@/lib/db"
import { Client, PaymentHistoryItem, AppData } from "@/lib/types"
import { Currency } from "@/components/ui/currency"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AddClientModal } from "@/components/add-client-modal"
import { PaymentLogModal } from "@/components/payment-log-modal"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from 'uuid'
import { format, isBefore, startOfDay } from "date-fns"
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * Utility to derive accurate client statistics from their payment history.
 * This is the Single Source of Truth for the application.
 */
function getClientStats(client: Client) {
  const totalPaid = client.history.reduce((sum, item) => sum + item.amount, 0)
  const totalRepayment = client.initialBalance
  const remainingBalance = Math.max(0, totalRepayment - totalPaid)
  const isSettled = remainingBalance <= 0
  
  const now = startOfDay(new Date())
  const dueDate = client.dueDate ? startOfDay(new Date(client.dueDate)) : null
  const isOverdue = !isSettled && dueDate && isBefore(dueDate, now)
  
  const progress = Math.min(100, (totalPaid / totalRepayment) * 100)
  
  const interestAmount = client.initialBalance - client.loanAmount
  const interestCollected = Math.min(interestAmount, totalPaid)
  
  return { 
    totalPaid, 
    remainingBalance, 
    isSettled, 
    isOverdue, 
    progress, 
    interestAmount,
    interestCollected,
    totalRepayment,
    dueDate
  }
}

export default function XyLoanApp() {
  const [clients, setClients] = React.useState<Client[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filter, setFilter] = React.useState("all")
  const [sortBy, setSortBy] = React.useState("balance_desc")
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isCustomPaymentModalOpen, setIsCustomPaymentModalOpen] = React.useState(false)
  const [editingPayment, setEditingPayment] = React.useState<PaymentHistoryItem | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ type: 'client' | 'payment', id: string } | null>(null)
  
  const { toast } = useToast()

  React.useEffect(() => {
    const data = db.getData()
    const repairedClients = data.clients.map(c => ({
      ...c,
      interestRate: c.interestRate ?? 10,
      initialBalance: c.initialBalance ?? (c.loanAmount * 1.1),
      history: c.history ?? []
    }))
    setClients(repairedClients)

    // Handle Android Hardware Back Button
    if (Capacitor.isNativePlatform()) {
      const backListener = App.addListener('backButton', () => {
        if (isAddModalOpen) setIsAddModalOpen(false)
        else if (isCustomPaymentModalOpen) setIsCustomPaymentModalOpen(false)
        else if (editingPayment) setEditingPayment(null)
        else if (deleteConfirm) setDeleteConfirm(null)
        else if (selectedClient) setSelectedClient(null)
        else if (isSettingsOpen) setIsSettingsOpen(false)
        else {
          App.exitApp()
        }
      })

      return () => {
        backListener.then(l => l.remove())
      }
    }
  }, [isAddModalOpen, isCustomPaymentModalOpen, editingPayment, deleteConfirm, selectedClient, isSettingsOpen])

  const stats = React.useMemo(() => {
    return clients.reduce((acc, client) => {
      const s = getClientStats(client)
      return {
        totalLent: acc.totalLent + client.loanAmount,
        totalCollected: acc.totalCollected + s.totalPaid,
        totalOutstanding: acc.totalOutstanding + s.remainingBalance,
        totalSettled: acc.totalSettled + (s.isSettled ? 1 : 0),
        totalOngoing: acc.totalOngoing + (!s.isSettled ? 1 : 0),
        totalOverdue: acc.totalOverdue + (s.isOverdue ? 1 : 0),
        interestCollected: acc.interestCollected + s.interestCollected,
        totalRepaymentTarget: acc.totalRepaymentTarget + s.totalRepayment
      }
    }, { 
      totalLent: 0, totalCollected: 0, totalOutstanding: 0, 
      totalSettled: 0, totalOngoing: 0, totalOverdue: 0,
      interestCollected: 0, totalRepaymentTarget: 0
    })
  }, [clients])

  const collectionRate = stats.totalRepaymentTarget > 0 
    ? (stats.totalCollected / stats.totalRepaymentTarget) * 100 
    : 0

  const filteredAndSortedClients = React.useMemo(() => {
    let result = clients.filter(c => {
      const searchMatch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const s = getClientStats(c)
      if (filter === 'ongoing') return searchMatch && !s.isSettled
      if (filter === 'settled') return searchMatch && s.isSettled
      if (filter === 'overdue') return searchMatch && s.isOverdue
      return searchMatch
    })

    result.sort((a, b) => {
      const sA = getClientStats(a)
      const sB = getClientStats(b)

      switch (sortBy) {
        case 'balance_desc': return sB.remainingBalance - sA.remainingBalance
        case 'balance_asc': return sA.remainingBalance - sB.remainingBalance
        case 'name_asc': return a.name.localeCompare(b.name)
        case 'name_desc': return b.name.localeCompare(a.name)
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'recent_payment': 
          const lastA = a.history[0] ? new Date(a.history[0].date).getTime() : 0
          const lastB = b.history[0] ? new Date(b.history[0].date).getTime() : 0
          return lastB - lastA
        default: return 0
      }
    })

    return result
  }, [clients, searchQuery, filter, sortBy])

  const handleAddClient = (newClient: Client) => {
    db.addClient(newClient)
    setClients([newClient, ...clients])
    toast({ title: "Client added successfully" })
  }

  const handleDeleteClient = (id: string) => {
    db.deleteClient(id)
    setClients(clients.filter(c => c.id !== id))
    toast({ title: "Client deleted" })
    setDeleteConfirm(null)
  }

  const updateClientState = (updatedClient: Client) => {
    const s = getClientStats(updatedClient)
    const syncedClient = {
      ...updatedClient,
      totalPaid: s.totalPaid,
      outstandingBalance: s.remainingBalance
    }
    
    db.updateClient(syncedClient)
    setClients(prev => prev.map(c => c.id === syncedClient.id ? syncedClient : c))
    if (selectedClient?.id === syncedClient.id) {
      setSelectedClient(syncedClient)
    }
  }

  const handleRegularPayment = () => {
    if (!selectedClient) return
    const s = getClientStats(selectedClient)
    if (s.isSettled) return

    const regularAmount = selectedClient.initialBalance / 22
    const finalAmount = Math.min(regularAmount, s.remainingBalance)
    
    const historyItem: PaymentHistoryItem = {
      id: uuidv4(),
      amount: finalAmount,
      type: 'regular',
      date: new Date().toISOString(),
    }

    const updatedClient: Client = {
      ...selectedClient,
      history: [historyItem, ...selectedClient.history]
    }

    updateClientState(updatedClient)
    toast({ 
      title: "Regular Payment Recorded",
      description: `₱${finalAmount.toFixed(2)} deducted.` 
    })
  }

  const handlePaymentConfirm = (amount: number, notes?: string, id?: string) => {
    if (!selectedClient) return
    const s = getClientStats(selectedClient)
    
    if (id) {
      const updatedHistory = selectedClient.history.map(p => 
        p.id === id ? { ...p, amount, notes, date: p.date } : p
      )
      const updatedClient: Client = { ...selectedClient, history: updatedHistory }
      updateClientState(updatedClient)
      toast({ title: "Payment updated" })
    } else {
      if (s.isSettled) return
      const finalAmount = Math.min(amount, s.remainingBalance)
      const historyItem: PaymentHistoryItem = {
        id: uuidv4(),
        amount: finalAmount,
        type: 'custom',
        date: new Date().toISOString(),
        notes: notes
      }
      const updatedClient: Client = { ...selectedClient, history: [historyItem, ...selectedClient.history] }
      updateClientState(updatedClient)
      toast({ title: "Custom Payment Recorded", description: `₱${finalAmount.toFixed(2)} deducted.` })
    }
    setEditingPayment(null)
  }

  const handleDeleteHistoryItem = (id: string) => {
    if (!selectedClient) return
    const updatedHistory = selectedClient.history.filter(h => h.id !== id)
    const updatedClient: Client = { ...selectedClient, history: updatedHistory }
    updateClientState(updatedClient)
    toast({ title: "Payment record deleted" })
    setDeleteConfirm(null)
  }

  const handleExport = () => {
    db.exportData()
    toast({ title: "Data exported successfully" })
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const success = await db.importData(file)
    if (success) {
      const data = db.getData()
      setClients(data.clients)
      toast({ title: "Data imported successfully" })
    } else {
      toast({ title: "Import failed", variant: "destructive" })
    }
    e.target.value = ''
  }

  const handleClearAll = () => {
    db.clearAllData()
    setClients([])
    setIsSettingsOpen(false)
    toast({ title: "All data cleared" })
    setDeleteConfirm(null)
  }

  const selectedClientStats = selectedClient ? getClientStats(selectedClient) : null

  return (
    <div className="mobile-container pb-24">
      <Toaster />
      
      {!selectedClient && !isSettingsOpen && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <header className="p-6 bg-primary text-primary-foreground sticky top-0 z-10 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight">Xy Loan</h1>
                <p className="text-[10px] font-medium opacity-90 mt-0.5">Private Loan & Payment Tracker</p>
                <p className="text-[8px] opacity-70 leading-tight mt-1 max-w-[220px]">
                  A local, offline-first application for securely tracking personal loans, payments, balances, and collections.
                </p>
              </div>
              <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card className="bg-white/10 border-none text-primary-foreground">
                <CardContent className="p-3">
                  <p className="text-[10px] font-medium opacity-70 mb-1">Total Lent</p>
                  <p className="text-lg font-bold"><Currency amount={stats.totalLent} /></p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-none text-primary-foreground">
                <CardContent className="p-3">
                  <p className="text-[10px] font-medium opacity-70 mb-1">Total Collected</p>
                  <p className="text-lg font-bold"><Currency amount={stats.totalCollected} /></p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-none text-primary-foreground">
                <CardContent className="p-3">
                  <p className="text-[10px] font-medium opacity-70 mb-1">Outstanding</p>
                  <p className="text-lg font-bold"><Currency amount={stats.totalOutstanding} /></p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-none text-primary-foreground">
                <CardContent className="p-3">
                  <p className="text-[10px] font-medium opacity-70 mb-1">Collection Rate</p>
                  <p className="text-lg font-bold">{collectionRate.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Badge className="bg-white/20 hover:bg-white/30 text-[10px] whitespace-nowrap">Int. Collected: ₱{stats.interestCollected.toLocaleString()}</Badge>
              <Badge className="bg-white/20 hover:bg-white/30 text-[10px] whitespace-nowrap">Active: {stats.totalOngoing}</Badge>
              <Badge className="bg-white/20 hover:bg-white/30 text-[10px] whitespace-nowrap">Overdue: {stats.totalOverdue}</Badge>
              <Badge className="bg-white/20 hover:bg-white/30 text-[10px] whitespace-nowrap">Settled: {stats.totalSettled}</Badge>
            </div>
          </header>

          <main className="p-6">
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-10 h-12 bg-white" 
                  placeholder="Search name or notes..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col gap-3">
                <Tabs value={filter} onValueChange={setFilter} className="w-full">
                  <TabsList className="grid grid-cols-4 w-full h-10">
                    <TabsTrigger value="all" className="text-[10px]">All</TabsTrigger>
                    <TabsTrigger value="ongoing" className="text-[10px]">Ongoing</TabsTrigger>
                    <TabsTrigger value="settled" className="text-[10px]">Settled</TabsTrigger>
                    <TabsTrigger value="overdue" className="text-[10px]">Overdue</TabsTrigger>
                  </TabsList>
                </Tabs>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full bg-white h-10 text-xs">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3 w-3" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balance_desc">Highest Balance</SelectItem>
                    <SelectItem value="balance_asc">Lowest Balance</SelectItem>
                    <SelectItem value="name_asc">Name A-Z</SelectItem>
                    <SelectItem value="name_desc">Name Z-A</SelectItem>
                    <SelectItem value="newest">Newest Loan</SelectItem>
                    <SelectItem value="oldest">Oldest Loan</SelectItem>
                    <SelectItem value="recent_payment">Recent Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredAndSortedClients.length > 0 ? (
                filteredAndSortedClients.map(client => {
                  const s = getClientStats(client)
                  return (
                    <Card 
                      key={client.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer border-none bg-white overflow-hidden"
                      onClick={() => setSelectedClient(client)}
                    >
                      <CardContent className="p-0">
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-3">
                            <div className="max-w-[80%]">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-lg truncate">{client.name}</h3>
                                {s.isSettled ? (
                                  <Badge className="bg-green-500 hover:bg-green-500 h-5 px-1.5 text-[9px]">Settled</Badge>
                                ) : s.isOverdue ? (
                                  <Badge variant="destructive" className="animate-pulse h-5 px-1.5 text-[9px]">Overdue</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-orange-500 border-orange-500 h-5 px-1.5 text-[9px]">Ongoing</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Bal: <Currency amount={s.remainingBalance} className="text-foreground" />
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirm({ type: 'client', id: client.id })
                              }}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Progress</span>
                              <span>{s.progress.toFixed(1)}%</span>
                            </div>
                            <Progress value={s.progress} className="h-1.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-white/50 rounded-xl border-2 border-dashed">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No loans match your criteria.</p>
                </div>
              )}
            </div>
          </main>

          <Button 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 p-0 z-50"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-8 w-8 text-white" />
          </Button>
        </div>
      )}

      {selectedClient && selectedClientStats && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300 bg-background min-h-screen">
          <header className="p-6 bg-white border-b sticky top-0 z-20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 max-w-full overflow-hidden">
                <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)}>
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <div className="flex flex-col min-w-0">
                  <h1 className="text-xl font-bold truncate">{selectedClient.name}</h1>
                  <div className="flex gap-2 items-center mt-1 flex-wrap">
                    {selectedClientStats.isSettled ? (
                      <Badge className="bg-green-500 text-[10px]">Settled</Badge>
                    ) : selectedClientStats.isOverdue ? (
                      <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-500 border-orange-500 text-[10px]">Ongoing</Badge>
                    )}
                    {selectedClient.dueDate && !selectedClientStats.isSettled && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                        <Calendar className="h-3 w-3" />
                        {selectedClientStats.isOverdue 
                          ? `${Math.abs(Math.floor((new Date().getTime() - new Date(selectedClient.dueDate).getTime()) / (1000 * 60 * 60 * 24)))} days overdue`
                          : `Due in ${Math.floor((new Date(selectedClient.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) + 1} days`
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Principal</p>
                  <Currency amount={selectedClient.loanAmount} className="text-sm font-bold" />
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Interest ({selectedClient.interestRate}%)</p>
                  <Currency amount={selectedClientStats.interestAmount} className="text-sm font-bold text-destructive" />
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-[10px] text-primary uppercase mb-1">Repayment Target</p>
                  <Currency amount={selectedClientStats.totalRepayment} className="text-sm font-bold text-primary" />
                </div>
                <div className="p-3 bg-accent/10 rounded-lg">
                  <p className="text-[10px] text-accent-foreground uppercase mb-1">Total Paid</p>
                  <Currency amount={selectedClientStats.totalPaid} className="text-sm font-bold text-accent-foreground" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-primary">
                  <span>Collection Progress</span>
                  <span>{selectedClientStats.progress.toFixed(1)}%</span>
                </div>
                <Progress value={selectedClientStats.progress} className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>₱{selectedClientStats.totalPaid.toLocaleString()} paid</span>
                  <span>₱{selectedClientStats.remainingBalance.toLocaleString()} left</span>
                </div>
              </div>

              {!selectedClientStats.isSettled && (
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
            </div>
          </header>

          <main className="p-6 pb-24">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-bold">Timeline</h2>
              </div>
              <Badge variant="secondary">{selectedClient.history.length} Transactions</Badge>
            </div>

            <div className="space-y-4 relative">
              {selectedClient.history.length > 0 && (
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-muted z-0" />
              )}

              {selectedClient.history.length > 0 ? (
                selectedClient.history.map((item) => (
                  <div key={item.id} className="relative z-10 flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <Card className="flex-1 border-none shadow-sm bg-white overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Currency amount={item.amount} className="text-lg font-bold" />
                              <Badge variant="secondary" className="text-[8px] uppercase px-1 h-4">
                                {item.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(item.date), 'MMM dd')}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(item.date), 'hh:mm a')}</span>
                            </div>
                            {item.notes && <p className="text-xs italic mt-2 text-muted-foreground border-l-2 border-primary/20 pl-2 break-words">"{item.notes}"</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingPayment(item)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm({ type: 'payment', id: item.id })}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-white/50 rounded-lg border-2 border-dashed">
                  <p className="text-sm">No payments recorded yet.</p>
                </div>
              )}
              
              <div className="relative z-10 flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 py-2">
                  <p className="text-sm font-bold">Loan Created</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(selectedClient.createdAt), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>

            {(selectedClient.notes || selectedClient.phone || selectedClient.address) && (
              <div className="mt-8 space-y-4">
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-4 space-y-4">
                    {selectedClient.phone && (
                      <div>
                        <h3 className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Contact Number</h3>
                        <p className="text-sm">{selectedClient.phone}</p>
                      </div>
                    )}
                    {selectedClient.address && (
                      <div>
                        <h3 className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Home Address</h3>
                        <p className="text-sm">{selectedClient.address}</p>
                      </div>
                    )}
                    {selectedClient.notes && (
                      <div>
                        <h3 className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Loan Remarks</h3>
                        <p className="text-sm italic">{selectedClient.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10 space-y-3">
              <h3 className="text-xs font-bold uppercase text-primary">Loan Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Average Payment</p>
                  <p className="text-sm font-bold">
                    ₱{selectedClient.history.length > 0 
                      ? (selectedClientStats.totalPaid / selectedClient.history.length).toFixed(2) 
                      : '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Last Transaction</p>
                  <p className="text-sm font-bold">
                    {selectedClient.history[0] ? format(new Date(selectedClient.history[0].date), 'MMM dd') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {isSettingsOpen && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 bg-background min-h-screen">
          <header className="p-6 bg-white border-b sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)}>
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <h1 className="text-xl font-bold">Settings</h1>
            </div>
          </header>

          <main className="p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Database Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExport}>
                    <Download className="h-4 w-4" /> Export Data (JSON)
                  </Button>
                  <div className="relative">
                    <Input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      accept=".json" 
                      onChange={handleImport}
                    />
                    <Button variant="outline" className="w-full justify-start gap-2 pointer-events-none">
                      <Upload className="h-4 w-4" /> Import Data (JSON)
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start gap-2" 
                    onClick={() => setDeleteConfirm({ type: 'client', id: 'ALL_DATA' })}
                  >
                    <AlertTriangle className="h-4 w-4" /> Clear All Local Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">About Xy Loan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-base">Xy Loan</h3>
                  <p className="text-xs font-semibold text-primary">Private Loan & Payment Tracker</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A local, offline-first application for securely tracking personal loans, payments, balances, and collections.
                </p>
                <div className="pt-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Developed by</p>
                  <p className="text-sm font-bold">Xyril Garret Go</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-[10px] text-primary leading-tight">
                    <strong>Local-Only Storage:</strong> Your loan records are stored locally on this device. No cloud sync or external servers are used. Please use "Export Data" regularly to create manual backups.
                  </p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      )}

      <AddClientModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        onAdd={handleAddClient} 
      />

      <PaymentLogModal 
        open={!!editingPayment || isCustomPaymentModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCustomPaymentModalOpen(false)
            setEditingPayment(null)
          }
        }}
        onConfirm={handlePaymentConfirm}
        maxAmount={selectedClientStats?.remainingBalance || 0}
        editingPayment={editingPayment}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="w-[90%] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.id === 'ALL_DATA' 
                ? "This will PERMANENTLY delete all loan records on this device. This cannot be undone."
                : deleteConfirm?.type === 'client' 
                  ? "This will delete the client and all their transaction history."
                  : "This payment will be removed and the balance will be restored."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="flex-1 bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm?.id === 'ALL_DATA') handleClearAll()
                else if (deleteConfirm?.type === 'client') handleDeleteClient(deleteConfirm.id)
                else if (deleteConfirm?.type === 'payment') handleDeleteHistoryItem(deleteConfirm.id)
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
