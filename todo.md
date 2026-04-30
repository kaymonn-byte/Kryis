# KRYIS v3 — TODO

## Banco de Dados
- [x] Tabela `daily_reports` (id, date, ibovespa_value, ibovespa_change, dollar_value, dollar_change, selic, brent_value, brent_change, market_summary, lessons_learned, tomorrow_outlook, self_score, created_at)
- [x] Tabela `ticker_notes` (id, ticker, note, context, date, created_at)
- [x] Tabela `analyses` (id, ticker, score, recommendation, note, date, created_at)

## Endpoints /api/scheduled
- [x] POST /api/scheduled/daily-report — receber e salvar relatório diário completo
- [x] POST /api/scheduled/ticker-notes — salvar notas por ticker
- [x] POST /api/scheduled/analyze — atualizado para persistir scores, recomendações e notas

## Backend tRPC
- [x] Router `reports` — listar e buscar relatórios diários
- [x] Router `watchlist` — listar análises mais recentes por ticker
- [x] Router `notes` — listar notas por ticker

## Frontend
- [x] Layout DashboardLayout com sidebar (Relatórios, Watchlist, Notas & Observações)
- [x] Página "Relatórios Diários" — histórico com resumo de mercado, lições e perspectiva
- [x] Página "Watchlist" — score, recomendação e nota mais recente por ativo
- [x] Página "Notas & Observações" — todas as notas por ticker com data e contexto
- [x] Tema visual escuro estilo terminal financeiro (verde/preto)

## Testes
- [x] Teste do endpoint daily-report
- [x] Teste do endpoint ticker-notes
- [x] Teste do router reports.list

## Melhorias v2

- [x] Página "Dashboard" como tela inicial com resumo do último relatório e métricas de mercado
- [x] Página "Análise por Ativo" com histórico de scores e notas de um ticker específico
- [x] Router tRPC `dashboard.summary` para buscar último relatório + top ativos (via reports.list + watchlist.latest)
- [x] Navegação com 4 itens: Dashboard, Watchlist, Relatórios, Notas

## Migração v2 + Insights aprimorados

- [ ] Tabelas do v2: operations, watchlist (CRUD), reports (tracking), chat_messages
- [ ] Tabela insights: ticker, direction, entryPrice, targetPrice, stopLoss, riskReward, thesis, horizon, status, exitPrice, returnPct, assertive, notes
- [ ] Migration SQL aplicada
- [ ] DB helpers para operations, watchlist CRUD, reports tracking, chat, insights
- [ ] Routers tRPC: market, scanner, operations, fiscal, watchlist CRUD, reports tracking, chat, insights
- [ ] Endpoint /api/scheduled/insight para agente salvar insights automaticamente
- [ ] Página Análise Técnica com gráfico candlestick
- [ ] Página Scanner B3
- [ ] Página Operações (registro compra/venda)
- [ ] Página Painel Fiscal
- [ ] Página Chat KRYIS (IA)
- [ ] Página Insights: entrada/saída, risco/retorno, status, histórico de assertividade
- [ ] DashboardLayout com todos os itens de menu
- [ ] Sincronização com GitHub kaymonn-byte/Kryis
