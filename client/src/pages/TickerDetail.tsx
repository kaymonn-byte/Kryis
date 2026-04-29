import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  BarChart2,
  BookOpen,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useLocation, useParams } from "wouter";

function recommendationBadge(rec: string) {
  const r = rec.toUpperCase();
  if (r === "COMPRAR")
    return (
      <Badge className="bg-emerald-900/60 text-emerald-300 border-emerald-700 text-xs">
        COMPRAR
      </Badge>
    );
  if (r === "VENDER")
    return (
      <Badge className="bg-red-900/60 text-red-300 border-red-700 text-xs">VENDER</Badge>
    );
  if (r === "MONITORAR")
    return (
      <Badge className="bg-yellow-900/60 text-yellow-300 border-yellow-700 text-xs">
        MONITORAR
      </Badge>
    );
  return <Badge className="text-xs">{rec}</Badge>;
}

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full bg-muted rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
      />
    </div>
  );
}

export default function TickerDetail() {
  const params = useParams<{ ticker: string }>();
  const ticker = (params.ticker ?? "").toUpperCase();
  const [, navigate] = useLocation();

  const { data: history, isLoading: histLoading } = trpc.watchlist.history.useQuery(
    { ticker, limit: 30 },
    { enabled: !!ticker }
  );

  const { data: notes, isLoading: notesLoading } = trpc.notes.list.useQuery(
    { ticker, limit: 50 },
    { enabled: !!ticker }
  );

  const latest = history?.[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/watchlist")}
            className="p-2 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {ticker}
            </h1>
            <p className="text-sm text-muted-foreground">
              Histórico de análises e notas do agente KRYIS
            </p>
          </div>
          {latest && (
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Score atual</p>
                <p className={`text-2xl font-bold font-mono ${scoreColor(latest.score)}`}>
                  {latest.score}
                </p>
              </div>
              {recommendationBadge(latest.recommendation)}
            </div>
          )}
        </div>

        {/* Histórico de scores */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Histórico de Análises
            </CardTitle>
          </CardHeader>
          <CardContent>
            {histLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded" />
                ))}
              </div>
            ) : history && history.length > 0 ? (
              <div className="space-y-2">
                {history.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-lg bg-muted/20 border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{a.date}</span>
                        {recommendationBadge(a.recommendation)}
                      </div>
                      <div className="flex items-center gap-2">
                        {a.score >= 70 ? (
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        ) : a.score >= 50 ? (
                          <Minus className="h-4 w-4 text-yellow-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        )}
                        <span className={`text-lg font-bold font-mono ${scoreColor(a.score)}`}>
                          {a.score}
                        </span>
                      </div>
                    </div>
                    <ScoreBar score={a.score} />
                    {a.note && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {a.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma análise registrada para {ticker}.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Notas do ticker */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Notas & Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded" />
                ))}
              </div>
            ) : notes && notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-lg bg-muted/20 border border-border"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{n.date}</span>
                      {n.context && (
                        <span className="text-xs text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">
                          {n.context}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{n.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma nota registrada para {ticker}.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
