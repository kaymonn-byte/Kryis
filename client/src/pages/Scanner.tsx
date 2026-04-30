import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Radar, BarChart2 } from "lucide-react";

type Filter = "all" | "buy" | "sell" | "oversold" | "overbought";

function SignalBadge({ signal }: { signal: string }) {
  if (signal === "COMPRA") return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><TrendingUp className="w-3 h-3 mr-1" />COMPRA</Badge>;
  if (signal === "VENDA") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><TrendingDown className="w-3 h-3 mr-1" />VENDA</Badge>;
  return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30"><Minus className="w-3 h-3 mr-1" />NEUTRO</Badge>;
}

function RSIBar({ rsi }: { rsi: number }) {
  const color = rsi < 35 ? "bg-emerald-500" : rsi > 65 ? "bg-red-500" : "bg-yellow-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${rsi}%` }} />
      </div>
      <span className={`text-xs font-mono w-8 text-right ${rsi < 35 ? "text-emerald-400" : rsi > 65 ? "text-red-400" : "text-yellow-400"}`}>{rsi}</span>
    </div>
  );
}

export default function Scanner() {
  const [filter, setFilter] = useState<Filter>("all");
  const [enabled, setEnabled] = useState(false);

  const { data: results = [], isLoading, refetch } = trpc.scanner.scan.useQuery(
    { filter, limit: 20 },
    { enabled, staleTime: 5 * 60 * 1000 }
  );

  const handleScan = () => {
    setEnabled(true);
    if (enabled) refetch();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Radar className="w-6 h-6 text-blue-400" />Scanner de Oportunidades</h1>
          <p className="text-gray-400 text-sm mt-1">Varredura técnica em tempo real — RSI, MACD, EMA e padrões</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all" className="text-white">Todos os Ativos</SelectItem>
            <SelectItem value="buy" className="text-emerald-400">Sinal de Compra</SelectItem>
            <SelectItem value="sell" className="text-red-400">Sinal de Venda</SelectItem>
            <SelectItem value="oversold" className="text-emerald-400">Sobrevendidos (RSI &lt; 35)</SelectItem>
            <SelectItem value="overbought" className="text-red-400">Sobrecomprados (RSI &gt; 65)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleScan} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 gap-2">
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
          {isLoading ? "Escaneando..." : enabled ? "Atualizar" : "Iniciar Scan"}
        </Button>
        {results.length > 0 && <span className="text-gray-500 text-sm">{results.length} ativos encontrados</span>}
      </div>

      {/* Aviso */}
      {!enabled && !isLoading && (
        <Card className="bg-gray-900/50 border-gray-800 border-dashed">
          <CardContent className="p-8 text-center">
            <Radar className="w-12 h-12 text-blue-400 mx-auto mb-3 opacity-40" />
            <p className="text-gray-400">Clique em "Iniciar Scan" para varrer o mercado em busca de oportunidades.</p>
            <p className="text-gray-600 text-sm mt-1">Os dados são buscados em tempo real via API pública da B3.</p>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {enabled && !isLoading && results.length === 0 && (
        <div className="text-center text-gray-500 py-12">Nenhum ativo encontrado com os filtros selecionados.</div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((item: any) => (
            <Card key={item.ticker} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg font-bold text-white font-mono w-16 flex-shrink-0">{item.ticker}</span>
                    <SignalBadge signal={item.signal} />
                    <Badge className={`text-xs ${item.trend === "Alta" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                      {item.trend === "Alta" ? "↑" : "↓"} {item.trend}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-white font-bold">R$ {item.price?.toFixed(2) || "—"}</div>
                      <div className={`text-xs ${item.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {item.change >= 0 ? "+" : ""}{item.change?.toFixed(2)}%
                      </div>
                    </div>
                    <div className="w-32">
                      <div className="text-xs text-gray-500 mb-1">RSI</div>
                      <RSIBar rsi={item.rsi} />
                    </div>
                    <div className="text-right w-24">
                      <div className="text-xs text-gray-500">MACD</div>
                      <div className={`text-xs font-mono ${item.macd >= 0 ? "text-emerald-400" : "text-red-400"}`}>{item.macd?.toFixed(3)}</div>
                    </div>
                    <div className="text-right hidden md:block">
                      <div className="text-xs text-gray-500">Score</div>
                      <div className={`text-sm font-bold ${item.score >= 60 ? "text-emerald-400" : item.score >= 40 ? "text-yellow-400" : "text-red-400"}`}>{item.score}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 ml-0">
                  <span className="text-xs text-gray-500">{item.pattern}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
