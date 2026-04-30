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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, Minus, Target, ShieldAlert, BarChart2,
  Plus, CheckCircle, XCircle, BookOpen, Zap, Award
} from "lucide-react";

type Direction = "compra" | "venda" | "neutro";
type Status = "aberta" | "fechada" | "cancelada";

function DirectionBadge({ direction }: { direction: Direction }) {
  if (direction === "compra") return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><TrendingUp className="w-3 h-3 mr-1" />COMPRA</Badge>;
  if (direction === "venda") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><TrendingDown className="w-3 h-3 mr-1" />VENDA</Badge>;
  return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30"><Minus className="w-3 h-3 mr-1" />NEUTRO</Badge>;
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "aberta") return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Aberta</Badge>;
  if (status === "fechada") return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Fechada</Badge>;
  return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Cancelada</Badge>;
}

function CloseInsightDialog({ insight, onClose }: { insight: any; onClose: () => void }) {
  const [exitPrice, setExitPrice] = useState("");
  const [assertive, setAssertive] = useState<string>("");
  const [notes, setNotes] = useState("");
  const utils = trpc.useUtils();
  const closeMutation = trpc.insights.close.useMutation({
    onSuccess: () => { toast.success("Insight fechado com sucesso!"); utils.insights.list.invalidate(); utils.insights.stats.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-gray-300">Preço de Saída</Label>
        <Input value={exitPrice} onChange={e => setExitPrice(e.target.value)} placeholder="Ex: 32.50" className="bg-gray-800 border-gray-700 text-white mt-1" />
      </div>
      <div>
        <Label className="text-gray-300">A operação foi assertiva?</Label>
        <Select value={assertive} onValueChange={setAssertive}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="true" className="text-emerald-400">Sim — acertei a direção</SelectItem>
            <SelectItem value="false" className="text-red-400">Não — errei a direção</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-gray-300">Observações (opcional)</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="O que aprendeu com essa operação?" className="bg-gray-800 border-gray-700 text-white mt-1" rows={3} />
      </div>
      <Button
        onClick={() => closeMutation.mutate({ id: insight.id, exitPrice: parseFloat(exitPrice), assertive: assertive === "true", notes })}
        disabled={!exitPrice || !assertive || closeMutation.isPending}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {closeMutation.isPending ? "Salvando..." : "Fechar Insight"}
      </Button>
    </div>
  );
}

function NewInsightDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState("");
  const [direction, setDirection] = useState<Direction>("compra");
  const [entryPrice, setEntryPrice] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [thesis, setThesis] = useState("");
  const [horizon, setHorizon] = useState("");
  const [context, setContext] = useState("");
  const utils = trpc.useUtils();
  const createMutation = trpc.insights.create.useMutation({
    onSuccess: () => {
      toast.success("Insight criado!");
      utils.insights.list.invalidate();
      utils.insights.stats.invalidate();
      setOpen(false);
      setTicker(""); setDirection("compra"); setEntryPrice(""); setTargetPrice(""); setStopLoss(""); setThesis(""); setHorizon(""); setContext("");
      onCreated();
    },
    onError: (e) => toast.error(e.message),
  });

  const entry = parseFloat(entryPrice);
  const target = parseFloat(targetPrice);
  const stop = parseFloat(stopLoss);
  const rr = entry && target && stop && (entry - stop) !== 0 ? ((target - entry) / (entry - stop)).toFixed(2) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2"><Plus className="w-4 h-4" />Novo Insight</Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
        <DialogHeader><DialogTitle className="text-white">Registrar Novo Insight</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300">Ticker *</Label>
              <Input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="Ex: PETR4" className="bg-gray-800 border-gray-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300">Direção *</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as Direction)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="compra" className="text-emerald-400">COMPRA</SelectItem>
                  <SelectItem value="venda" className="text-red-400">VENDA</SelectItem>
                  <SelectItem value="neutro" className="text-gray-400">NEUTRO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-gray-300">Entrada</Label>
              <Input value={entryPrice} onChange={e => setEntryPrice(e.target.value)} placeholder="R$" className="bg-gray-800 border-gray-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300">Alvo</Label>
              <Input value={targetPrice} onChange={e => setTargetPrice(e.target.value)} placeholder="R$" className="bg-gray-800 border-gray-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300">Stop</Label>
              <Input value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="R$" className="bg-gray-800 border-gray-700 text-white mt-1" />
            </div>
          </div>
          {rr && (
            <div className={`text-sm p-2 rounded border ${parseFloat(rr) >= 2 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"}`}>
              Risco/Retorno: <strong>{rr}x</strong> {parseFloat(rr) >= 2 ? "✓ Favorável" : "⚠ Abaixo do ideal (mín. 2x)"}
            </div>
          )}
          <div>
            <Label className="text-gray-300">Tese de Investimento *</Label>
            <Textarea value={thesis} onChange={e => setThesis(e.target.value)} placeholder="Por que essa operação faz sentido? Qual o catalisador?" className="bg-gray-800 border-gray-700 text-white mt-1" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300">Horizonte</Label>
              <Input value={horizon} onChange={e => setHorizon(e.target.value)} placeholder="Ex: 2-4 semanas" className="bg-gray-800 border-gray-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300">Contexto</Label>
              <Input value={context} onChange={e => setContext(e.target.value)} placeholder="Macro, técnico, etc." className="bg-gray-800 border-gray-700 text-white mt-1" />
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate({ ticker, direction, entryPrice: entryPrice ? parseFloat(entryPrice) : undefined, targetPrice: targetPrice ? parseFloat(targetPrice) : undefined, stopLoss: stopLoss ? parseFloat(stopLoss) : undefined, thesis, horizon: horizon || undefined, context: context || undefined })}
            disabled={!ticker || !thesis || createMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {createMutation.isPending ? "Salvando..." : "Registrar Insight"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Insights() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("abertas");
  const [closingId, setClosingId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: stats } = trpc.insights.stats.useQuery();
  const { data: openInsights = [], isLoading: loadingOpen } = trpc.insights.list.useQuery({ status: "aberta" });
  const { data: closedInsights = [], isLoading: loadingClosed } = trpc.insights.list.useQuery({ status: "fechada" });
  const { data: allInsights = [], isLoading: loadingAll } = trpc.insights.list.useQuery({});

  const cancelMutation = trpc.insights.cancel.useMutation({
    onSuccess: () => { toast.success("Insight cancelado."); utils.insights.list.invalidate(); utils.insights.stats.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const insights = activeTab === "abertas" ? openInsights : activeTab === "fechadas" ? closedInsights : allInsights;
  const loading = activeTab === "abertas" ? loadingOpen : activeTab === "fechadas" ? loadingClosed : loadingAll;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Zap className="w-6 h-6 text-yellow-400" />Insights KRYIS</h1>
          <p className="text-gray-400 text-sm mt-1">Oportunidades identificadas com entrada, saída e rastreamento de assertividade</p>
        </div>
        {isAuthenticated && <NewInsightDialog onCreated={() => utils.insights.list.invalidate()} />}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400 mt-1">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.open}</div>
              <div className="text-xs text-gray-400 mt-1">Abertas</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-400">{stats.closed}</div>
              <div className="text-xs text-gray-400 mt-1">Fechadas</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{stats.assertive}</div>
              <div className="text-xs text-gray-400 mt-1">Assertivas</div>
            </CardContent>
          </Card>
          <Card className={`border ${stats.assertiveRate >= 60 ? "bg-emerald-900/20 border-emerald-700/50" : stats.assertiveRate >= 40 ? "bg-yellow-900/20 border-yellow-700/50" : "bg-red-900/20 border-red-700/50"}`}>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${stats.assertiveRate >= 60 ? "text-emerald-400" : stats.assertiveRate >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                <Award className="w-5 h-5" />{stats.assertiveRate}%
              </div>
              <div className="text-xs text-gray-400 mt-1">Taxa de Acerto</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="abertas" className="data-[state=active]:bg-gray-700 text-gray-300">Abertas ({openInsights.length})</TabsTrigger>
          <TabsTrigger value="fechadas" className="data-[state=active]:bg-gray-700 text-gray-300">Fechadas ({closedInsights.length})</TabsTrigger>
          <TabsTrigger value="todas" className="data-[state=active]:bg-gray-700 text-gray-300">Todas ({allInsights.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="text-center text-gray-500 py-12">Carregando insights...</div>
          ) : insights.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum insight {activeTab === "abertas" ? "aberto" : activeTab === "fechadas" ? "fechado" : ""} ainda.</p>
              {isAuthenticated && activeTab === "abertas" && <p className="text-sm mt-1">Clique em "Novo Insight" para registrar uma oportunidade.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight: any) => {
                const entry = parseFloat(String(insight.entryPrice || 0));
                const target = parseFloat(String(insight.targetPrice || 0));
                const stop = parseFloat(String(insight.stopLoss || 0));
                const rr = insight.riskReward ? parseFloat(String(insight.riskReward)) : null;
                const returnPct = insight.returnPct ? parseFloat(String(insight.returnPct)) : null;
                const isClosing = closingId === insight.id;

                return (
                  <Card key={insight.id} className={`border ${insight.status === "aberta" ? "bg-gray-900 border-gray-800" : insight.assertive ? "bg-emerald-950/20 border-emerald-800/30" : "bg-red-950/20 border-red-800/30"}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-white font-mono">{insight.ticker}</span>
                          <DirectionBadge direction={insight.direction} />
                          <StatusBadge status={insight.status} />
                          {insight.source === "agente" && <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">KRYIS</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          {insight.status === "fechada" && returnPct !== null && (
                            <span className={`text-lg font-bold ${returnPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(2)}%
                            </span>
                          )}
                          {insight.status === "fechada" && (
                            insight.assertive
                              ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                              : <XCircle className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Preços */}
                      {(entry > 0 || target > 0 || stop > 0) && (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                          {entry > 0 && (
                            <div className="bg-gray-800/50 rounded p-2 text-center">
                              <div className="text-xs text-gray-400">Entrada</div>
                              <div className="text-sm font-bold text-white">R$ {entry.toFixed(2)}</div>
                            </div>
                          )}
                          {target > 0 && (
                            <div className="bg-emerald-900/20 rounded p-2 text-center border border-emerald-800/30">
                              <div className="text-xs text-emerald-400 flex items-center justify-center gap-1"><Target className="w-3 h-3" />Alvo</div>
                              <div className="text-sm font-bold text-emerald-400">R$ {target.toFixed(2)}</div>
                              {entry > 0 && <div className="text-xs text-emerald-500">+{(((target - entry) / entry) * 100).toFixed(1)}%</div>}
                            </div>
                          )}
                          {stop > 0 && (
                            <div className="bg-red-900/20 rounded p-2 text-center border border-red-800/30">
                              <div className="text-xs text-red-400 flex items-center justify-center gap-1"><ShieldAlert className="w-3 h-3" />Stop</div>
                              <div className="text-sm font-bold text-red-400">R$ {stop.toFixed(2)}</div>
                              {entry > 0 && <div className="text-xs text-red-500">{(((stop - entry) / entry) * 100).toFixed(1)}%</div>}
                            </div>
                          )}
                          {rr !== null && (
                            <div className={`rounded p-2 text-center border ${rr >= 2 ? "bg-blue-900/20 border-blue-800/30" : "bg-yellow-900/20 border-yellow-800/30"}`}>
                              <div className={`text-xs flex items-center justify-center gap-1 ${rr >= 2 ? "text-blue-400" : "text-yellow-400"}`}><BarChart2 className="w-3 h-3" />R/R</div>
                              <div className={`text-sm font-bold ${rr >= 2 ? "text-blue-400" : "text-yellow-400"}`}>{rr.toFixed(2)}x</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Saída real */}
                      {insight.status === "fechada" && insight.exitPrice && (
                        <div className="bg-gray-800/30 rounded p-2 flex items-center gap-4 text-sm">
                          <span className="text-gray-400">Saída real:</span>
                          <span className="text-white font-bold">R$ {parseFloat(String(insight.exitPrice)).toFixed(2)}</span>
                          {returnPct !== null && (
                            <span className={`font-bold ${returnPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      )}

                      {/* Tese */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Tese</div>
                        <p className="text-sm text-gray-300 leading-relaxed">{insight.thesis}</p>
                      </div>

                      {/* Horizon + Context */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        {insight.horizon && <span>⏱ {insight.horizon}</span>}
                        {insight.context && <span>📌 {insight.context}</span>}
                        <span>{new Date(insight.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>

                      {/* Actions */}
                      {isAuthenticated && insight.status === "aberta" && (
                        <div className="flex gap-2 pt-2 border-t border-gray-800">
                          <Dialog open={isClosing} onOpenChange={(o) => setClosingId(o ? insight.id : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="border-emerald-700 text-emerald-400 hover:bg-emerald-900/20">
                                <CheckCircle className="w-3 h-3 mr-1" />Fechar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-900 border-gray-700 text-white">
                              <DialogHeader><DialogTitle>Fechar Insight — {insight.ticker}</DialogTitle></DialogHeader>
                              <CloseInsightDialog insight={insight} onClose={() => setClosingId(null)} />
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="outline" className="border-gray-700 text-gray-400 hover:bg-gray-800" onClick={() => cancelMutation.mutate({ id: insight.id })}>
                            <XCircle className="w-3 h-3 mr-1" />Cancelar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
