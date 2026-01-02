"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, ArrowRightLeft, Upload, Repeat, Paperclip, X, Check, DollarSign, Wallet, CreditCard, ChevronDown, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useUser, type Transaction } from "@/lib/user-context"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction
}

export function TransactionDialog({ open, onOpenChange, transaction }: TransactionDialogProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [transactionType, setTransactionType] = useState<"income" | "expense" | "transfer">("expense")
  const [description, setDescription] = useState("")

  // Currency Input State (String representation of formatted value)
  const [amountStr, setAmountStr] = useState("")

  const [category, setCategory] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [cardFunction, setCardFunction] = useState<"debit" | "credit">("debit")

  // Advanced States
  const [isPaid, setIsPaid] = useState(true)
  const [recurrence, setRecurrence] = useState<"single" | "fixed" | "installments">("single")
  const [installments, setInstallments] = useState("2") // Now a string input for free typing
  const [attachment, setAttachment] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [transferTo, setTransferTo] = useState("")

  // UI States
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Recurrence Edit Alert State
  const [showRecurrenceConfirm, setShowRecurrenceConfirm] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)

  const { cards, wallets, categories, addTransaction, updateTransaction, addTransfer } = useUser()
  const { toast } = useToast()

  const selectedCard = cards.find((c) => c.id === paymentMethod)
  const selectedWallet = wallets.find((w) => w.id === paymentMethod)

  // Helper to format currency on type
  const formatCurrency = (value: string) => {
    const numeric = value.replace(/\D/g, "")
    const amount = Number(numeric) / 100
    return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Parse formatted string back to number
  const parseCurrency = (value: string) => {
    if (!value) return 0
    return Number(value.replace(/\./g, "").replace(",", "."))
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Prevent non-numeric logic issues effectively by just taking digits
    setAmountStr(formatCurrency(value))
  }

  // Auto-switch to Credit function logic
  useEffect(() => {
    if (selectedCard) {
      if (!selectedCard.hasDebit && selectedCard.hasCredit) setCardFunction("credit")
      else if (selectedCard.hasDebit && !selectedCard.hasCredit) setCardFunction("debit")
    }
  }, [selectedCard])

  useEffect(() => {
    if (open) {
      if (transaction) {
        setDate(new Date(transaction.date))
        setTransactionType(transaction.type as any)
        setDescription(transaction.description)

        // Init amount string
        setAmountStr(Math.abs(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

        setCategory(transaction.category)
        setPaymentMethod(transaction.account)
        if (transaction.cardFunction) setCardFunction(transaction.cardFunction)

        setIsPaid(transaction.isPaid ?? true)
        setRecurrence(
          transaction.installmentsTotal && transaction.installmentsTotal > 1 ? "installments" :
            transaction.isRecurring ? "fixed" : "single"
        )
        setInstallments(transaction.installmentsTotal?.toString() || "2")
        setAttachment(transaction.attachment || null)
        setNotes(transaction.notes || "")

        if (transaction.isRecurring || (transaction.installmentsTotal && transaction.installmentsTotal > 1) || transaction.notes || transaction.attachment) {
          setShowAdvanced(true)
        }
      } else {
        // Reset defaults
        setDate(new Date())
        setTransactionType("expense")
        setDescription("")
        setAmountStr("")
        setCategory("")
        setPaymentMethod("")
        setCardFunction("debit")
        setIsPaid(true)
        setRecurrence("single")
        setInstallments("") // Default to empty for cleaner input (implies 2 for installments if empty? or validation?)
        // Let's default to "" and handle placeholders logic.
        setAttachment(null)
        setNotes("")
        setTransferTo("")
        setShowAdvanced(false)
      }
    }
  }, [open, transaction])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setAttachment(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    const rawAmount = parseCurrency(amountStr)

    if (!description.trim()) return toast({ title: "Erro", description: "Informe a descrição", variant: "destructive" })
    if (!rawAmount || rawAmount <= 0) return toast({ title: "Erro", description: "Informe um valor válido", variant: "destructive" })

    // Allow saving transfer without category, but expense needs one? 
    // Usually transfers don't have categories in this logic, but let's keep consistency.
    if (transactionType === "expense" && !category) return toast({ title: "Erro", description: "Selecione uma categoria", variant: "destructive" })

    // Prepare payload
    const value = transactionType === "expense" ? -rawAmount : rawAmount

    // Logic: If transfer, standard submit.
    if (transactionType === 'transfer') {
      try {
        setIsSubmitting(true)
        await addTransfer(paymentMethod, transferTo, rawAmount, description, date)
        toast({ title: "Sucesso", description: "Transferência realizada" })
        onOpenChange(false)
      } catch (e: any) {
        toast({ title: "Erro", description: e.message, variant: "destructive" })
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    const payload: any = {
      description,
      amount: value,
      type: transactionType,
      date: date.toISOString(),
      category: category || "Outros",
      account: paymentMethod || "Não especificado",
      cardFunction: selectedCard ? cardFunction : undefined,
      status: isPaid ? "completed" : "pending",
      isPaid,
      isRecurring: recurrence === "fixed",
      // If fixed, use 'installments' (input) as count, but 0/empty means indefinite (handle in context)
      recurrenceCount: recurrence === "fixed" ? (Number(installments) || 0) : 0,
      installmentsTotal: recurrence === "installments" ? Number(installments) : 1,
      installments: recurrence === "installments" ? Number(installments) : 1,
      attachment: attachment || undefined,
      notes
    }

    // Check Recurrence Edit
    if (transaction && (transaction.isRecurring || (transaction.installmentsTotal && transaction.installmentsTotal > 1)) && (transaction.recurrenceId || transaction.installmentId)) {
      // If it's a recurrence update, Ask User
      setPendingPayload(payload)
      setShowRecurrenceConfirm(true)
      return
    }

    // Standard Submit
    processSubmit(payload)
  }

  const processSubmit = async (payload: any, recurrenceMode: 'single' | 'future' = 'single') => {
    setIsSubmitting(true)
    try {
      if (transaction) {
        await updateTransaction(transaction.id, payload, recurrenceMode)
        toast({ title: "Atualizado", description: "Transação salva" })
      } else {
        await addTransaction(payload)
      }
      onOpenChange(false)
      setShowRecurrenceConfirm(false)
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Visual helpers
  const getTypeColor = (type: string) => {
    if (type === 'income') return "text-emerald-500"
    if (type === 'expense') return "text-rose-500"
    return "text-blue-500"
  }

  const getBgColor = (type: string) => {
    if (type === 'income') return "bg-emerald-500/10"
    if (type === 'expense') return "bg-rose-500/10"
    return "bg-blue-500/10"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Full Screen Content - STRICT OVERRIDES */}
      <DialogContent
        className="!fixed !inset-0 !top-0 !left-0 !right-0 !bottom-0 !m-0 !w-full !h-full !max-w-none !rounded-none !border-0 bg-background/95 backdrop-blur-xl transition-all duration-300 flex flex-col p-0 outline-none z-[50] !translate-x-0 !translate-y-0"
      >

        {/* TOP BAR (Toolbar) */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background/50">
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h2 className="text-lg font-semibold">{transaction ? "Editar Transação" : "Nova Transação"}</h2>
          <div className="w-10"></div> {/* Spacer for center alignment */}
        </div>

        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-3xl mx-auto w-full pb-20">

            {/* HEADER AREA: Type & Value */}
            <div className={cn("py-6 px-6 flex flex-col items-center justify-center transition-colors duration-500 border-b border-border/50", getBgColor(transactionType))}>

              {/* Type Pills */}
              <div className="bg-background/80 p-1 rounded-full flex shadow-sm backdrop-blur-sm mb-6 scale-100 border border-border/50">
                <button
                  onClick={() => setTransactionType('expense')}
                  className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", transactionType === 'expense' ? "bg-rose-500 text-white shadow-md" : "hover:bg-black/5 dark:hover:bg-white/5")}
                >Despesa</button>
                <button
                  onClick={() => setTransactionType('income')}
                  className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", transactionType === 'income' ? "bg-emerald-500 text-white shadow-md" : "hover:bg-black/5 dark:hover:bg-white/5")}
                >Receita</button>
                <button
                  onClick={() => setTransactionType('transfer')}
                  className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", transactionType === 'transfer' ? "bg-blue-500 text-white shadow-md" : "hover:bg-black/5 dark:hover:bg-white/5")}
                >Transferência</button>
              </div>

              {/* BIG VALUE INPUT BRL - Adjusted Size */}
              <div className="relative flex justify-center items-center w-full max-w-lg">
                <span className={cn("text-2xl font-medium mr-2 opacity-80 mb-1", getTypeColor(transactionType))}>R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={amountStr}
                  onChange={handleAmountChange}
                  className={cn(
                    "bg-transparent text-4xl font-bold w-full text-center outline-none placeholder:text-muted/20 py-1",
                    getTypeColor(transactionType)
                  )}
                  autoFocus
                />
              </div>
            </div>

            {/* MAIN GRID LAYOUT */}
            <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">

              {/* LEFT COLUMN: Essential Info */}
              <div className="space-y-6">

                {/* Header matching Right Column for Alignment */}
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 border-b pb-2">
                  <span className="h-4 w-4" /> {/* Spacer */}
                  Detalhes
                </h3>

                <div className="space-y-4">
                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={transactionType === 'transfer' ? "Ex: Transf. para Investimento" : "Ex: Mercado Semanal"}
                      className="h-10"
                    />
                  </div>

                  {/* Category & Date Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {transactionType !== 'transfer' && (
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger className="h-10">
                            <div className="flex items-center gap-2 truncate text-sm">
                              {category ? (
                                <>
                                  <span>{categories.find(c => c.name === category)?.icon}</span>
                                  <span>{category}</span>
                                </>
                              ) : <span className="text-muted-foreground">Selecione</span>}
                            </div>
                          </SelectTrigger>
                          <SelectContent className="z-[60]">
                            {categories.filter(c => c.type === transactionType).map(c => (
                              <SelectItem key={c.id} value={c.name} className="py-2.5">
                                <span className="text-lg mr-2">{c.icon}</span>
                                <span className="text-sm">{c.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className={cn("space-y-2", transactionType === 'transfer' && "col-span-2")}>
                      <Label>Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full h-10 justify-start text-left font-normal", !date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date.toLocaleDateString('pt-BR')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[60]" align="start">
                          <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Detalhes opcionais..."
                      className="resize-none min-h-[80px]"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Payment & Details */}
              <div className="space-y-6">

                {/* PAYMENT SECTION - Clean Interface */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 border-b pb-2 mb-5">
                    <Wallet className="h-4 w-4" />
                    Pagamento
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        {transactionType === 'transfer' ? "Origem" : "Conta / Cartão"}
                      </Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="h-10">
                          <div className="flex items-center gap-3">
                            {selectedCard ? <CreditCard className="h-4 w-4 text-primary" /> : selectedWallet ? <Wallet className="h-4 w-4 text-emerald-500" /> : <Wallet className="h-4 w-4 text-muted-foreground" />}
                            <SelectValue placeholder="Selecione a conta" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="z-[60]">
                          <div className="px-2 py-2 text-xs font-semibold text-muted-foreground">Carteiras</div>
                          {wallets.map(w => (
                            <SelectItem key={w.id} value={w.id} className="py-2.5">{w.icon} {w.name}</SelectItem>
                          ))}
                          <div className="px-2 py-2 text-xs font-semibold text-muted-foreground border-t mt-2">Cartões</div>
                          {cards.map(c => (
                            <SelectItem key={c.id} value={c.id} className="py-2.5">💳 {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Transfer Destination */}
                    {transactionType === 'transfer' && (
                      <div className="space-y-2 animate-in slide-in-from-top-2">
                        <Label>Destino</Label>
                        <Select value={transferTo} onValueChange={setTransferTo}>
                          <SelectTrigger className="h-10">
                            <div className="flex items-center gap-3">
                              <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                              <SelectValue placeholder="Para onde vai?" />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="z-[60]">
                            {wallets.map(w => (
                              <SelectItem key={w.id} value={w.id} disabled={paymentMethod === w.id}>{w.icon} {w.name}</SelectItem>
                            ))}
                            {cards.map(c => (
                              <SelectItem key={c.id} value={c.id} disabled={paymentMethod === c.id}>💳 {c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Credit/Debit Toggle */}
                    {selectedCard && selectedCard.hasCredit && selectedCard.hasDebit && transactionType !== 'transfer' && (
                      <div className="space-y-2">
                        <Label>Função</Label>
                        <RadioGroup value={cardFunction} onValueChange={v => setCardFunction(v as any)} className="grid grid-cols-2 gap-2">
                          <div>
                            <RadioGroupItem value="debit" id="r-debit" className="peer sr-only" />
                            <Label htmlFor="r-debit" className="flex items-center justify-center p-2 rounded-md border border-input bg-background hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all">
                              Débito
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="credit" id="r-credit" className="peer sr-only" />
                            <Label htmlFor="r-credit" className="flex items-center justify-center p-2 rounded-md border border-input bg-background hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all">
                              Crédito
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {transactionType !== 'transfer' && (
                      <div className="flex items-center justify-between pt-1">
                        <Label htmlFor="paid" className="cursor-pointer flex items-center gap-2">
                          <Check className={cn("h-4 w-4", isPaid ? "text-emerald-500" : "text-muted-foreground")} />
                          Já está pago?
                        </Label>
                        <Switch id="paid" checked={isPaid} onCheckedChange={setIsPaid} className="data-[state=checked]:bg-emerald-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* RECURRENCE & ATTACHMENTS (Grid of Actions) */}
                {transactionType !== 'transfer' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn("rounded-md border p-4 cursor-pointer transition-all hover:bg-muted/30 relative overflow-visible min-h-[140px] flex flex-col justify-between", recurrence !== 'single' ? "border-primary bg-primary/5" : "border-input")}
                      onClick={() => setRecurrence(prev => prev === 'single' ? 'fixed' : 'single')}>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Repeat className={cn("h-5 w-5", recurrence !== 'single' ? "text-primary" : "text-muted-foreground")} />
                          <span className="font-semibold text-sm">Repetição</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                          {recurrence === 'fixed' ? "Todo mês (Fixa)" : recurrence === 'installments' ? `Parcelado em ${installments}x` : "Apenas uma vez"}
                        </p>
                      </div>

                      {recurrence !== 'single' && (
                        <div className="flex flex-col gap-3 animate-in fade-in" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1 p-1 bg-muted/50 rounded-md w-full">
                            <button onClick={() => setRecurrence('fixed')} className={cn("flex-1 py-1.5 text-xs font-medium rounded-sm transition-all", recurrence === 'fixed' ? "bg-background shadow-sm text-primary" : "opacity-60 hover:opacity-100")}>Fixa (Mensal)</button>
                            <button onClick={() => setRecurrence('installments')} className={cn("flex-1 py-1.5 text-xs font-medium rounded-sm transition-all", recurrence === 'installments' ? "bg-background shadow-sm text-primary" : "opacity-60 hover:opacity-100")}>Parcelada</button>
                          </div>

                          {/* Installments Input (Divides Amount) */}
                          {recurrence === 'installments' && (
                            <div className="flex items-center justify-between bg-background rounded-md border border-input px-2 py-1">
                              <span className="text-xs text-muted-foreground">Parcelas:</span>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  value={installments}
                                  onChange={(e) => setInstallments(e.target.value)}
                                  className="h-7 w-12 text-center bg-transparent border-0 p-0 text-sm focus-visible:ring-0"
                                  placeholder="12"
                                />
                                <span className="text-xs text-muted-foreground font-medium">x</span>
                              </div>
                            </div>
                          )}

                          {/* Fixed Recurrence Count (Custom Count, Same Amount) */}
                          {recurrence === 'fixed' && (
                            <div className="flex items-center justify-between bg-background rounded-md border border-input px-2 py-1">
                              <span className="text-xs text-muted-foreground">Repetições:</span>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  value={installments} // Reusing installments state logic for count to simplify, or create new 'fixedCount' state?
                                  // Let's reuse 'installments' state variable but treat it as 'count' when mode is fixed.
                                  // BUT, user calls it 'installments' for divided, 'fixed' implies infinite usually.
                                  // User wants "informar quantas vezes vai se repetir". 
                                  // If I use 'installments' var, I need to ensure logic distinguishes divided vs full.
                                  onChange={(e) => setInstallments(e.target.value)}
                                  className="h-7 w-12 text-center bg-transparent border-0 p-0 text-sm focus-visible:ring-0"
                                  placeholder="∞"
                                />
                                <span className="text-xs text-muted-foreground font-medium">meses</span>
                              </div>
                            </div>
                          )}
                          {recurrence === 'fixed' && (
                            <p className="text-[10px] text-muted-foreground text-center">
                              {installments && Number(installments) > 0 ? `Repetir por ${installments} meses` : "Repetir mensalmente (Indefinido)"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={cn("rounded-md border p-4 cursor-pointer transition-all hover:bg-muted/30 relative overflow-hidden group", attachment ? "border-primary bg-primary/5" : "border-input")}
                      onClick={() => !attachment && document.getElementById('file-upload-full')?.click()}>

                      <div className="flex items-center gap-2 mb-2 relative z-10">
                        <Paperclip className={cn("h-5 w-5", attachment ? "text-primary" : "text-muted-foreground")} />
                        <span className="font-semibold text-sm">Anexo</span>
                      </div>

                      {!attachment ? (
                        <p className="text-xs text-muted-foreground leading-relaxed relative z-10">
                          Adicionar comprovante ou foto
                        </p>
                      ) : (
                        <div className="relative z-10">
                          <p className="text-xs text-primary font-medium truncate w-[90%]">Arquivo anexado</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6 absolute -top-1 -right-1 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setAttachment(null) }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {attachment && (
                        <img src={attachment} className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale group-hover:grayscale-0 transition-all pointer-events-none" />
                      )}

                      <input id="file-upload-full" type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM FLOATING BAR (Save) */}
        <div className="absolute bottom-6 left-0 right-0 px-6 flex justify-center pointer-events-none">
          <div className="bg-background/80 backdrop-blur-md p-2 rounded-lg shadow-2xl border flex gap-3 pointer-events-auto max-w-md w-full">
            <Button variant="ghost" className="flex-1 h-12 rounded-md hover:bg-muted/50" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              className={cn("flex-[2] h-12 rounded-md text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all",
                transactionType === 'income' ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" :
                  transactionType === 'expense' ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" :
                    "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
              )}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar Transação"}
            </Button>
          </div>
        </div>

        <AlertDialog open={showRecurrenceConfirm} onOpenChange={setShowRecurrenceConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Editar Recorrência</AlertDialogTitle>
              <AlertDialogDescription>
                Esta é uma transação recorrente. Como você deseja aplicar as alterações?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
              <AlertDialogCancel onClick={() => setShowRecurrenceConfirm(false)}>Cancelar</AlertDialogCancel>
              <Button variant="outline" onClick={() => processSubmit(pendingPayload, 'single')}>
                Apenas Esta
              </Button>
              <Button onClick={() => processSubmit(pendingPayload, 'future')}>
                Esta e Futuras
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </DialogContent>
    </Dialog>
  )
}
