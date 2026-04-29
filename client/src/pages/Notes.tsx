import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Calendar, Search, StickyNote, Tag } from "lucide-react";
import { useState } from "react";

export default function Notes() {
  const [search, setSearch] = useState("");
  const [tickerFilter, setTickerFilter] = useState<string | undefined>(undefined);

  const { data, isLoading, error } = trpc.notes.list.useQuery({
    ticker: tickerFilter,
    limit: 200,
  });

  // Derive unique tickers from data for quick filter chips
  const uniqueTickers = data
    ? Array.from(new Set(data.map((n) => n.ticker))).sort()
    : [];

  const filtered = data
    ? data.filter((note) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          note.ticker.toLowerCase().includes(q) ||
          note.note.toLowerCase().includes(q) ||
          (note.context ?? "").toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notas & Observações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Todas as notas registradas pelo agente KRYIS, organizadas por ativo e data.
          </p>
        </div>

        {/* Search & filter */}
        <div className="space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ticker, nota ou contexto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {uniqueTickers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTickerFilter(undefined)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors font-mono ${
                  !tickerFilter
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border/50 hover:border-primary/40"
                }`}
              >
                Todos
              </button>
              {uniqueTickers.map((ticker) => (
                <button
                  key={ticker}
                  onClick={() => setTickerFilter(tickerFilter === ticker ? undefined : ticker)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors font-mono ${
                    tickerFilter === ticker
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/40 text-muted-foreground border-border/50 hover:border-primary/40"
                  }`}
                >
                  {ticker}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="bg-card border-border/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 bg-muted" />
                    <Skeleton className="h-5 w-24 bg-muted" />
                  </div>
                  <Skeleton className="h-4 w-full bg-muted" />
                  <Skeleton className="h-4 w-3/4 bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Erro ao carregar notas: {error.message}</span>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <StickyNote className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <div className="text-muted-foreground text-sm">
              {data && data.length === 0
                ? <>
                    Nenhuma nota encontrada. O agente KRYIS ainda não enviou dados via{" "}
                    <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                      POST /api/scheduled/ticker-notes
                    </code>
                    .
                  </>
                : "Nenhuma nota corresponde à busca."}
            </div>
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              {filtered.length} nota{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
            </div>
            {filtered.map((note) => (
              <Card
                key={note.id}
                className="bg-card border-border/50 hover:border-primary/20 transition-colors"
              >
                <CardContent className="pt-4 pb-4 px-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-primary text-sm tracking-wider">
                      {note.ticker}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                      <Calendar className="h-3 w-3" />
                      {note.date}
                    </div>
                    {note.context && (
                      <Badge className="bg-muted/50 text-muted-foreground border border-border/50 text-xs font-normal">
                        <Tag className="h-2.5 w-2.5 mr-1" />
                        {note.context}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed">{note.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
