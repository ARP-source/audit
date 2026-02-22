import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Loader2, UploadCloud, Send, FileText, Briefcase, Target, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Workspace = () => {
    const resultsRef = useRef(null);
    const navigate = useNavigate();
    const { user, session } = useAuth();

    // Form State
    const [companyName, setCompanyName] = useState("");
    const [taskObjective, setTaskObjective] = useState("");
    const [chatInput, setChatInput] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const [loadingState, setLoadingState] = useState("idle"); // idle, research, simulate, complete, error
    const [results, setResults] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [currentProjectId, setCurrentProjectId] = useState(null);
    const chatEndRef = useRef(null);

    // Simulate chat history for now
    const [chatHistory, setChatHistory] = useState([
        { role: 'system', text: 'Workspace initialized. Awaiting input for Audit execution.' }
    ]);

    const handleInitiate = async () => {
        if (!companyName.trim() || !taskObjective.trim() || loadingState !== "idle") return;

        setLoadingState("research");
        setErrorMsg("");
        setResults(null);

        const fullQuery = `Company: ${companyName}. Task/Objective: ${taskObjective}`;
        const projectId = crypto.randomUUID();
        setCurrentProjectId(projectId);

        try {
            // Read all uploaded files as text
            let documentText = "";
            if (uploadedFiles.length > 0) {
                const filePromises = uploadedFiles.map(file => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(`\n--- Document: ${file.name} ---\n${e.target.result}\n`);
                        reader.onerror = (e) => reject(new Error(`Failed to read ${file.name}`));
                        reader.readAsText(file);
                    });
                });

                const fileContents = await Promise.all(filePromises);
                documentText = fileContents.join('\n');
            }

            // Step 1: Research
            const researchRes = await fetch('/api/research', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ projectId, userId: user?.id, query: fullQuery, documentText })
            });
            const researchData = await researchRes.json();

            if (!researchRes.ok) throw new Error(researchData.error || "Research failed");

            // Step 2: Simulate
            setLoadingState("simulate");
            const simulateRes = await fetch('/api/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ projectId, proposedSolution: fullQuery })
            });
            const simulateData = await simulateRes.json();

            if (!simulateRes.ok) throw new Error(simulateData.error || "Simulation failed");

            setResults({
                research: researchData.data,
                simulation: simulateData
            });

            setChatHistory(prev => [...prev, { role: 'system', text: 'Audit execution complete. Matrix synthesized successfully.' }]);
            setLoadingState("complete");

            // Animate results in
            setTimeout(() => {
                if (resultsRef.current) {
                    gsap.from(resultsRef.current.children, {
                        y: 20,
                        opacity: 0,
                        stagger: 0.1,
                        duration: 0.8,
                        ease: 'power3.out'
                    });
                }
            }, 100);

        } catch (err) {
            console.error(err);
            setErrorMsg(err.message);
            setLoadingState("error");
            setChatHistory(prev => [...prev, { role: 'system', text: `Execution failed: ${err.message}` }]);
        }
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !currentProjectId) return;

        const userMessage = chatInput;
        setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
        setChatInput("");

        setChatHistory(prev => [...prev, { role: 'system', text: 'Querying project matrix...' }]);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ projectId: currentProjectId, message: userMessage })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Chat failed");

            // Remove the loading message and add the real response
            setChatHistory(prev => {
                const newHistory = prev.slice(0, -1);
                return [...newHistory, { role: 'assistant', text: data.reply }];
            });

        } catch (err) {
            console.error(err);
            setChatHistory(prev => {
                const newHistory = prev.slice(0, -1);
                return [...newHistory, { role: 'system', text: `Chat Error: ${err.message}` }];
            });
        }
    };

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setUploadedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files).filter(file =>
                file.type === "application/pdf" ||
                file.type === "text/plain" ||
                file.type === "text/csv" ||
                file.name.endsWith(".docx")
            );
            setUploadedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (indexToRemove) => {
        setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="min-h-screen pt-10 pb-24 px-6 md:px-12 flex flex-col items-center">

            {/* Back Button */}
            <div className="w-full max-w-6xl mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-sm text-ivory/50 hover:text-champagne transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Home</span>
                </button>
            </div>

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Inputs & Documents */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    <header className="mb-6 border-b border-ivory/10 pb-6">
                        <div className="flex items-center gap-2 text-sm font-mono tracking-widest text-[#B39B54] uppercase mb-2">
                            <ShieldCheck size={16} />
                            Secure Sandbox
                        </div>
                        <h2 className="text-3xl font-bold text-ivory tracking-tight">Active Workspace</h2>
                    </header>

                    {/* Main Input Form */}
                    <div className="bg-slate/20 border border-ivory/10 rounded-2xl p-6 backdrop-blur-md">
                        <h3 className="text-sm font-mono text-ivory/60 uppercase tracking-widest mb-6">Target Definition</h3>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs text-ivory/50 font-bold tracking-wider mb-2 flex items-center gap-2">
                                    <Briefcase size={14} /> Company / Organization
                                </label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full bg-[#1A1A24] border border-ivory/10 focus:border-champagne/50 rounded-lg px-4 py-3 text-sm text-ivory outline-none transition-colors"
                                    placeholder="e.g. UC Berkeley IEEE"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-ivory/50 font-bold tracking-wider mb-2 flex items-center gap-2">
                                    <Target size={14} /> Assigned Task / Objective
                                </label>
                                <textarea
                                    value={taskObjective}
                                    onChange={(e) => setTaskObjective(e.target.value)}
                                    className="w-full bg-[#1A1A24] border border-ivory/10 focus:border-champagne/50 rounded-lg px-4 py-3 text-sm text-ivory outline-none transition-colors resize-none h-32"
                                    placeholder="e.g. Needs a sponsorship outreach packet tailored for tech companies."
                                />
                            </div>

                            <button
                                onClick={handleInitiate}
                                disabled={loadingState === "research" || loadingState === "simulate"}
                                className={`w-full py-3 rounded-lg font-bold transition-all ${(loadingState === "research" || loadingState === "simulate")
                                    ? "bg-ivory/10 text-ivory/30 cursor-not-allowed"
                                    : "bg-champagne hover:bg-[#B39B54] text-obsidian shadow-[0_0_20px_rgba(201,168,76,0.15)] hover:shadow-[0_0_30px_rgba(201,168,76,0.3)]"
                                    }`}
                            >
                                {loadingState === "idle" || loadingState === "error" || loadingState === "complete" ? "Execute Audit" : "Processing..."}
                            </button>
                        </div>
                    </div>

                    {/* Document Upload Zone */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`bg-slate/20 border-dashed rounded-2xl p-6 backdrop-blur-md flex flex-col items-center justify-center text-center group transition-colors cursor-pointer relative overflow-hidden ${isDragging ? 'border-2 border-champagne bg-champagne/5' : 'border border-ivory/10 hover:border-ivory/30'
                            }`}
                    >
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".pdf,.txt,.docx,.csv"
                        />
                        <div className="w-12 h-12 rounded-full bg-ivory/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-champagne/10 transition-all">
                            <UploadCloud size={20} className="text-ivory/60 group-hover:text-champagne transition-colors" />
                        </div>
                        <h4 className="text-sm font-bold text-ivory mb-1">Upload Source Documents</h4>
                        <p className="text-xs text-ivory/40 max-w-[200px] mb-4">Click to browse or drag & drop PDFs, TXT, CSV, or DOCX.</p>

                        {uploadedFiles.length > 0 && (
                            <div className="w-full mt-2 space-y-2 text-left" onClick={(e) => e.stopPropagation()}>
                                {uploadedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-obsidian/50 px-3 py-2 rounded border border-ivory/5">
                                        <div className="flex items-center gap-2 truncate pr-2">
                                            <FileText size={12} className="text-champagne shrink-0" />
                                            <span className="truncate text-ivory/80">{file.name}</span>
                                        </div>
                                        <button
                                            onClick={() => removeFile(idx)}
                                            className="text-ivory/30 hover:text-red-400 transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column: Execution Matrix & Chat */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* Top Console: Loading or Matrix */}
                    <div className="flex-1 bg-obsidian/50 border border-ivory/10 rounded-2xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden min-h-[400px] flex flex-col">

                        {(loadingState === "idle" || loadingState === "error") && !results && (
                            <div className="m-auto flex flex-col items-center text-ivory/20 text-center">
                                <FileText size={48} className="mb-4 opacity-50" />
                                <p className="font-mono text-sm tracking-widest uppercase">Awaiting Target Definition</p>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="absolute top-6 left-6 right-6 text-red-400 text-sm font-mono bg-red-400/10 px-4 py-3 rounded border border-red-400/20 z-10">
                                Error: {errorMsg}
                            </div>
                        )}

                        {(loadingState === "research" || loadingState === "simulate") && (
                            <div className="m-auto flex flex-col items-center justify-center gap-6">
                                <Loader2 className="w-10 h-10 text-champagne animate-spin" />
                                <div className="text-ivory font-mono tracking-widest uppercase text-sm animate-pulse">
                                    {loadingState === "research" ? "Phase 1: Synthesizing Open-Source Intelligence..." : "Phase 2: Stress-Testing Strategic Logical Integrity..."}
                                </div>
                            </div>
                        )}

                        {loadingState === "complete" && results && (
                            <div ref={resultsRef} className="w-full grid gap-4 lg:grid-cols-2 text-left h-full overflow-y-auto pr-2 custom-scrollbar">

                                <div className="lg:col-span-2 bg-slate/30 border border-ivory/10 rounded-xl p-6">
                                    <h4 className="text-champagne font-mono text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
                                        <ShieldCheck size={14} /> Ingested Context Matrix
                                    </h4>
                                    <ul className="space-y-3">
                                        {results.research.summary_points?.map((pt, i) => (
                                            <li key={i} className="text-ivory/80 text-sm flex gap-3 leading-relaxed">
                                                <span className="text-champagne/50 mt-1 uppercase text-xs">[{i + 1}]</span>
                                                {pt}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-[#111116] border border-red-900/40 rounded-xl p-6">
                                    <h4 className="text-red-400 font-mono text-xs tracking-widest uppercase mb-4">Edge Case Vulnerabilities</h4>
                                    <ul className="space-y-3">
                                        {results.simulation?.edge_case_failures?.map((pt, i) => (
                                            <li key={i} className="text-ivory/80 text-sm flex gap-3 leading-relaxed">
                                                <span className="text-red-400/50 mt-[5px] text-[10px]">⚠️</span>
                                                {pt}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-[#111116] border border-orange-900/40 rounded-xl p-6">
                                    <h4 className="text-orange-400 font-mono text-xs tracking-widest uppercase mb-4">Core Logical Flaws</h4>
                                    <ul className="space-y-3">
                                        {results.simulation?.logical_flaws?.map((pt, i) => (
                                            <li key={i} className="text-ivory/80 text-sm flex gap-3 leading-relaxed">
                                                <span className="text-orange-400/50 mt-[5px] text-[10px]">⊗</span>
                                                {pt}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Top corner watermark */}
                        <div className="absolute -top-12 -right-12 text-[10rem] font-bold text-white/[0.02] pointer-events-none select-none font-serif leading-none">
                            T
                        </div>
                    </div>

                    {/* Bottom Console: Generative Chat Hub */}
                    <div className="bg-slate/20 border border-ivory/10 rounded-2xl p-4 backdrop-blur-md flex flex-col h-64">

                        <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar pr-2 space-y-4">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`text-sm ${msg.role === 'system' ? 'text-champagne/70 font-mono text-xs uppercase' : (msg.role === 'assistant' ? 'text-champagne/90 leading-relaxed' : 'text-ivory ml-6 opacity-60')}`}>
                                    {msg.role === 'system' || msg.role === 'assistant' ? '> ' : ''}{msg.text}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleChatSubmit} className="relative mt-auto">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                disabled={!currentProjectId || loadingState !== "complete"}
                                placeholder={currentProjectId && loadingState === "complete" ? "Query the matrix or request further synthesis..." : "Run an execution to enable chat..."}
                                className="w-full bg-[#1A1A24] border border-ivory/10 rounded-lg pl-4 pr-12 py-3 text-sm text-ivory outline-none focus:border-champagne/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-ivory/50 hover:text-champagne transition-colors">
                                <Send size={16} />
                            </button>
                        </form>
                    </div>

                </div>

            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(250, 248, 245, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(201, 168, 76, 0.5); }
            `}</style>
        </div>
    );
};

export default Workspace;
