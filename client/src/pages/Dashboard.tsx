import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  BookOpen,
  CalendarDays,
  FileText,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useLocation } from "wouter";

function ChangeIndicator({ change }: { change: string | null }) {
  if (!change) return <span className="text-muted-foreground">—</span>;
  const n = parseFloat(change);
  if (isNaN(n)) return <span className="text-muted-foreground">{change}</span>;
  if (n > 0)
    return (
      <span className="flex items-center gap-1 text-emerald-400 font-medium">
        <ArrowUpRight className="h-4 w-4" />
        +{n.toFixed(2)}%
      </span>
    );
  if (n < 0)
    return (
      <span className="flex items-center gap-1 text-red-400 font-medium">
        <ArrowDownRight className="h-4 w-4" />
        {n.toFixed(2)}%
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <Minus className="h-4 w-4" />
      {n.toFixed(2)}%
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 70)
    return (
      <Badge className="bg-emerald-900/60 text-emerald-300 border-emerald-700 text-xs">
        <TrendingUp className="h-3 w-3 mr-1" />
        {score}
      </Badge>
    );
  if (score >= 50)
    return (
      <Badge className="bg-yellow-900/60 text-yellow-300 border-yellow-700 text-xs">
        <Minus className="h-3 w-3 mr-1" />
        {score}
      </Badge>
    );
  return (
    <Badge className="bg-red-900/60 text-red-300 border-red-700 text-xs">
      <TrendingDown className="h-3 w-3 mr-1" />
      {score}
    </Badge>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: reports, isLoading: reportsLoading } = trpc.reports.list.useQuery({ limit: 1 });
  const { data: watchlist, isLoading: watchlistLoading } = trpc.watchlist.latest.useQuery();

  const latestReport = reports?.[0];

  const topBuy = watchlist
    ?.filter((a) => a.recommendation?.toUpperCase() === "COMPRAR")
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const topWatch = watchlist
    ?.filter((a) => a.recommendation?.toUpperCase() === "MONITORAR")
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral do mercado e dos ativos monitorados pelo agente KRYIS.
          </p>
        </div>

        {/* Métricas do último relatório */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Último Fechamento
            {latestReport && (
              <span className="text-primary font-mono ml-1">{latestReport.date}</span>
            )}
          </h2>

          {reportsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : latestReport ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Ibovespa */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Ibovespa</p>
                  <p className="text-lg font-bold font-mono text-foreground">
                    {latestReport.ibovespaValue
                      ? Number(latestReport.ibovespaValue).toLocaleString("pt-BR")
                      : "—"}
                  </p>
                  <ChangeIndicator change={latestReport.ibovespaChange} />
                </CardContent>
              </Card>

              {/* Dólar */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Dólar (USD/BRL)</p>
                  <p className="text-lg font-bold font-mono text-foreground">
                    {latestReport.dollarValue
                      ? `R$ ${Number(latestReport.dollarValue).toFixed(4)}`
                      : "—"}
                  </p>
                  <ChangeIndicator change={latestReport.dollarChange} />
                </CardContent>
              </Card>

              {/* Brent */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Petróleo Brent</p>
                  <p className="text-lg font-bold font-mono text-foreground">
                    {latestReport.brentValue
                      ? `US$ ${Number(latestReport.brentValue).toFixed(2)}`
                      : "—"}
                  </p>
                  <ChangeIndicator change={latestReport.brentChange} />
                </CardContent>
              </Card>

              {/* Selic */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Selic</p>
                  <p className="text-lg font-bold font-mono text-foreground">
                    {latestReport.selic ? `${Number(latestReport.selic).toFixed(2)}%` : "—"}
                  </p>
                  {latestReport.selfScore != null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Precisão KRYIS:{" "}
                      <span
                        className={
                          latestReport.selfScore >= 70
                            ? "text-emerald-400"
                            : latestReport.selfScore >= 50
                              ? "text-yellow-400"
                              : "text-red-400"
                        }
                      >
                        {latestReport.selfScore}/100
                      </span>
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                Nenhum relatório diário disponível ainda. O agente KRYIS enviará dados após o
                próximo fechamento de mercado.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resumo de mercado */}
        {latestReport?.marketSummary && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resumo do Mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {latestReport.marketSummary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dois painéis lado a lado: Oportunidades + Watchlist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Oportunidades de Compra */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Oportunidades de Compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              {watchlistLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 rounded" />
                  ))}
                </div>
              ) : topBuy && topBuy.length > 0 ? (
                <div className="space-y-2">
                  {topBuy.map((a) => (
                    <div
                      key={a.ticker}
                      className="flex items-center justify-between p-2 rounded bg-emerald-950/30 border border-emerald-900/40 cursor-pointer hover:bg-emerald-950/50 transition-colors"
                      onClick={() => navigate(`/ticker/${a.ticker}`)}
                    >
                      <span className="font-mono font-bold text-emerald-300">{a.ticker}</span>
                      <div className="flex items-center gap-2">
                        <ScoreBadge score={a.score} />
                        <span className="text-xs text-muted-foreground">{a.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum ativo com recomendação de compra no momento.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top Monitorados */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-yellow-400" />
                Em Monitoramento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {watchlistLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 rounded" />
                  ))}
                </div>
              ) : topWatch && topWatch.length > 0 ? (
                <div className="space-y-2">
                  {topWatch.map((a) => (
                    <div
                      key={a.ticker}
                      className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/ticker/${a.ticker}`)}
                    >
                      <span className="font-mono font-bold text-foreground">{a.ticker}</span>
                      <div className="flex items-center gap-2">
                        <ScoreBadge score={a.score} />
                        <span className="text-xs text-muted-foreground">{a.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum dado disponível ainda.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Perspectiva para amanhã */}
        {latestReport?.tomorrowOutlook && (
          <Card className="bg-card border-border border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Perspectiva para Amanhã
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {latestReport.tomorrowOutlook}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lições aprendidas */}
        {latestReport?.lessonsLearned && (
          <Card className="bg-card border-border border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                Lições Aprendidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {latestReport.lessonsLearned}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Atalhos rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => navigate("/watchlist")}
            className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all text-left group"
          >
            <TrendingUp className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-foreground">Watchlist Completa</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ver score e recomendação de todos os ativos
            </p>
          </button>
          <button
            onClick={() => navigate("/reports")}
            className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all text-left group"
          >
            <FileText className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-foreground">Relatórios Diários</p>
            <p className="text-xs text-muted-foreground mt-1">
              Histórico completo de fechamentos
            </p>
          </button>
          <button
            onClick={() => navigate("/notes")}
            className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all text-left group"
          >
            <BookOpen className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-foreground">Notas & Observações</p>
            <p className="text-xs text-muted-foreground mt-1">
              Análises e notas por ticker
            </p>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
