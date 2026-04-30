import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowUpRight, CalendarDays, Lightbulb, ShieldAlert, TrendingUp } from "lucide-react";

interface Suggestion {
  ticker: string;
  direction: "compra" | "venda" | "neutro";
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  stopGain?: number;
  thesis: string;
  confidence?: number;
}

function DirectionBadge({ direction }: { direction: string }) {
  if (direction === "compra")
    return <Badge className="bg-emerald-900/60 text-emerald-300 border-emerald-700 text-xs uppercase">▲ Compra</Badge>;
  if (direction === "venda")
    return <Badge className="bg-red-900/60 text-red-300 border-red-700 text-xs uppercase">▼ Venda</Badge>;
  return <Badge className="bg-muted text-muted-foreground text-xs uppercase">— Neutro</Badge>;
}

export default function MorningAnalysis() {
  const { data, isLoading, error } = trpc.market.morningAnalyses.useQuery({ limit: 5 });

  const latest = data?.[0];
  let suggestions: Suggestion[] = [];
  if (latest?.suggestedTickers) {
    try {
      suggestions = JSON.parse(latest.suggestedTickers);
    } catch (_) {}
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-400" />
            Análise de Abertura
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise sugestiva do agente KRYIS para o pregão do dia — gerada antes da abertura do mercado.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertTriangle className="h-4 w-4" />
            <span>Erro ao carregar análises: {error.message}</span>
          </div>
        )}

        {!isLoading && !error && !latest && (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              <Lightbulb className="h-10 w-10 mx-auto mb-3 text-yellow-500/40" />
              <p className="font-medium mb-1">Nenhuma análise de abertura disponível</p>
              <p className="text-xs">
                O agente KRYIS enviará a análise matinal via{" "}
                <code className="font-mono bg-muted px-1 py-0.5 rounded">POST /api/scheduled/morning-analysis</code>{" "}
                antes da abertura do mercado.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && latest && (
          <>
            {/* Contexto de mercado */}
            <Card className="bg-card border-border border-l-4 border-l-yellow-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-yellow-400" />
                  Contexto de Mercado — {latest.date}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {latest.marketContext}
                </p>
              </CardContent>
            </Card>

            {/* Oportunidades e Riscos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {latest.opportunities && (
                <Card className="bg-card border-border border-l-4 border-l-emerald-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      Oportunidades do Dia
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {latest.opportunities}
                    </p>
                  </CardContent>
                </Card>
              )}
              {latest.risks && (
                <Card className="bg-card border-border border-l-4 border-l-red-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-400" />
                      Riscos do Dia
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {latest.risks}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sugestões de entrada */}
            {suggestions.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                  Sugestões de Entrada ({suggestions.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {suggestions.map((s, i) => (
                    <Card key={i} className="bg-card border-border hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold font-mono text-primary">{s.ticker}</span>
                          <DirectionBadge direction={s.direction} />
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-3">
                        {/* Preços */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {s.entryPrice && (
                            <div className="p-2 rounded bg-muted/30 border border-border/30 text-center">
                              <p className="text-muted-foreground mb-0.5">Entrada</p>
                              <p className="font-bold font-mono text-foreground">R$ {Number(s.entryPrice).toFixed(2)}</p>
                            </div>
                          )}
                          {s.targetPrice && (
                            <div className="p-2 rounded bg-emerald-950/30 border border-emerald-900/30 text-center">
                              <p className="text-muted-foreground mb-0.5">Alvo</p>
                              <p className="font-bold font-mono text-emerald-300">R$ {Number(s.targetPrice).toFixed(2)}</p>
                            </div>
                          )}
                          {s.stopLoss && (
                            <div className="p-2 rounded bg-red-950/30 border border-red-900/30 text-center">
                              <p className="text-muted-foreground mb-0.5">Stop</p>
                              <p className="font-bold font-mono text-red-300">R$ {Number(s.stopLoss).toFixed(2)}</p>
                            </div>
                          )}
                        </div>

                        {/* Confiança */}
                        {s.confidence !== undefined && (
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Confiança</span>
                              <span className={`font-bold ${s.confidence >= 70 ? "text-emerald-400" : s.confidence >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                                {s.confidence}%
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${s.confidence >= 70 ? "bg-emerald-500" : s.confidence >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min(100, s.confidence)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Tese */}
                        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-2">
                          {s.thesis}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Análise completa */}
            {latest.fullAnalysis && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Análise Completa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {latest.fullAnalysis}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Histórico de análises anteriores */}
            {data && data.length > 1 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Análises Anteriores
                </h2>
                <div className="space-y-2">
                  {data.slice(1).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm text-foreground">{a.date}</span>
                        {a.aggressiveness && (
                          <Badge className="text-xs bg-muted text-muted-foreground">{a.aggressiveness}</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                        {a.marketContext?.slice(0, 80)}...
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
