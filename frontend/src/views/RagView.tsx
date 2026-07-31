import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Bot, Send, Upload, FileText, Sparkles, Loader2, 
  CheckCircle2, Trash2, Cpu, ChevronDown, ChevronUp, User, BookOpen,
  HelpCircle, ShieldCheck, Zap, FileCode
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  sources?: string[];
  usedLlm?: boolean;
  execTime?: number;
}

interface UploadedDocInfo {
  filename: string;
  total_chunks: number;
  character_count: number;
}

export default function RagView() {
  const { isAuthenticated, openAuthModal } = useAuthStore();

  const [docInfo, setUploadedDocInfo] = useState<UploadedDocInfo | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [question, setQuestion] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isQuerying]);

  // Téléversement & Indexation PDF / TXT
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      alert("Seuls les fichiers .pdf et .txt sont supportés pour le RAG.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/rag/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erreur HTTP ${res.status}`);
      }

      const data = await res.json();
      setUploadedDocInfo({
        filename: data.filename,
        total_chunks: data.total_chunks,
        character_count: data.character_count,
      });

      setChatHistory([
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `Document **"${data.filename}"** indexé avec succès (${data.total_chunks} blocs découpés). Posez-moi n'importe quelle question sur son contenu !`,
        },
      ]);
    } catch (err: any) {
      console.error("Erreur Upload RAG:", err);
      alert(`Échec de l'indexation : ${err.message || 'Erreur serveur'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Envoi de la question
  const handleSendQuestion = async (presetQuestion?: string) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (!docInfo) {
      alert("Veuillez d'abord téléverser un document PDF ou TXT.");
      return;
    }

    const qToUse = presetQuestion || question;
    if (!qToUse.trim()) return;

    const userMsgText = qToUse.trim();
    const userMsgId = Date.now().toString();

    setChatHistory((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: userMsgText },
    ]);

    setQuestion('');
    setIsQuerying(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsgText,
          top_k: 3,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erreur HTTP ${res.status}`);
      }

      const data = await res.json();

      setChatHistory((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: data.answer,
          sources: data.sources,
          usedLlm: data.used_llm,
          execTime: data.execution_time_ms,
        },
      ]);
    } catch (err: any) {
      console.error("Erreur RAG Query:", err);
      setChatHistory((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `Impossible d'obtenir une réponse : ${err.message || 'Erreur serveur'}`,
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const toggleSourceExpand = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleResetDoc = () => {
    setUploadedDocInfo(null);
    setChatHistory([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] space-y-3 overflow-hidden">
      {/* Banner ultra-compacte */}
      <div className="relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 px-5 py-3.5 text-white shadow-md">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-violet-300 border border-violet-400/20 mb-0.5">
              <Sparkles size={11} className="text-violet-400" />
              <span>IA Générative RAG & Interaction Documentaire</span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-white">
              Ask Your Document (Module RAG)
            </h1>
          </div>
        </div>
      </div>

      {/* Grille Principale */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0 h-full items-stretch">
        
        {/* PANEL GAUCHE : Téléversement + Infos (Sans aucun défilement) */}
        <div className="flex flex-col justify-between h-full space-y-3 min-h-0">
          
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex-1 flex flex-col justify-between overflow-hidden">
            <div>
              <h2 className="text-xs font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2 uppercase tracking-wider shrink-0">
                <BookOpen size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span>Document Actif</span>
              </h2>

              {!docInfo ? (
                <div className="space-y-2.5">
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 text-center hover:border-indigo-500 transition-all bg-slate-50/50 dark:bg-slate-950/50">
                    <input
                      type="file"
                      id="rag-file-input"
                      accept=".pdf,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label htmlFor="rag-file-input" className="cursor-pointer flex flex-col items-center gap-1.5">
                      <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {isUploading ? "Indexation..." : "Téléverser PDF / TXT"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Extraction & découpage vectoriel
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* CARTE DE CONSEILS AVANT TÉLÉVERSEMENT */}
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <HelpCircle size={12} className="text-indigo-500" />
                      <span>Guide d'utilisation</span>
                    </span>
                    <ul className="text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5 leading-tight">
                      <li className="flex items-center gap-1.5">
                        <FileCode size={11} className="text-indigo-400 shrink-0" />
                        <span>Formats : PDF texte ou .TXT</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Zap size={11} className="text-amber-400 shrink-0" />
                        <span>Support Multilingue : FR, EN, AR</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <ShieldCheck size={11} className="text-emerald-400 shrink-0" />
                        <span>Sécurité : Analyse privée</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {docInfo.filename}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {docInfo.character_count.toLocaleString()} caractères
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleResetDoc}
                        title="Changer de document"
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mt-1.5 pt-1.5 border-t border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Blocs (Chunks) :</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{docInfo.total_chunks}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <CheckCircle2 size={13} />
                    <span className="text-[10px] font-medium">Prêt pour la recherche vectorielle</span>
                  </div>

                  {/* BOUTONS D'ACTION RAPIDE COMPACTS */}
                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Questions suggérées :
                    </span>
                    <div className="space-y-1">
                      <button
                        onClick={() => handleSendQuestion("Pouvez-vous faire un résumé global et synthétique de ce document ?")}
                        className="w-full text-left text-[10px] bg-slate-50 hover:bg-indigo-50 dark:bg-slate-950 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800 transition-all font-medium truncate"
                      >
                        📌 Résumé synthétique
                      </button>
                      <button
                        onClick={() => handleSendQuestion("Quels sont les montants, budgets et dates clés mentionnés ?")}
                        className="w-full text-left text-[10px] bg-slate-50 hover:bg-indigo-50 dark:bg-slate-950 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800 transition-all font-medium truncate"
                      >
                        💰 Montants & dates clés
                      </button>
                      <button
                        onClick={() => handleSendQuestion("Quels sont les acteurs, responsables ou entreprises cités ?")}
                        className="w-full text-left text-[10px] bg-slate-50 hover:bg-indigo-50 dark:bg-slate-950 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800 transition-all font-medium truncate"
                      >
                        👤 Personnes & Organismes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pipeline RAG Actif */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-1.5 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Cpu size={14} className="text-indigo-500" />
              <span>Pipeline RAG Actif</span>
            </div>
            <ul className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
              <li>• <b>Parser :</b> PyPDF / Text Engine</li>
              <li>• <b>Chunking :</b> 400 mots / Chevauchement 80</li>
              <li>• <b>Moteur LLM :</b> Groq Llama-3.1 8B Instant</li>
            </ul>
          </div>
        </div>

        {/* PANEL DROIT : CHATBOX */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 h-full min-h-0 overflow-hidden">
          
          {/* Header Chat */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Bot size={14} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-white">Assistant IA RAG</h3>
                <p className="text-[10px] text-slate-400">Posez des questions sur votre document</p>
              </div>
            </div>

            {docInfo && (
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/40">
                Contexte : {docInfo.filename}
              </span>
            )}
          </div>

          {/* Zone des Messages (Seule zone de défilement) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <Bot size={32} className="text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-medium max-w-xs">
                  Aucun message. Téléversez un document à gauche puis posez votre première question !
                </p>
              </div>
            ) : (
              chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                  }`}>
                    {msg.sender === 'user' ? <User size={13} /> : <Bot size={13} />}
                  </div>

                  <div className={`max-w-[85%] space-y-1 ${msg.sender === 'user' ? 'items-end' : ''}`}>
                    <div className={`rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                    }`}>
                      <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                    </div>

                    {msg.sender === 'bot' && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px]">
                          {msg.usedLlm && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 dark:bg-violet-950/60 px-1.5 py-0.5 font-bold text-violet-600 dark:text-violet-300 border border-violet-100 dark:border-violet-900/40">
                              <Sparkles size={9} />
                              <span>Groq Llama-3.1</span>
                            </span>
                          )}
                          {msg.execTime && (
                            <span className="text-slate-400 font-semibold">{msg.execTime} ms</span>
                          )}
                        </div>

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50 p-1.5">
                            <button
                              onClick={() => toggleSourceExpand(msg.id)}
                              className="flex items-center justify-between w-full text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                            >
                              <span>{msg.sources.length} passage(s) extrait(s)</span>
                              {expandedSources[msg.id] ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>

                            {expandedSources[msg.id] && (
                              <div className="mt-1 space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                {msg.sources.map((src, i) => (
                                  <div key={i} className="text-[10px] text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                    "{src}"
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isQuerying && (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center shrink-0">
                  <Bot size={13} />
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Recherche vectorielle & Synthèse Groq LLM...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Champ de Saisie */}
          <div className="shrink-0 p-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuestion();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={!docInfo || isQuerying}
                placeholder={
                  !docInfo
                    ? "Téléversez d'abord un document..."
                    : "Posez votre question sur le document..."
                }
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:border-indigo-400 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!docInfo || !question.trim() || isQuerying}
                className="flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer shrink-0"
              >
                {isQuerying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}