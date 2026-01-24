import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { 
  FileText, Sparkles, Download, RefreshCw, ArrowRight, Code, 
  CheckCircle, File, FileType, X, Mail, Linkedin, User 
} from 'lucide-react';
import LetterGlitch from './components/LetterGlitch';
import SplashCursor from './components/SplashCursor';

// --- CONFIGURATION ---
// This automatically picks up the URL from your .env file
// If .env is missing, it falls back to localhost (safe for local dev)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const AnimatedTitle = ({ text, className }) => {
  const containerRef = useRef(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  useGSAP(() => {
    const tl = gsap.timeline({ onComplete: () => setAnimationComplete(true) });
    tl.fromTo('.anim-char', 
      { y: 50, opacity: 0, rotateX: -90, filter: 'blur(10px)' },
      { y: 0, opacity: 1, rotateX: 0, filter: 'blur(0px)', stagger: 0.05, duration: 0.8, ease: 'back.out(1.7)' }
    );
  }, { scope: containerRef });

  if (animationComplete) {
    return (
      <h1 className={`${className} animate-fade-in`}>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#24E0F5] to-white bg-300% animate-gradient">
          {text}
        </span>
      </h1>
    );
  }
  return (
    <h1 ref={containerRef} className={`${className} overflow-hidden`}>
      {text.split('').map((char, index) => (
        <span key={index} className="anim-char inline-block origin-bottom text-white" style={{ minWidth: char === ' ' ? '0.3em' : 'auto' }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </h1>
  );
};

const ContactModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-black border border-[#24E0F5]/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(36,224,245,0.2)] transform transition-all animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#24E0F5]/10 border border-[#24E0F5]/20 mb-4 shadow-[0_0_15px_rgba(36,224,245,0.2)]">
            <User className="w-8 h-8 text-[#24E0F5]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Developer Contact</h2>
          <p className="text-gray-400 text-sm">Feel free to reach out for collaborations!</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#24E0F5]/30 transition-colors group">
            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#24E0F5]/10 transition-colors">
              <User className="w-5 h-5 text-gray-300 group-hover:text-[#24E0F5]" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Owner</div>
              <div className="text-white font-medium">Hassan Khan</div>
            </div>
          </div>
          <a href="mailto:hk747p@gmail.com" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#24E0F5]/30 transition-colors group cursor-pointer">
            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#24E0F5]/10 transition-colors">
              <Mail className="w-5 h-5 text-gray-300 group-hover:text-[#24E0F5]" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Email</div>
              <div className="text-white font-medium group-hover:text-[#24E0F5] transition-colors">hk747p@gmail.com</div>
            </div>
          </a>
          <a href="https://www.linkedin.com/in/hassansindhi/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#24E0F5]/30 transition-colors group cursor-pointer">
            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#24E0F5]/10 transition-colors">
              <Linkedin className="w-5 h-5 text-gray-300 group-hover:text-[#24E0F5]" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">LinkedIn</div>
              <div className="text-white font-medium group-hover:text-[#24E0F5] transition-colors">Connect on LinkedIn</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

const renderByte = (key) => {
  const code = parseInt(key);
  if (code >= 32 && code <= 126) {
    if (code === 32) return "SPACE";
    return String.fromCharCode(code);
  }
  if (code === 10) return "\\n";
  if (code === 9) return "\\t";
  return `0x${code.toString(16).toUpperCase().padStart(2, '0')}`;
};

function App() {
  const [file, setFile] = useState(null);
  const [inputText, setInputText] = useState(""); 
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [mode, setMode] = useState(true);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isCursorOn, setCursorOn] = useState(false);
  const isBinaryFile = file && !file.name.endsWith('.txt') && !file.name.endsWith('.huff') && !file.name.endsWith('.bin');

  const handleUpload = async () => {
    if (!file && !inputText) {
      alert("Please select a file or paste text first.");
      return;
    }

    setLoading(true);
    setStats(null);
    setDownloadUrl("");

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    } else {
      const blob = new Blob([inputText], { type: "text/plain" });
      formData.append("file", blob, "manual_input.txt");
    }

    // --- UPDATED: Uses API_URL Variable ---
    const endpoint = mode ? `${API_URL}/compress` : `${API_URL}/decompress`;

    try {
      const response = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data;
      if (data.stats) setStats(data.stats);
      
      // --- UPDATED: Uses API_URL Variable ---
      if (data.downloadLink) setDownloadUrl(`${API_URL}${data.downloadLink}`);
      
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please check the backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setStats(null);
    setFile(null);
    setInputText("");
    setDownloadUrl("");
  };

  return (
    <div className="text-white py-13 min-h-screen bg-[#080C16] relative overflow-x-hidden font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
        />
      </div>
      {isCursorOn && <SplashCursor />}

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        <div className="absolute top- right-6 z-50">
          <button
            onClick={() => setCursorOn(!isCursorOn)}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all duration-300 ${
              isCursorOn
                ? "bg-black/80 border-[#24E0F5]/40 text-white shadow-[0_0_10px_rgba(36,224,245,0.3)]"
                : "bg-white/15 border-white/10 text-gray-500 hover:text-white hover:bg-black/90 hover:border-white/30"
            }`}
          >
            {isCursorOn ? "Disable Effects" : "Enable Effects"}
          </button>
        </div>
        
        {/* HEADER */}
        <header className="flex justify-center mb-12 animate-fade-in">
          <div className="relative backdrop-blur-md bg-black/60 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl max-w-3xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#24E0F5]/20 to-[#24E0F5]/5 border border-[#24E0F5]/20 mb-6 shadow-[0_0_15px_rgba(36,224,245,0.3)]">
              <FileText className="w-8 h-8 text-[#24E0F5]" />
            </div>
            <AnimatedTitle
              text="Text Compressor"
              className="text-4xl md:text-6xl font-black mb-6 tracking-tight drop-shadow-lg"
            />
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-light mb-6">
              Compare compression algorithms side by side. Handles{" "}
              <span className="text-[#24E0F5]">.txt</span>,{" "}
              <span className="text-[#24E0F5]">.pdf</span>, and binaries using
              Huffman Encoding. But Since .pdf, docx files are already
              compressed so you may see a 0% reduction or maybe increase in size
              due to huffman header overhead.
            </p>
          </div>
        </header>

        {/* INPUT SECTION */}
        <div className="flex justify-center animate-fade-in-up delay-100 mb-12">
          <div className="w-full max-w-4xl relative backdrop-blur-md bg-black/60 border border-white/10 rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(36,224,245,0.1)]">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/10 relative">
                <div
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#24E0F5]/10 border border-[#24E0F5]/30 rounded-lg transition-all duration-300 ${
                    mode ? "left-1.5" : "left-[calc(50%+4px)]"
                  }`}
                ></div>
                <button
                  onClick={() => switchMode(true)}
                  className={`relative z-10 px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                    mode ? "text-[#24E0F5]" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Compress
                </button>
                <button
                  onClick={() => switchMode(false)}
                  className={`relative z-10 px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                    !mode ? "text-[#24E0F5]" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Decompress
                </button>
              </div>
              <button
                onClick={handleUpload}
                disabled={loading}
                className={`group relative px-8 py-3 bg-[#24E0F5] text-black font-bold rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(36,224,245,0.4)] hover:shadow-[0_0_30px_rgba(36,224,245,0.6)] ${
                  loading ? "opacity-70 cursor-wait" : ""
                }`}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center gap-2">
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {loading
                    ? "Processing..."
                    : mode
                    ? "Compress Now"
                    : "Decompress Now"}
                </span>
              </button>
            </div>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#24E0F5]/20 to-purple-500/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur"></div>
              <div className="relative bg-black/40 rounded-2xl border border-white/10 overflow-hidden">
                {isBinaryFile ? (
                  <div className="w-full h-64 flex flex-col items-center justify-center text-gray-500 bg-black/20">
                    <FileType className="w-16 h-16 mb-4 text-[#24E0F5] opacity-50" />
                    <p className="text-lg font-medium text-gray-300">
                      {file.name}
                    </p>
                    <p className="text-sm">
                      Binary file selected. Text preview unavailable.
                    </p>
                  </div>
                ) : (
                  <textarea
                    className="w-full h-64 bg-transparent text-gray-200 p-6 resize-none focus:outline-none placeholder-gray-600 font-mono text-sm leading-relaxed"
                    placeholder={
                      mode
                        ? "Paste text here OR select a file below..."
                        : "Upload your compressed file below..."
                    }
                    spellCheck="false"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={!!file}
                  ></textarea>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end pointer-events-none">
                  <div className="pointer-events-auto">
                    <label className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-colors text-xs text-gray-400 hover:text-white group/upload">
                      <File className="w-4 h-4 text-[#24E0F5] group-hover/upload:scale-110 transition-transform" />
                      <span>
                        {mode ? "Select File" : "Select Compressed File"}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files[0])}
                      />
                    </label>
                    {file && (
                      <span className="ml-3 text-xs text-[#24E0F5] animate-pulse">
                        {file.name} selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- STATS SECTION --- */}
        {mode && stats && stats.originalSize !== undefined && (
          <div className="flex justify-center mb-12 animate-fade-in-up">
            <div className="w-full max-w-4xl relative backdrop-blur-md bg-black/80 border border-[#24E0F5]/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(36,224,245,0.15)]">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-1 h-8 bg-[#24E0F5] rounded-full shadow-[0_0_10px_#24E0F5]"></span>
                Compression Analysis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider">
                    Original Size
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {stats.originalSize}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      bytes
                    </span>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-[#24E0F5]/10 border border-[#24E0F5]/30 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#24E0F5]/5 animate-pulse"></div>
                  <div className="relative z-10">
                    <div className="text-[#24E0F5] text-sm mb-1 uppercase tracking-wider font-bold">
                      Compressed Size
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {stats.compressedSize}{" "}
                      <span className="text-sm font-normal text-gray-500">
                        bytes
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider">
                    Reduction
                  </div>
                  <div className="text-3xl font-bold text-[#24E0F5]">
                    {stats.originalSize > 0
                      ? (
                          (1 - stats.compressedSize / stats.originalSize) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                </div>
              </div>

              {downloadUrl && (
                <div className="flex justify-center mb-10">
                  <a
                    href={downloadUrl}
                    download
                    className="flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all hover:scale-105 shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    Download Compressed File
                  </a>
                </div>
              )}

              {/* --- RESTORED: HUFFMAN DICTIONARY --- */}
              {stats.codes && (
                <div className="mt-8 border-t border-white/10 pt-8">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Code className="w-5 h-5 text-[#24E0F5]" />
                    Huffman Dictionary (Visualization)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    {/* We limit to top 256 for performance, though usually less */}
                    {Object.entries(stats.codes)
                      .slice(0, 256)
                      .map(([key, code]) => (
                        <div
                          key={key}
                          className="flex justify-between items-center bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm hover:border-[#24E0F5]/50 transition-colors"
                        >
                          <span className="font-mono text-[#24E0F5] font-bold">
                            {renderByte(key)}
                          </span>
                          <ArrowRight className="w-3 h-3 text-gray-600" />
                          <span className="font-mono text-gray-300 ml-2 truncate">
                            {code}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!mode && downloadUrl && (
          <div className="flex justify-center mb-12 animate-fade-in-up">
            <div className="w-full max-w-2xl relative backdrop-blur-md bg-green-900/20 border border-green-500/30 rounded-3xl p-10 shadow-[0_0_50px_rgba(34,197,94,0.15)] text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Decompression Successful!
              </h2>
              <div className="flex justify-center">
                <a
                  href={downloadUrl}
                  download
                  className="flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-green-500/20"
                >
                  <Download className="w-5 h-5" />
                  Download Decompressed File
                </a>
              </div>
            </div>
          </div>
        )}

        {!stats && !downloadUrl && (
          <div className="flex justify-center animate-fade-in-up delay-200">
            <div className="w-full max-w-4xl relative backdrop-blur-md bg-black/60 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <span className="w-1 h-8 bg-[#24E0F5] rounded-full shadow-[0_0_10px_#24E0F5]"></span>
                How Huffman Encoding Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-[#24E0F5]/30 hover:bg-[#24E0F5]/5 transition-all duration-300">
                  <div className="w-12 h-12 bg-[#24E0F5]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-[#24E0F5] font-mono font-bold text-xl">
                      01
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Frequency Analysis
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    The algorithm scans your file to count how often each byte
                    appears.
                  </p>
                </div>
                <div className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-[#24E0F5]/30 hover:bg-[#24E0F5]/5 transition-all duration-300">
                  <div className="w-12 h-12 bg-[#24E0F5]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-[#24E0F5] font-mono font-bold text-xl">
                      02
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Tree Construction
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    It builds a binary tree from the bottom up. Leaves are
                    characters.
                  </p>
                </div>
                <div className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-[#24E0F5]/30 hover:bg-[#24E0F5]/5 transition-all duration-300">
                  <div className="w-12 h-12 bg-[#24E0F5]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-[#24E0F5] font-mono font-bold text-xl">
                      03
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Binary Encoding
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    The original data is replaced with bit sequences.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="absolute bottom-0 w-full mt-20 border-t border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              © 2026 Text Compressor. Built with React & C++.
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://hassansindhi.vercel.app"
                className="text-gray-400 hover:text-[#24E0F5] transition-colors text-sm font-medium"
              >
                Portfolio
              </a>
              <a
                href="https://www.linkedin.com/in/hassansindhi/"
                className="text-gray-400 hover:text-[#24E0F5] transition-colors text-sm font-medium"
              >
                Linkedin
              </a>
              <a
                href="https://github.com/Hassan-code1"
                className="text-gray-400 hover:text-[#24E0F5] transition-colors text-sm font-medium"
              >
                Github
              </a>
              <button
                onClick={() => setIsContactOpen(true)}
                className="text-gray-400 hover:text-[#24E0F5] transition-colors text-sm font-medium"
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;