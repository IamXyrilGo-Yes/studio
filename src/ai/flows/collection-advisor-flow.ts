'use server';
/**
 * @fileOverview An AI-powered collection advisor flow.
 *
 * - collectionAdvisor - A function that provides personalized collection suggestions.
 * - CollectionAdvisorInput - The input type for the collectionAdvisor function.
 * - CollectionAdvisorOutput - The return type for the collectionAdvisor function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PaymentHistoryEntrySchema = z.object({
  amount: z.number().describe('The amount of the payment.'),
  date: z.string().describe('The date the payment was due or paid (YYYY-MM-DD format).'),
  status: z.enum(['paid', 'due', 'overdue']).describe('The status of the payment (paid, due, or overdue).'),
});

const CollectionAdvisorInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  originalLoanAmount: z.number().describe('The original total amount of the loan in Philippine Pesos (₱).'),
  totalPaid: z.number().describe('The total amount the client has paid so far in Philippine Pesos (₱).'),
  currentOutstandingBalance: z.number().describe('The current remaining outstanding balance of the loan in Philippine Pesos (₱).'),
  paymentHistory: z.array(PaymentHistoryEntrySchema).describe('A detailed history of all scheduled and paid payments.'),
});
export type CollectionAdvisorInput = z.infer<typeof CollectionAdvisorInputSchema>;

const CollectionAdvisorOutputSchema = z.object({
  summary: z.string().describe("A brief summary of the client's payment behavior."),
  suggestions: z.array(z.string()).describe('A list of personalized suggestions for how to approach the client for payment.'),
});
export type CollectionAdvisorOutput = z.infer<typeof CollectionAdvisorOutputSchema>;

export async function collectionAdvisor(input: CollectionAdvisorInput): Promise<CollectionAdvisorOutput> {
  return collectionAdvisorFlow(input);
}

const collectionAdvisorPrompt = ai.definePrompt({
  name: 'collectionAdvisorPrompt',
  input: { schema: CollectionAdvisorInputSchema },
  output: { schema: CollectionAdvisorOutputSchema },
  prompt: `You are an AI-powered collection advisor for a small lending business in the Philippines. Your goal is to provide personalized and effective strategies to help collect payments from clients. Analyze the provided client payment history and suggest a collection approach that is both firm and understanding. The currency used is Philippine Peso (₱).

Consider the client's payment patterns, the current outstanding balance, and any overdue payments. Provide actionable advice.

Client Information:
Client Name: {{{clientName}}}
Original Loan Amount: ₱{{{originalLoanAmount}}}
Total Paid: ₱{{{totalPaid}}}
Current Outstanding Balance: ₱{{{currentOutstandingBalance}}}

Payment History:
{{#if paymentHistory}}
{{#each paymentHistory}}
- Amount: ₱{{{this.amount}}}, Date: {{{this.date}}}, Status: {{{this.status}}}
{{/each}}
{{else}}
No payment history available.
{{/if}}

Based on the information above, provide:
1. A brief summary of the client's payment behavior.
2. A list of personalized collection strategies to approach this client.

Output should be in JSON format matching the CollectionAdvisorOutputSchema.`,
});

const collectionAdvisorFlow = ai.defineFlow(
  {
    name: 'collectionAdvisorFlow',
    inputSchema: CollectionAdvisorInputSchema,
    outputSchema: CollectionAdvisorOutputSchema,
  },
  async (input) => {
    const { output } = await collectionAdvisorPrompt(input);
    return output!;
  }
);
