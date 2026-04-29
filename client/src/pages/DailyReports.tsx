import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Calendar,
  DollarSign,
  Flame,
  Minus,
  Star,
  TrendingUp,
} from "lucide-react";

function ChangeIndicator({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const n = parseFloat(value);
  if (isNaN(n)) return <span className="text-muted-foreground">{value}</span>;
  if (n > 0)
    return (
      <span className="flex items-center gap-0.5 text-emerald-400 font-mono text-sm">
        <ArrowUp className="h-3 w-3" />
        {n.toFixed(2)}%
      </span>
    );
  if (n < 0)
    return (
      <span className="flex items-center gap-0.5 text-red-400 font-mono text-sm">
        <ArrowDown className="h-3 w-3" />
        {Math.abs(n).toFixed(2)}%
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-muted-foreground font-mono text-sm">
      <Minus className="h-3 w-3" />
      {n.toFixed(2)}%
    </span>
  );
}

function SelfScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) return null;
  const color =
    score >= 70
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : score >= 50
        ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
        : "bg-red-500/15 text-red-400 border-red-500/30";
  return (
    <Badge className={`${color} border text-xs font-mono`}>
      <Star className="h-3 w-3 mr-1" />
      Autoavaliação: {score}/100
    </Badge>
  );
}

export default function DailyReports() {
  const { data, isLoading, error } = trpc.reports.list.useQuery({ limit: 30 });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatórios Diários</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Histórico de análises de fechamento de mercado geradas pelo agente KRYIS.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-card border-border/50">
                <CardHeader>
                  <Skeleton className="h-6 w-32 bg-muted" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full bg-muted" />
                  <Skeleton className="h-4 w-3/4 bg-muted" />
                  <Skeleton className="h-4 w-1/2 bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Erro ao carregar relatórios: {error.message}</span>
          </div>
        )}

        {!isLoading && !error && data && data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-muted-foreground text-sm">
              Nenhum relatório encontrado. O agente KRYIS ainda não enviou dados via{" "}
              <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                POST /api/scheduled/daily-report
              </code>
              .
            </div>
          </div>
        )}

        {!isLoading && !error && data && data.length > 0 && (
          <div className="space-y-4">
            {data.map((report) => (
              <Card
                key={report.id}
                className="bg-card border-border/50 hover:border-primary/20 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base font-mono font-semibold text-foreground">
                        {report.date}
                      </CardTitle>
                    </div>
                    <SelfScoreBadge score={report.selfScore} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Market indicators */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {report.ibovespaValue && (
                      <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          Ibovespa
                        </div>
                        <div className="font-mono font-semibold text-foreground text-sm">
                          {parseFloat(report.ibovespaValue).toLocaleString("pt-BR", {
                            maximumFractionDigits: 0,
                          })}{" "}
                          pts
                        </div>
                        <ChangeIndicator value={report.ibovespaChange} />
                      </div>
                    )}
                    {report.dollarValue && (
                      <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          Dólar
                        </div>
                        <div className="font-mono font-semibold text-foreground text-sm">
                          R$ {parseFloat(report.dollarValue).toFixed(2)}
                        </div>
                        <ChangeIndicator value={report.dollarChange} />
                      </div>
                    )}
                    {report.selic && (
                      <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Flame className="h-3 w-3" />
                          Selic
                        </div>
                        <div className="font-mono font-semibold text-foreground text-sm">
                          {parseFloat(report.selic).toFixed(2)}% a.a.
                        </div>
                      </div>
                    )}
                    {report.brentValue && (
                      <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Flame className="h-3 w-3" />
                          Brent
                        </div>
                        <div className="font-mono font-semibold text-foreground text-sm">
                          US$ {parseFloat(report.brentValue).toFixed(2)}
                        </div>
                        <ChangeIndicator value={report.brentChange} />
                      </div>
                    )}
                  </div>

                  {/* Market summary */}
                  {report.marketSummary && (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Resumo de Mercado
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {report.marketSummary}
                      </p>
                    </div>
                  )}

                  {/* Lessons learned */}
                  {report.lessonsLearned && (
                    <div className="space-y-2 border-t border-border/30 pt-3">
                      <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <BookOpen className="h-3 w-3" />
                        Lições Aprendidas
                      </div>
                      <div className="space-y-1">
                        {report.lessonsLearned.split("\n").map((lesson, i) =>
                          lesson.trim() ? (
                            <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                              <span className="text-primary mt-0.5 shrink-0">›</span>
                              <span>{lesson.trim()}</span>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tomorrow outlook */}
                  {report.tomorrowOutlook && (
                    <div className="space-y-1 border-t border-border/30 pt-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Perspectiva para Amanhã
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {report.tomorrowOutlook}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
