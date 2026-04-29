import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { AlertCircle, TrendingDown, TrendingUp, Minus } from "lucide-react";

function recommendationBadge(rec: string) {
  const r = rec.toUpperCase();
  if (r === "COMPRAR") return <Badge className="badge-comprar text-xs font-medium">{rec}</Badge>;
  if (r === "VENDER") return <Badge className="badge-vender text-xs font-medium">{rec}</Badge>;
  if (r === "MONITORAR") return <Badge className="badge-monitorar text-xs font-medium">{rec}</Badge>;
  return <Badge className="badge-aguardar text-xs font-medium">{rec}</Badge>;
}

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function scoreIcon(score: number) {
  if (score >= 70) return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  if (score >= 50) return <Minus className="h-4 w-4 text-yellow-400" />;
  return <TrendingDown className="h-4 w-4 text-red-400" />;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
      />
    </div>
  );
}

export default function Watchlist() {
  const { data, isLoading, error } = trpc.watchlist.latest.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Watchlist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise mais recente de cada ativo monitorado pelo agente KRYIS.
          </p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="bg-card border-border/50">
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-16 bg-muted" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-12 bg-muted" />
                  <Skeleton className="h-2 w-full bg-muted" />
                  <Skeleton className="h-4 w-20 bg-muted" />
                  <Skeleton className="h-10 w-full bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Erro ao carregar watchlist: {error.message}</span>
          </div>
        )}

        {!isLoading && !error && data && data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-muted-foreground text-sm">
              Nenhuma análise encontrada. O agente KRYIS ainda não enviou dados via{" "}
              <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                POST /api/scheduled/analyze
              </code>
              .
            </div>
          </div>
        )}

        {!isLoading && !error && data && data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map((item) => (
              <Card
                key={item.ticker}
                className="bg-card border-border/50 hover:border-primary/30 transition-colors"
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold font-mono tracking-wider text-foreground">
                      {item.ticker}
                    </CardTitle>
                    {scoreIcon(item.score)}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div>
                    <div className="flex items-end gap-1">
                      <span className={`text-3xl font-bold font-mono ${scoreColor(item.score)}`}>
                        {item.score}
                      </span>
                      <span className="text-muted-foreground text-sm mb-1">/100</span>
                    </div>
                    <ScoreBar score={item.score} />
                  </div>

                  <div>{recommendationBadge(item.recommendation)}</div>

                  {item.note && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 border-t border-border/30 pt-2">
                      {item.note}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground/60 font-mono">
                    {item.date}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
