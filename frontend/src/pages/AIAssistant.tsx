import React, { useState } from 'react';
import api from '@/api/client';
import { Card } from '@/components/common/Card';
import { Bot, Send, Sparkles, User, ShieldAlert, CornerDownLeft } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isAvailable?: boolean;
  provider?: string;
  timestamp: string;
}

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am SentinelDesk AI Assistant. Ask me questions about active vulnerabilities, application risk scores, or remediation strategies for your workspace.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const samplePrompts = [
    'Which critical vulnerabilities are still open in my workspace?',
    'Which application carries the highest security risk score?',
    'Explain CVE-2024-21626 SQL Injection in plain English.',
    'What remediation priorities should I tackle first this week?'
  ];

  const handleSendPrompt = async (textToSend?: string) => {
    const queryText = textToSend || prompt;
    if (!queryText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setPrompt('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { prompt: queryText.trim() });
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.data.reply,
        isAvailable: res.data.is_ai_available,
        provider: res.data.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Failed to process query. Please ensure backend service is running.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Bot className="w-6 h-6 text-cyan-400" /> AI Security Copilot
        </h1>
        <p className="text-xs text-slate-400 mt-1">Interactive security analyst assistant powered by Gemini AI</p>
      </div>

      <Card className="flex flex-col h-[600px] p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">SentinelDesk Intelligence Engine</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
            Gemini 2.5 Flash
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-900/60">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  m.sender === 'user'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-xl rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                <p>{m.text}</p>
                <span
                  className={`text-[9px] mt-1.5 block ${
                    m.sender === 'user' ? 'text-cyan-200 text-right' : 'text-slate-500'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Analyzing security posture telemetry...</span>
            </div>
          )}
        </div>

        {/* Sample Prompt Suggestions */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex flex-wrap gap-2">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(p)}
              className="text-[11px] text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors text-left truncate max-w-xs"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI Assistant about security vulnerabilities, risks, or remediation..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white p-2.5 rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </Card>
    </div>
  );
};
