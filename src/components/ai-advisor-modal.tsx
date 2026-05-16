"use client"

import * as React from "react"
import { Bot, Loader2, Sparkles } from "lucide-react"
import { collectionAdvisor, CollectionAdvisorOutput } from "@/ai/flows/collection-advisor-flow"
import { Client } from "@/lib/types"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"

interface AIAdvisorModalProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIAdvisorModal({ client, open, onOpenChange }: AIAdvisorModalProps) {
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<CollectionAdvisorOutput | null>(null)

  React.useEffect(() => {
    if (open && client) {
      fetchAdvice()
    } else {
      setResult(null)
    }
  }, [open, client])

  async function fetchAdvice() {
    if (!client) return
    setLoading(true)
    try {
      const history = client.payments
        .filter(p => p.status === 'paid')
        .map(p => ({
          amount: p.amount,
          date: p.paidAt || '',
          status: 'paid' as const
        }))

      const input = {
        clientName: client.name,
        originalLoanAmount: client.loanAmount,
        totalPaid: client.totalPaid,
        currentOutstandingBalance: client.outstandingBalance,
        paymentHistory: history,
      }
      
      const advice = await collectionAdvisor(input)
      setResult(advice)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-accent fill-accent" />
            Collection Advisor
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden p-6 pt-0">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Analyzing payment history...</p>
            </div>
          ) : result ? (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Behavior Analysis</h3>
                  <p className="text-foreground leading-relaxed bg-muted/30 p-4 rounded-lg border border-border">
                    {result.summary}
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recommended Strategies</h3>
                  <div className="space-y-3">
                    {result.suggestions.map((s, i) => (
                      <Card key={i} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <p className="text-sm leading-relaxed">{s}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No analysis data available.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}