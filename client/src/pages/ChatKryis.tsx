import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Trash2, Bot, User, Loader2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { getLoginUrl } from "@/const";

export default function ChatKryis() {
  const { isAuthenticated, loading } = useAuth();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: history = [], isLoading } = trpc.chat.getHistory.useQuery(undefined, { enabled: isAuthenticated });

  const sendMutation = trpc.chat.sendMessage.useMutation({
    onMutate: async ({ content }) => {
      await utils.chat.getHistory.cancel();
      const prev = utils.chat.getHistory.getData();
      utils.chat.getHistory.setData(undefined, (old) => [
        ...(old || []),
        { id: Date.now(), userId: 0, role: "user" as const, content, createdAt: new Date() },
      ]);
      return { prev };
    },
    onSuccess: (data) => {
      utils.chat.getHistory.setData(undefined, (old) => [
        ...(old || []),
        { id: Date.now() + 1, userId: 0, role: "assistant" as const, content: data.content, createdAt: new Date() },
      ]);
    },
    onError: (e, _, ctx) => {
      if (ctx?.prev) utils.chat.getHistory.setData(undefined, ctx.prev);
      toast.error(e.message);
    },
  });

  const clearMutation = trpc.chat.clear.useMutation({
    onSuccess: () => { utils.chat.getHistory.invalidate(); toast.success("Histórico limpo."); },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, sendMutation.isPending]);

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    const msg = input.trim();
    setInput("");
    sendMutation.mutate({ content: msg });
  };

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400">Carregando...</div>;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <Bot className="w-16 h-16 text-emerald-400 opacity-50" />
        <h2 className="text-xl font-bold text-white">Chat KRYIS</h2>
        <p className="text-gray-400 max-w-sm">Faça login para conversar com o agente KRYIS e receber análises personalizadas de mercado.</p>
        <Button onClick={() => window.location.href = getLoginUrl()} className="bg-emerald-600 hover:bg-emerald-700">Entrar</Button>
      </div>
    );
  }

  const suggestedQuestions = [
    "Quais ativos da B3 estão mais descontados agora?",
    "Analise PETR4 — vale comprar?",
    "Quais são os melhores setores para investir com Selic alta?",
    "Como identificar um ativo em reversão de tendência?",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">KRYIS — Analista B3</div>
            <div className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Online
            </div>
          </div>
        </div>
        {history.length > 0 && (
          <Button size="sm" variant="ghost" className="text-gray-500 hover:text-red-400" onClick={() => clearMutation.mutate()}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">Carregando histórico...</div>
        ) : history.length === 0 ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
              <p className="text-gray-300 font-medium">Olá! Sou o KRYIS.</p>
              <p className="text-gray-500 text-sm mt-1">Seu analista especializado no mercado de ações brasileiro.</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-3 text-center">Sugestões de perguntas:</p>
              <div className="grid grid-cols-1 gap-2">
                {suggestedQuestions.map((q) => (
                  <button key={q} onClick={() => setInput(q)} className="text-left text-sm text-gray-400 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg p-3 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          history.map((msg: any) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-emerald-600 text-white rounded-tr-sm" : "bg-gray-800 text-gray-200 rounded-tl-sm"}`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Streamdown>{msg.content}</Streamdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-3.5 h-3.5 text-gray-300" />
                </div>
              )}
            </div>
          ))
        )}
        {sendMutation.isPending && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Pergunte sobre o mercado, análises, estratégias..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 flex-1"
            disabled={sendMutation.isPending}
          />
          <Button onClick={handleSend} disabled={!input.trim() || sendMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 px-3">
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">KRYIS não é assessor financeiro. Analise com cuidado antes de operar.</p>
      </div>
    </div>
  );
}
