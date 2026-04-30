import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function FiscalPanel() {
  const { isAuthenticated, loading } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data, isLoading } = trpc.fiscal.getSummary.useQuery({ year }, { enabled: isAuthenticated });

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400">Carregando...</div>;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <FileText className="w-16 h-16 text-emerald-400 opacity-50" />
        <h2 className="text-xl font-bold text-white">Painel Fiscal</h2>
        <p className="text-gray-400 max-w-sm">Faça login para ver seu resumo fiscal e cálculo de IR.</p>
        <Button onClick={() => window.location.href = getLoginUrl()} className="bg-emerald-600 hover:bg-emerald-700">Entrar</Button>
      </div>
    );
  }

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FileText className="w-6 h-6 text-yellow-400" />Painel Fiscal</h1>
          <p className="text-gray-400 text-sm mt-1">Cálculo de IR, isenção mensal e resumo de operações</p>
        </div>
        <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-28"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {years.map(y => <SelectItem key={y} value={String(y)} className="text-white">{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Aviso importante */}
      <Card className="bg-yellow-900/10 border-yellow-700/30">
        <CardContent className="p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-300">
            <strong>Regra de isenção:</strong> Vendas de ações até R$ 20.000/mês são isentas de IR para pessoa física. Acima disso, incide 15% sobre o lucro. Day trade: sempre 20% sobre o lucro. Estes cálculos são estimativas — consulte um contador.
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center text-gray-500 py-12">Calculando...</div>
      ) : !data || data.operations.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma operação registrada em {year}.</p>
          <p className="text-sm mt-1">Registre suas operações na página "Operações" para ver o resumo fiscal.</p>
        </div>
      ) : (
        <>
          {/* Resumo anual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-lg font-bold text-emerald-400">R$ {data.totalBuyValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                <div className="text-xs text-gray-400 mt-1">Total Comprado</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-lg font-bold text-red-400">R$ {data.totalSellValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                <div className="text-xs text-gray-400 mt-1">Total Vendido</div>
              </CardContent>
            </Card>
            <Card className={`border ${data.totalPnl >= 0 ? "bg-emerald-900/10 border-emerald-700/30" : "bg-red-900/10 border-red-700/30"}`}>
              <CardContent className="p-4 text-center">
                <div className={`text-lg font-bold ${data.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {data.totalPnl >= 0 ? "+" : ""}R$ {data.totalPnl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-400 mt-1">Resultado Líquido</div>
              </CardContent>
            </Card>
            <Card className={`border ${data.totalTax > 0 ? "bg-red-900/10 border-red-700/30" : "bg-gray-900 border-gray-800"}`}>
              <CardContent className="p-4 text-center">
                <div className={`text-lg font-bold ${data.totalTax > 0 ? "text-red-400" : "text-gray-400"}`}>
                  R$ {data.totalTax.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-400 mt-1">IR Estimado</div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhamento mensal */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="text-white text-base">Detalhamento Mensal</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(data.months).sort(([a], [b]) => a.localeCompare(b)).map(([monthKey, m]: [string, any]) => {
                  const [, monthNum] = monthKey.split("-");
                  const monthName = MONTHS[parseInt(monthNum) - 1];
                  const totalSell = m.sells.reduce((acc: number, s: any) => acc + parseFloat(String(s.totalValue)), 0);
                  const isExempt = totalSell <= 20000;
                  const hasTax = m.tax > 0;

                  return (
                    <div key={monthKey} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-300 font-medium w-8">{monthName}</span>
                        {isExempt && m.sells.length > 0 && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />Isento
                          </Badge>
                        )}
                        {hasTax && (
                          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />IR Devido
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Vendas</div>
                          <div className="text-gray-300">R$ {totalSell.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Resultado</div>
                          <div className={m.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {m.pnl >= 0 ? "+" : ""}R$ {m.pnl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="text-right w-28">
                          <div className="text-xs text-gray-500">IR (15%)</div>
                          <div className={hasTax ? "text-red-400 font-bold" : "text-gray-600"}>
                            {hasTax ? `R$ ${m.tax.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
