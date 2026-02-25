import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { Loader2, UploadCloud, Send, FileText, Briefcase, Target, ShieldCheck, ArrowLeft, Download, Lightbulb, Link as LinkIcon, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Workspace = () => {
    const resultsRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, session } = useAuth();

    // Form State
    const [companyName, setCompanyName] = useState("");
    const [taskObjective, setTaskObjective] = useState("");
    const [proposedStrategy, setProposedStrategy] = useState("");
    const [chatInput, setChatInput] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const [loadingState, setLoadingState] = useState("idle"); // idle, research, simulate, complete, error
    const [results, setResults] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [currentProjectId, setCurrentProjectId] = useState(null);
    const chatEndRef = useRef(null);

    // View State (matrix vs plan)
    const [activeView, setActiveView] = useState('matrix'); // 'matrix' or 'plan'
    const [actionPlan, setActionPlan] = useState("");
    const [saveStatus, setSaveStatus] = useState("saved"); // saving, saved, error

    // Chat history
    const [chatHistory, setChatHistory] = useState([
        { role: 'system', text: 'Workspace initialized. Awaiting input for Audit execution.' }
    ]);

    const queryParams = new URLSearchParams(location.search);
    const historyProjectId = queryParams.get('projectId');

    console.log("[Workspace Render]", {
        search: location.search,
        historyProjectId,
        hasUser: !!user,
        userId: user?.id
    });

    // Check for history load on mount
    useEffect(() => {
        if (historyProjectId) {
            const loadHistoricalData = async () => {
                setLoadingState("simulate"); // Show a generic loading state
                setCurrentProjectId(historyProjectId);

                try {
                    console.log(`[Workspace Load] Attempting to load history for ID: ${historyProjectId} as User: ${user?.id}`);

                    // Fetch Research Data
                    const { data: rd, error: rErr } = await supabase
                        .from('research_data')
                        .select('summary, query, plan')
                        .eq('project_id', historyProjectId)
                        .maybeSingle();

                    console.log(`[Workspace Load] Research Data Result:`, { rd, rErr });

                    if (rErr) throw rErr;

                    if (rd) {
                        // Parse original inputs if possible to populate fields
                        const companyMatch = rd.query?.match(/Company:\s*([^.]+)/);
                        if (companyMatch) setCompanyName(companyMatch[1].trim());

                        const objectiveMatch = rd.query?.match(/Task\/Objective:\s*(.+)/);
                        if (objectiveMatch) setTaskObjective(objectiveMatch[1].trim());
                    }

                    // Fetch Simulation Data
                    const { data: sd, error: sErr } = await supabase
                        .from('simulations')
                        .select('predictions, inputs')
                        .eq('project_id', historyProjectId)
                        .maybeSingle();

                    console.log(`[Workspace Load] Simulation Data Result:`, { sd, sErr });

                    if (sErr) throw sErr;

                    if (sd && sd.inputs?.proposedSolution) {
                        const solution = sd.inputs.proposedSolution;
                        if (typeof solution === 'string' && !solution.startsWith('{"executive_summary"')) {
                            setProposedStrategy(solution);
                        }
                    }

                    setResults({
                        research: rd?.summary || null,
                        simulation: sd?.predictions || null
                    });

                    if (rd?.plan) setActionPlan(rd.plan);
                    setLoadingState("complete");

                    setTimeout(() => {
                        if (resultsRef.current) {
                            gsap.from(resultsRef.current.children, { y: 20, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out' });
                        }
                    }, 100);

                } catch (err) {
                    console.error("Error loading historical project", err);
                    setErrorMsg(`Failed to load historical audit data: ${err.message || err.details || JSON.stringify(err)}`);
                    setLoadingState("error");
                }
            };

            loadHistoricalData();
        }
    }, [location.search]);

    // Load chat history when projectId is set
    useEffect(() => {
        if (!currentProjectId) return;
        const loadChat = async () => {
            const { data } = await supabase
                .from('chat_messages')
                .select('role, content, created_at')
                .eq('project_id', currentProjectId)
                .order('created_at', { ascending: true });
            if (data && data.length > 0) {
                const loaded = data.map(m => ({ role: m.role, text: m.content }));
                setChatHistory(prev => [
                    prev[0], // keep the initialization message
                    ...loaded
                ]);
            }
        };
        loadChat();
    }, [currentProjectId]);

    // Auto-save plan to Supabase
    useEffect(() => {
        if (!currentProjectId || loadingState !== "complete") return;

        const savePlan = async () => {
            setSaveStatus("saving");
            try {
                const { error } = await supabase
                    .from('research_data')
                    .update({ plan: actionPlan })
                    .eq('project_id', currentProjectId);

                if (error) throw error;
                setSaveStatus("saved");
            } catch (err) {
                console.error("Failed to auto-save plan:", err);
                setSaveStatus("error");
            }
        };

        const timeoutId = setTimeout(() => {
            savePlan();
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timeoutId);
    }, [actionPlan, currentProjectId, loadingState]);

    const handleInitiate = async () => {
        if (!companyName.trim() || !taskObjective.trim() || loadingState !== "idle") return;

        setLoadingState("research");
        setErrorMsg("");
        setResults(null);

        const fullQuery = `Company: ${companyName}. Task/Objective: ${taskObjective}`;
        const projectId = crypto.randomUUID();
        setCurrentProjectId(projectId);

        try {
            // Parse all uploaded files via the server-side endpoint
            let documentText = "";
            if (uploadedFiles.length > 0) {
                const filePromises = uploadedFiles.map(file => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                            try {
                                const base64 = e.target.result.split(',')[1];
                                const parseRes = await fetch('/api/parse-document', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ fileBase64: base64, fileName: file.name })
                                });
                                const parseData = await parseRes.json();
                                if (!parseRes.ok) throw new Error(parseData.error);
                                resolve(`\n--- Document: ${file.name} ---\n${parseData.text}\n`);
                            } catch (err) {
                                resolve(`\n--- Document: ${file.name} (parse failed: ${err.message}) ---\n`);
                            }
                        };
                        reader.onerror = () => resolve(`\n--- Document: ${file.name} (read failed) ---\n`);
                        reader.readAsDataURL(file);
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

            // Step 2: Simulate — use user's strategy if provided, otherwise auto-feed research results
            setLoadingState("simulate");
            const solutionToTest = proposedStrategy.trim()
                ? proposedStrategy
                : JSON.stringify(researchData.data);
            const simulateRes = await fetch('/api/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ projectId, proposedSolution: solutionToTest })
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
                    onClick={() => navigate('/hub')}
                    className="flex items-center gap-2 text-sm text-ivory/50 hover:text-champagne transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Hub</span>
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
                                    placeholder="Deloitte Digital"
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
                                    placeholder="Evaluate market entry strategy for expanding SaaS products into the healthcare sector."
                                />
                            </div>

                            <div>
                                <label className="text-xs text-ivory/50 font-bold tracking-wider mb-2 flex items-center gap-2">
                                    <Lightbulb size={14} /> Proposed Strategy
                                    <span className="text-ivory/25 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    value={proposedStrategy}
                                    onChange={(e) => setProposedStrategy(e.target.value)}
                                    className="w-full bg-[#1A1A24] border border-ivory/10 focus:border-champagne/50 rounded-lg px-4 py-3 text-sm text-ivory outline-none transition-colors resize-none h-24"
                                    placeholder="Leave empty to auto-analyze research findings, or type your own strategy to stress-test."
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
                            <div className="flex h-full flex-col">
                                {/* Top Toolbar */}
                                <div className="flex justify-between items-center mb-6 pb-2 border-b border-ivory/10">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-champagne tracking-wider">
                                            {activeView === 'matrix' ? 'Analysis Matrix' : 'Action Plan'}
                                        </h3>
                                        {activeView === 'plan' && saveStatus === 'saving' && <span className="text-xs text-ivory/40 italic flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Saving...</span>}
                                        {activeView === 'plan' && saveStatus === 'saved' && <span className="text-xs text-ivory/30 flex items-center gap-1"><Save size={10} /> Saved</span>}
                                    </div>
                                    <div className="flex items-center gap-1 bg-obsidian/60 p-1 rounded-lg border border-ivory/10">
                                        <button
                                            onClick={() => setActiveView('matrix')}
                                            className={`p-1.5 rounded transition-all ${activeView === 'matrix' ? 'bg-champagne text-obsidian shadow' : 'text-ivory/50 hover:text-champagne'}`}
                                            title="View Analysis Matrix"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="w-px h-4 bg-ivory/10 mx-1"></span>
                                        <button
                                            onClick={() => setActiveView('plan')}
                                            className={`p-1.5 rounded transition-all ${activeView === 'plan' ? 'bg-champagne text-obsidian shadow' : 'text-ivory/50 hover:text-champagne'}`}
                                            title="View Action Plan"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Sliding Views */}
                                <div className="relative flex-1 overflow-hidden h-full">

                                    {/* View 1: Analysis Matrix */}
                                    <div
                                        ref={resultsRef}
                                        className={`absolute inset-0 w-full h-full overflow-y-auto pr-2 custom-scrollbar transition-transform duration-500 ease-in-out ${activeView === 'matrix' ? 'translate-x-0 opacity-100 z-10' : '-translate-x-[110%] opacity-0 z-0'}`}
                                    >
                                        <div className="space-y-4 text-left pb-4">

                                            {/* Executive Summary */}
                                            {results.research?.executive_summary && (
                                                <div className="bg-slate/30 border border-ivory/10 rounded-xl p-6">
                                                    <h4 className="text-champagne font-mono text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
                                                        <ShieldCheck size={14} /> Executive Summary
                                                    </h4>
                                                    <p className="text-ivory/80 text-sm leading-relaxed">{results.research.executive_summary}</p>
                                                </div>
                                            )}

                                            {/* SWOT Analysis Grid */}
                                            {results.research?.swot_analysis && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-[#111116] border border-emerald-900/30 rounded-xl p-5">
                                                        <h4 className="text-emerald-400 font-mono text-xs tracking-widest uppercase mb-3">↑ Strengths</h4>
                                                        <ul className="space-y-2">
                                                            {results.research.swot_analysis.strengths?.map((item, i) => (
                                                                <li key={i} className="text-ivory/70 text-xs leading-relaxed flex gap-2">
                                                                    <span className="text-emerald-400/50 mt-0.5">•</span> {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="bg-[#111116] border border-red-900/30 rounded-xl p-5">
                                                        <h4 className="text-red-400 font-mono text-xs tracking-widest uppercase mb-3">↓ Weaknesses</h4>
                                                        <ul className="space-y-2">
                                                            {results.research.swot_analysis.weaknesses?.map((item, i) => (
                                                                <li key={i} className="text-ivory/70 text-xs leading-relaxed flex gap-2">
                                                                    <span className="text-red-400/50 mt-0.5">•</span> {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="bg-[#111116] border border-blue-900/30 rounded-xl p-5">
                                                        <h4 className="text-blue-400 font-mono text-xs tracking-widest uppercase mb-3">◎ Opportunities</h4>
                                                        <ul className="space-y-2">
                                                            {results.research.swot_analysis.opportunities?.map((item, i) => (
                                                                <li key={i} className="text-ivory/70 text-xs leading-relaxed flex gap-2">
                                                                    <span className="text-blue-400/50 mt-0.5">•</span> {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="bg-[#111116] border border-orange-900/30 rounded-xl p-5">
                                                        <h4 className="text-orange-400 font-mono text-xs tracking-widest uppercase mb-3">⚠ Threats</h4>
                                                        <ul className="space-y-2">
                                                            {results.research.swot_analysis.threats?.map((item, i) => (
                                                                <li key={i} className="text-ivory/70 text-xs leading-relaxed flex gap-2">
                                                                    <span className="text-orange-400/50 mt-0.5">•</span> {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Key Risks */}
                                            {results.research?.key_risks?.length > 0 && (
                                                <div className="bg-[#111116] border border-red-900/30 rounded-xl p-5">
                                                    <h4 className="text-red-400 font-mono text-xs tracking-widest uppercase mb-3">Key Risks</h4>
                                                    <div className="space-y-3">
                                                        {results.research.key_risks.map((r, i) => (
                                                            <div key={i} className="flex items-start gap-3 text-sm">
                                                                <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.severity >= 4 ? 'bg-red-500/20 text-red-400' : r.severity >= 3 ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                                    {r.severity}/5
                                                                </span>
                                                                <div>
                                                                    <span className="text-ivory/80">{r.risk}</span>
                                                                    <p className="text-ivory/40 text-xs mt-1">↳ {r.mitigation}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Competitor Landscape */}
                                            {results.research?.competitor_landscape?.length > 0 && (
                                                <div className="bg-slate/30 border border-ivory/10 rounded-xl p-5">
                                                    <h4 className="text-champagne font-mono text-xs tracking-widest uppercase mb-3">Competitor Landscape</h4>
                                                    <div className="space-y-2">
                                                        {results.research.competitor_landscape.map((c, i) => (
                                                            <div key={i} className="flex items-center justify-between text-sm bg-obsidian/40 rounded-lg px-4 py-3 border border-ivory/5">
                                                                <div>
                                                                    <span className="text-ivory font-medium">{c.name}</span>
                                                                    <p className="text-ivory/40 text-xs mt-0.5">{c.positioning}</p>
                                                                </div>
                                                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${c.threat_level === 'High' ? 'bg-red-500/20 text-red-400' : c.threat_level === 'Medium' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                                                                    {c.threat_level}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Recommended Next Steps */}
                                            {results.research?.recommended_next_steps?.length > 0 && (
                                                <div className="bg-slate/30 border border-ivory/10 rounded-xl p-5">
                                                    <h4 className="text-champagne font-mono text-xs tracking-widest uppercase mb-3">Recommended Next Steps</h4>
                                                    <div className="space-y-2">
                                                        {results.research.recommended_next_steps.map((s, i) => (
                                                            <div key={i} className="flex items-start gap-3 text-sm bg-obsidian/40 rounded-lg px-4 py-3 border border-ivory/5">
                                                                <span className="text-champagne/60 font-mono text-xs mt-0.5">{i + 1}.</span>
                                                                <div className="flex-1">
                                                                    <span className="text-ivory/80">{s.action}</span>
                                                                    <div className="flex gap-3 mt-1">
                                                                        <span className="text-ivory/30 text-xs">⏱ {s.timeline}</span>
                                                                        <span className={`text-[10px] font-bold uppercase ${s.priority === 'High' ? 'text-red-400' : s.priority === 'Medium' ? 'text-orange-400' : 'text-green-400'}`}>{s.priority}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Citations Section */}
                                            {results.research?.citations?.length > 0 && (
                                                <div className="bg-slate/30 border border-ivory/10 rounded-xl p-5 mb-4">
                                                    <h4 className="text-champagne font-mono text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
                                                        <LinkIcon size={14} /> Citations & Sources
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {results.research.citations.map((cit, i) => (
                                                            <div key={i} className="text-sm bg-obsidian/40 rounded-lg px-4 py-3 border border-ivory/5">
                                                                <p className="text-ivory/80 font-medium mb-1">
                                                                    <span className="text-champagne text-[10px] font-mono mr-2 bg-champagne/10 px-1.5 py-0.5 rounded">[Cit. {i + 1}]</span>
                                                                    {cit.claim}
                                                                </p>
                                                                <a href={cit.url} target="_blank" rel="noopener noreferrer" className="text-champagne/60 text-xs hover:text-champagne hover:underline transition-colors break-all">
                                                                    {cit.url}
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Confidence Score */}
                                            {results.simulation?.overall_confidence_score && (
                                                <div className="bg-slate/30 border border-champagne/20 rounded-xl p-5 flex items-center gap-6">
                                                    <div className="relative w-20 h-20 shrink-0">
                                                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                                                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                                            <circle cx="18" cy="18" r="15.5" fill="none" stroke={results.simulation.overall_confidence_score.score >= 70 ? '#34d399' : results.simulation.overall_confidence_score.score >= 40 ? '#fbbf24' : '#f87171'} strokeWidth="3" strokeDasharray={`${results.simulation.overall_confidence_score.score} 100`} strokeLinecap="round" />
                                                        </svg>
                                                        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-ivory">{results.simulation.overall_confidence_score.score}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-champagne font-mono text-xs tracking-widest uppercase mb-1">Confidence Score</h4>
                                                        <p className="text-ivory/60 text-xs leading-relaxed">{results.simulation.overall_confidence_score.justification}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Edge Case Failures */}
                                            {results.simulation?.edge_case_failures?.length > 0 && (
                                                <div className="bg-[#111116] border border-red-900/40 rounded-xl p-5">
                                                    <h4 className="text-red-400 font-mono text-xs tracking-widest uppercase mb-3">Edge Case Vulnerabilities</h4>
                                                    <div className="space-y-2">
                                                        {results.simulation.edge_case_failures.map((e, i) => (
                                                            <div key={i} className="flex items-start justify-between gap-3 text-sm bg-obsidian/40 rounded-lg px-4 py-3 border border-red-900/20">
                                                                <span className="text-ivory/70 text-xs leading-relaxed flex-1">{e.scenario || e}</span>
                                                                {e.impact && <span className={`text-[10px] font-bold uppercase shrink-0 px-2 py-0.5 rounded ${e.impact === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>{e.impact}</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Logical Flaws */}
                                            {results.simulation?.logical_flaws?.length > 0 && (
                                                <div className="bg-[#111116] border border-orange-900/40 rounded-xl p-5">
                                                    <h4 className="text-orange-400 font-mono text-xs tracking-widest uppercase mb-3">Logical Flaws</h4>
                                                    <div className="space-y-3">
                                                        {results.simulation.logical_flaws.map((f, i) => (
                                                            <div key={i} className="text-sm bg-obsidian/40 rounded-lg px-4 py-3 border border-orange-900/20">
                                                                <span className="text-ivory/80 font-medium">{f.flaw || f}</span>
                                                                {f.explanation && <p className="text-ivory/40 text-xs mt-1">{f.explanation}</p>}
                                                                {f.recommendation && <p className="text-emerald-400/70 text-xs mt-1">→ {f.recommendation}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Export Button */}
                                            <div className="pt-2 flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        import('jspdf').then(({ default: jsPDF }) => {
                                                            const doc = new jsPDF();
                                                            const margin = 20;
                                                            let y = margin;
                                                            const pageWidth = doc.internal.pageSize.getWidth();
                                                            const maxWidth = pageWidth - margin * 2;

                                                            const addText = (text, size = 10, style = 'normal', color = [33, 33, 33]) => {
                                                                doc.setFontSize(size);
                                                                doc.setFont('helvetica', style);
                                                                doc.setTextColor(...color);
                                                                const lines = doc.splitTextToSize(text, maxWidth);
                                                                lines.forEach(line => {
                                                                    if (y > 275) { doc.addPage(); y = margin; }
                                                                    doc.text(line, margin, y);
                                                                    y += size * 0.5;
                                                                });
                                                                y += 2;
                                                            };

                                                            const addSection = (title) => {
                                                                y += 4;
                                                                if (y > 265) { doc.addPage(); y = margin; }
                                                                doc.setDrawColor(200, 170, 80);
                                                                doc.line(margin, y, pageWidth - margin, y);
                                                                y += 6;
                                                                addText(title.toUpperCase(), 11, 'bold', [160, 130, 50]);
                                                                y += 2;
                                                            };

                                                            // Header
                                                            doc.setFillColor(15, 15, 20);
                                                            doc.rect(0, 0, pageWidth, 40, 'F');
                                                            doc.setTextColor(255, 255, 255);
                                                            doc.setFontSize(20);
                                                            doc.setFont('helvetica', 'bold');
                                                            doc.text(`Audit Report: ${companyName || 'N/A'}`, margin, 22);
                                                            doc.setFontSize(9);
                                                            doc.setFont('helvetica', 'normal');
                                                            doc.setTextColor(200, 200, 200);
                                                            doc.text(`Generated ${new Date().toLocaleDateString()} | ${taskObjective}`, margin, 32);
                                                            y = 50;

                                                            const r = results.research;
                                                            const s = results.simulation;

                                                            // Executive Summary
                                                            if (r?.executive_summary) {
                                                                addSection('Executive Summary');
                                                                addText(r.executive_summary, 10, 'normal', [50, 50, 50]);
                                                            }

                                                            // Citations
                                                            if (r?.citations?.length > 0) {
                                                                addSection('Sources & Citations');
                                                                r.citations.forEach((cit, idx) => {
                                                                    addText(`[Cit. ${idx + 1}] ${cit.claim}`, 9, 'bold', [160, 130, 50]);
                                                                    addText(`   ↳ URL: ${cit.url}`, 8, 'normal', [100, 100, 100]);
                                                                });
                                                            }

                                                            // SWOT
                                                            if (r?.swot_analysis) {
                                                                addSection('SWOT Analysis');
                                                                ['strengths', 'weaknesses', 'opportunities', 'threats'].forEach(key => {
                                                                    addText(key.charAt(0).toUpperCase() + key.slice(1), 10, 'bold', [80, 80, 80]);
                                                                    r.swot_analysis[key]?.forEach(item => addText(`• ${item}`, 9, 'normal', [60, 60, 60]));
                                                                    y += 2;
                                                                });
                                                            }

                                                            // Key Risks
                                                            if (r?.key_risks?.length > 0) {
                                                                addSection('Key Risks');
                                                                r.key_risks.forEach(risk => {
                                                                    addText(`[${risk.severity}/5] ${risk.risk}`, 9, 'bold', [180, 50, 50]);
                                                                    addText(`   Mitigation: ${risk.mitigation}`, 9, 'normal', [80, 80, 80]);
                                                                });
                                                            }

                                                            // Competitors
                                                            if (r?.competitor_landscape?.length > 0) {
                                                                addSection('Competitor Landscape');
                                                                r.competitor_landscape.forEach(c => {
                                                                    addText(`${c.name} — ${c.positioning} [${c.threat_level}]`, 9, 'normal', [50, 50, 50]);
                                                                });
                                                            }

                                                            // Next Steps
                                                            if (r?.recommended_next_steps?.length > 0) {
                                                                addSection('Recommended Next Steps');
                                                                r.recommended_next_steps.forEach((step, i) => {
                                                                    addText(`${i + 1}. ${step.action} (${step.timeline}) [${step.priority}]`, 9, 'normal', [50, 50, 50]);
                                                                });
                                                            }

                                                            // Confidence
                                                            if (s?.overall_confidence_score) {
                                                                addSection(`Confidence Score: ${s.overall_confidence_score.score}/100`);
                                                                addText(s.overall_confidence_score.justification, 9, 'normal', [60, 60, 60]);
                                                            }

                                                            // Edge Cases
                                                            if (s?.edge_case_failures?.length > 0) {
                                                                addSection('Edge Case Vulnerabilities');
                                                                s.edge_case_failures.forEach(e => {
                                                                    const scenario = e.scenario || e;
                                                                    addText(`⚠ ${scenario}${e.impact ? ` [${e.impact}]` : ''}`, 9, 'normal', [180, 50, 50]);
                                                                });
                                                            }

                                                            // Logical Flaws
                                                            if (s?.logical_flaws?.length > 0) {
                                                                addSection('Logical Flaws');
                                                                s.logical_flaws.forEach(f => {
                                                                    addText(f.flaw || f, 9, 'bold', [200, 120, 30]);
                                                                    if (f.explanation) addText(`   ${f.explanation}`, 9, 'normal', [80, 80, 80]);
                                                                    if (f.recommendation) addText(`   → ${f.recommendation}`, 9, 'normal', [40, 140, 80]);
                                                                });
                                                            }

                                                            doc.save(`Audit_${companyName || 'Report'}.pdf`);
                                                        });
                                                    }}
                                                    className="flex items-center gap-2 text-xs font-bold text-obsidian bg-champagne hover:bg-[#B39B54] px-4 py-2 rounded-lg transition-colors"
                                                >
                                                    <Download size={14} /> Export Audit PDF
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* View 2: Action Plan */}
                                    <div
                                        className={`absolute inset-0 w-full h-full flex flex-col transition-transform duration-500 ease-in-out ${activeView === 'plan' ? 'translate-x-0 opacity-100 z-10' : 'translate-x-[110%] opacity-0 z-0'}`}
                                    >
                                        <p className="text-sm text-ivory/50 mb-4 tracking-wide font-mono uppercase text-xs">
                                            Compile solutions, notes, and strategic directives derived from the chat and analysis. Auto-saves to database.
                                        </p>
                                        <textarea
                                            value={actionPlan}
                                            onChange={(e) => setActionPlan(e.target.value)}
                                            className="grow w-full bg-[#111116]/80 border border-ivory/10 focus:border-champagne/40 rounded-xl p-4 text-sm text-ivory/90 outline-none resize-none custom-scrollbar mb-4 transition-colors"
                                            placeholder="Example: &#10;&#10;1. Pursue the AI healthcare risk mentioned in the SWOT threats.&#10;2. Draft marketing material specifically answering [Competitor X]'s positioning...&#10;&#10;All notes typed here are preserved."
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => {
                                                    import('jspdf').then(({ default: jsPDF }) => {
                                                        const doc = new jsPDF();
                                                        doc.setFillColor(15, 15, 20);
                                                        doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, 'F');
                                                        doc.setTextColor(255, 255, 255);
                                                        doc.setFontSize(20);
                                                        doc.setFont('helvetica', 'bold');
                                                        doc.text(`Action Plan: ${companyName || 'N/A'}`, 20, 22);
                                                        doc.setFontSize(9);
                                                        doc.setFont('helvetica', 'normal');
                                                        doc.setTextColor(200, 200, 200);
                                                        doc.text(`Generated ${new Date().toLocaleDateString()}`, 20, 32);

                                                        doc.setTextColor(50, 50, 50);
                                                        doc.setFontSize(10);
                                                        const lines = doc.splitTextToSize(actionPlan || "No plan recorded.", doc.internal.pageSize.getWidth() - 40);
                                                        let y = 50;
                                                        lines.forEach(line => {
                                                            if (y > 275) { doc.addPage(); y = 20; }
                                                            doc.text(line, 20, y);
                                                            y += 6;
                                                        });
                                                        doc.save(`ActionPlan_${companyName || 'Report'}.pdf`);
                                                    });
                                                }}
                                                disabled={!actionPlan.trim()}
                                                className="flex items-center gap-2 text-xs font-bold text-obsidian bg-ivory/90 hover:bg-white disabled:bg-ivory/20 disabled:text-ivory/50 px-4 py-2 rounded-lg transition-colors"
                                            >
                                                <Download size={14} /> Download Plan PDF
                                            </button>
                                        </div>
                                    </div>

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
