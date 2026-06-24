import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, AlertTriangle, ShieldCheck, Cpu } from "lucide-react";
import Markdown from "react-markdown";

interface Message {
  sender: "user" | "ai";
  text: string;
}

interface AIAssistantDrawerProps {
  onSendMessage: (text: string) => Promise<string>;
}

export default function AIAssistantDrawer({ onSendMessage }: AIAssistantDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Bonjour ! Je suis **l'Assistant IA AutoFlow RH**. Je peux vous aider à analyser la performance de vos équipes, détecter des risques opérationnels ou identifier les tâches critiques en retard.\n\nQue souhaitez-vous savoir aujourd'hui ?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    { label: "Quelles sont les tâches prioritaires ?", icon: "🔥" },
    { label: "Qui est disponible dans l'équipe ?", icon: "🟢" },
    { label: "Quelles tâches sont en retard ?", icon: "⚠️" },
    { label: "Quel employé est le plus performant ?", icon: "🏆" },
    { label: "Quels risques ont été détectés ?", icon: "🚨" }
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // Add user message
    const userMsg = textToSend;
    setMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      const responseText = await onSendMessage(userMsg);
      setMessages(prev => [...prev, { sender: "ai", text: responseText }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: "Désolé, une erreur s'est produite lors de la connexion au moteur IA d'AutoFlow RH. Veuillez vérifier votre connexion."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-brand-neon to-brand-primary text-white flex items-center justify-center shadow-2xl shadow-brand-neon/30 hover:shadow-brand-neon/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-brand-neon/40 group"
      >
        <MessageSquare className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-brand-dark animate-pulse">
          ✨
        </span>
      </button>

      {/* Slide-out drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-white shadow-2xl flex flex-col border-l border-gray-100 animate-slide-in font-sans">
          
          {/* Header */}
          <div className="p-4 bg-brand-dark text-white border-b border-brand-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-neon to-brand-primary flex items-center justify-center shadow-md">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm leading-none">Assistant IA</h3>
                <span className="text-[10px] text-brand-neon font-bold uppercase tracking-wider mt-1 block">AutoFlow Engine</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-brand-medium/50 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-brand-dark text-white shadow-md shadow-brand-dark/10 rounded-tr-none"
                      : "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-none"
                  }`}
                >
                  {msg.sender === "ai" ? (
                    <div className="markdown-body prose max-w-none text-xs">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Loader */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 text-gray-800 shadow-sm rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">IA Réfléchit...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick chips container */}
          <div className="p-3 border-t border-gray-100 bg-white space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Raccourcis d'analyse</p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.label)}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-100 hover:border-brand-primary bg-white text-[10px] font-medium text-gray-700 hover:text-brand-dark hover:bg-emerald-50/20 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>{chip.icon}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-gray-100 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Posez une question de gestion ou d'analyse RH..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 border border-gray-200 focus:border-brand-primary rounded-xl text-xs text-gray-900 outline-none focus:ring-1 focus:ring-brand-primary/10 transition-all placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-brand-dark hover:bg-[#04281f] text-white rounded-xl shadow-md transition-colors disabled:opacity-40 disabled:hover:bg-brand-dark cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
