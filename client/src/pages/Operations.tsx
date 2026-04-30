import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Operations() {
  const { isAuthenticated, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState<"compra" | "venda">("compra");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fees, setFees] = useState("0");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [broker, setBroker] = useState("");
  const [notes, setNotes] = useState("");
  const utils = trpc.useUtils();

  const { data: ops = [], isLoading } = trpc.operations.list.useQuery(undefined, { enabled: isAuthenticated });

  const createMutation = trpc.operations.create.useMutation({
    onSuccess: () => {
      toast.success("Operação registrada!");
      utils.operations.list.invalidate();
      setOpen(false);
      setTicker(""); setType("compra"); setQuantity(""); setPrice(""); setFees("0"); setBroker(""); setNotes("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.operations.delete.useMutation({
    onSuccess: () => { toast.success("Operação removida."); utils.operations.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const totalBuy = ops.filter(o => o.type === "compra").reduce((acc, o) => acc + parseFloat(String(o.totalValue)), 0);
  const totalSell = ops.filter(o => o.type === "venda").reduce((acc, o) => acc + parseFloat(String(o.totalValue)), 0);
  const totalFees = ops.reduce((acc, o) => acc + parseFloat(String(o.fees || 0)), 0);

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400">Carregando...</div>;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <DollarSign className="w-16 h-16 text-emerald-400 opacity-50" />
        <h2 className="text-xl font-bold text-white">Registro de Operações</h2>
        <p className="text-gray-400 max-w-sm">Faça login para registrar suas operações de compra e venda.</p>
        <Button onClick={() => window.location.href = getLoginUrl()} className="bg-emerald-600 hover:bg-emerald-700">Entrar</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><DollarSign className="w-6 h-6 text-emerald-400" />Operações</h1>
          <p className="text-gray-400 text-sm mt-1">Registro de compras e vendas na B3</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2"><Plus className="w-4 h-4" />Nova Operação</Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
            <DialogHeader><DialogTitle>Registrar Operação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Ticker *</Label>
                  <Input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="Ex: PETR4" className="bg-gray-800 border-gray-700 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-gray-300">Tipo *</Label>
                  <Select value={type} onValueChange={(v) => setType(v as "compra" | "venda")}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="compra" className="text-emerald-400">Compra</SelectItem>
                      <SelectItem value="venda" className="text-red-400">Venda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Quantidade *</Label>
                  <Input value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="100" type="number" className="bg-gray-800 border-gray-700 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-gray-300">Preço *</Label>
                  <Input value={price} onChange={e => setPrice(e.target.value)} placeholder="R$" type="number" step="0.01" className="bg-gray-800 border-gray-700 text-white mt-1" />
                </div>
              </div>
              {quantity && price && (
                <div className="bg-gray-800/50 rounded p-2 text-sm text-center">
                  Total: <strong className="text-white">R$ {(parseFloat(quantity) * parseFloat(price)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Taxas (R$)</Label>
                  <Input value={fees} onChange={e => setFees(e.target.value)} placeholder="0.00" type="number" step="0.01" className="bg-gray-800 border-gray-700 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-gray-300">Data *</Label>
                  <Input value={date} onChange={e => setDate(e.target.value)} type="date" className="bg-gray-800 border-gray-700 text-white mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Corretora</Label>
                <Input value={broker} onChange={e => setBroker(e.target.value)} placeholder="Ex: XP, Rico, Clear..." className="bg-gray-800 border-gray-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-gray-300">Observações</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Motivo da operação, contexto..." className="bg-gray-800 border-gray-700 text-white mt-1" rows={2} />
              </div>
              <Button
                onClick={() => createMutation.mutate({ ticker, type, quantity: parseInt(quantity), price: parseFloat(price), fees: parseFloat(fees || "0"), operationDate: date, broker: broker || undefined, notes: notes || undefined })}
                disabled={!ticker || !quantity || !price || createMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {createMutation.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-emerald-400">R$ {totalBuy.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            <div className="text-xs text-gray-400 mt-1">Total Comprado</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-red-400">R$ {totalSell.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            <div className="text-xs text-gray-400 mt-1">Total Vendido</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-yellow-400">R$ {totalFees.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            <div className="text-xs text-gray-400 mt-1">Total em Taxas</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center text-gray-500 py-12">Carregando operações...</div>
      ) : ops.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma operação registrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ops.map((op: any) => (
            <Card key={op.id} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {op.type === "compra"
                      ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                      : <TrendingDown className="w-4 h-4 text-red-400" />}
                    <span className="font-bold text-white font-mono">{op.ticker}</span>
                    <Badge className={op.type === "compra" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                      {op.type.toUpperCase()}
                    </Badge>
                    <span className="text-gray-400 text-sm">{parseInt(String(op.quantity)).toLocaleString("pt-BR")} × R$ {parseFloat(String(op.price)).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-white font-bold">R$ {parseFloat(String(op.totalValue)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                      <div className="text-xs text-gray-500">{new Date(op.operationDate).toLocaleDateString("pt-BR")}{op.broker ? ` · ${op.broker}` : ""}</div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-gray-600 hover:text-red-400" onClick={() => deleteMutation.mutate({ id: op.id })}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {op.notes && <p className="text-xs text-gray-500 mt-2 ml-7">{op.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
